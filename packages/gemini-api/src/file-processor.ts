/**
 * 文件处理器 - 负责上传文件到 Gemini API 并提取文本内容
 */
import type { GoogleGenAI } from '@google/genai';
import type { FileProcessingResult } from './types';

export class FileProcessor {
  constructor(private client: GoogleGenAI) {}

  /**
   * 上传文件并等待处理完成
   * @param file - 要上传的文件（File 对象或 Buffer）
   * @param mimeType - 文件的 MIME 类型
   * @param displayName - 文件显示名称（可选）
   * @returns 上传后的文件信息
   */
  async uploadAndProcess(
    file: File | Buffer | Blob,
    mimeType: string,
    displayName?: string
  ) {
    try {
      // 1. 上传文件到 Gemini API
      console.log(`开始上传文件: ${displayName || 'unnamed'}`);

      // 将 Buffer 转换为 Blob
      let uploadFile: File | Blob;
      if (Buffer.isBuffer(file)) {
        uploadFile = new Blob([file], { type: mimeType });
      } else {
        uploadFile = file;
      }

      const uploadedFile = await this.client.files.upload({
        file: uploadFile,
        config: {
          mimeType,
          displayName,
        },
      });

      if (!uploadedFile.name) {
        throw new Error('文件上传失败：未返回文件名');
      }

      console.log(`文件上传成功，文件名: ${uploadedFile.name}`);

      // 2. 轮询检查文件处理状态
      let fileInfo = await this.client.files.get({ name: uploadedFile.name });
      let attempts = 0;
      const maxAttempts = 60; // 最多等待 60 秒

      while (fileInfo.state === 'PROCESSING' && attempts < maxAttempts) {
        console.log(`文件处理中... (${attempts + 1}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待 1 秒
        fileInfo = await this.client.files.get({ name: uploadedFile.name });
        attempts++;
      }

      // 3. 检查最终状态
      if (fileInfo.state === 'FAILED') {
        throw new Error(
          `文件处理失败: ${fileInfo.error?.message || '未知错误'}`
        );
      }

      if (fileInfo.state === 'PROCESSING') {
        throw new Error('文件处理超时，请稍后重试');
      }

      console.log(`文件处理完成: ${fileInfo.name}`);
      return fileInfo;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw error;
    }
  }

  /**
   * 从上传的文件中提取文本内容
   * @param fileUri - Gemini API 返回的文件 URI
   * @param fileName - 原始文件名
   * @param mimeType - 文件 MIME 类型
   * @returns 提取的文本内容
   */
  async extractText(
    fileUri: string,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    try {
      // 根据文件类型定制提取提示词
      const prompt = this.getExtractionPrompt(fileName, mimeType);

      console.log(`开始提取文本内容: ${fileName}`);
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                fileData: {
                  fileUri,
                  mimeType,
                },
              },
            ],
          },
        ],
      });

      const response = result;
      const extractedText = response.text;

      if (!extractedText) {
        throw new Error('无法从文件中提取文本内容');
      }

      console.log(`文本提取成功，长度: ${extractedText.length} 字符`);
      return extractedText;
    } catch (error) {
      console.error('文本提取失败:', error);
      throw error;
    }
  }

  /**
   * 处理文件并返回完整结果
   * @param file - 要处理的文件
   * @param fileName - 文件名
   * @param mimeType - MIME 类型
   * @returns 文件处理结果
   */
  async processFile(
    file: File | Buffer | Blob,
    fileName: string,
    mimeType: string
  ): Promise<FileProcessingResult> {
    // 1. 上传并处理文件
    const fileInfo = await this.uploadAndProcess(file, mimeType, fileName);

    if (!fileInfo.uri) {
      throw new Error('文件上传成功但未返回 URI');
    }

    // 2. 提取文本内容
    const extractedText = await this.extractText(
      fileInfo.uri,
      fileName,
      mimeType
    );

    return {
      fileName,
      fileType: mimeType,
      extractedText,
      geminiFileUri: fileInfo.uri,
    };
  }

  /**
   * 根据文件类型生成适当的提取提示词
   * @param fileName - 文件名
   * @param mimeType - MIME 类型
   * @returns 提取提示词
   */
  private getExtractionPrompt(fileName: string, mimeType: string): string {
    const basePrompt =
      '请提取并整理以下文件的全部文本内容。保持原文的结构和格式，但转换为纯文本形式。';

    const typeSpecificPrompts: Record<string, string> = {
      'application/pdf': `${basePrompt}
如果是演示文稿或文档，请保持章节和段落结构。
如果包含表格，请以文本形式清晰呈现表格内容。`,

      'application/vnd.openxmlformats-officedocument.presentationml.presentation': `${basePrompt}
请按幻灯片顺序整理内容，每张幻灯片用明确的分隔标记。
包括幻灯片标题、正文内容和备注（如果有）。
格式示例：
=== 第1页 ===
[标题]
[内容]
[备注]`,

      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': `${basePrompt}
保持文档的标题层级结构。
保留重要的格式信息（如列表、表格等）。`,

      'audio/mpeg': `${basePrompt}
请提供完整、准确的音频转录文本。
如果能识别说话人，请标注说话人。
包括重要的非语言信息（如掌声、音乐等）。`,

      'video/mp4': `${basePrompt}
请提供视频中的完整语音转录。
如果有多个说话人，请尽可能区分标注。
包括重要的视觉信息描述（如演示内容、关键画面等）。`,

      'text/plain': `${basePrompt}
直接返回文件的完整内容，保持原有格式。`,
    };

    // 根据 MIME 类型选择提示词
    const specificPrompt = Object.entries(typeSpecificPrompts).find(([type]) =>
      mimeType.startsWith(type)
    )?.[1];

    return `${specificPrompt || basePrompt}\n\n文件名：${fileName}`;
  }
}
