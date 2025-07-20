/**
 * 文件处理器 - 负责上传文件到 Gemini API 并提取文本内容
 */
import type { File as File_2, GoogleGenAI } from '@google/genai';
import type { FileProcessingResult } from './types';

export class FileProcessor {
  private readonly MAX_PROCESSING_ATTEMPTS = 60;
  private readonly PROCESSING_POLL_INTERVAL = 1000;

  constructor(private client: GoogleGenAI) {}

  /**
   * 将文件转换为可上传的格式
   */
  private prepareFileForUpload(
    file: File | Buffer | Blob,
    mimeType: string
  ): File | Blob {
    if (Buffer.isBuffer(file)) {
      return new Blob([file], { type: mimeType });
    }
    return file;
  }

  /**
   * 执行文件上传操作
   */
  private async performUpload(
    file: File | Blob,
    mimeType: string,
    displayName?: string
  ): Promise<File_2> {
    try {
      const uploadedFile = await this.client.files.upload({
        file,
        config: {
          mimeType,
          displayName,
        },
      });

      if (!uploadedFile.name) {
        throw new Error('文件上传失败：未返回文件名');
      }

      return uploadedFile;
    } catch (uploadError) {
      console.error('Gemini API 上传失败细节:', {
        error: uploadError,
        message:
          uploadError instanceof Error ? uploadError.message : 'Unknown error',
        stack: uploadError instanceof Error ? uploadError.stack : undefined,
        mimeType,
        displayName,
        fileSize: file instanceof Blob ? file.size : 'unknown',
      });
      throw new Error(
        `Gemini API 文件上传失败: ${
          uploadError instanceof Error ? uploadError.message : '未知错误'
        }`
      );
    }
  }

  /**
   * 等待文件处理完成
   */
  private async waitForFileProcessing(fileName: string): Promise<File_2> {
    let fileInfo = await this.client.files.get({ name: fileName });
    let attempts = 0;

    while (
      fileInfo.state === 'PROCESSING' &&
      attempts < this.MAX_PROCESSING_ATTEMPTS
    ) {
      console.log(
        `文件处理中... (${attempts + 1}/${this.MAX_PROCESSING_ATTEMPTS})`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, this.PROCESSING_POLL_INTERVAL)
      );
      fileInfo = await this.client.files.get({ name: fileName });
      attempts++;
    }

    // 检查处理结果
    if (fileInfo.state === 'FAILED') {
      throw new Error(`文件处理失败: ${fileInfo.error?.message || '未知错误'}`);
    }

    if (fileInfo.state === 'PROCESSING') {
      throw new Error('文件处理超时，请稍后重试');
    }

    return fileInfo;
  }

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
  ): Promise<File_2> {
    try {
      console.log(`开始上传文件: ${displayName || 'unnamed'}`);

      // 1. 准备文件
      const uploadFile = this.prepareFileForUpload(file, mimeType);

      // 2. 执行上传
      const uploadedFile = await this.performUpload(
        uploadFile,
        mimeType,
        displayName
      );
      console.log(`文件上传成功，文件名: ${uploadedFile.name}`);

      // 3. 等待处理完成
      const processedFile = await this.waitForFileProcessing(
        uploadedFile.name || 'unknown'
      );
      console.log(`文件处理完成: ${processedFile.name}`);

      return processedFile;
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
        model: 'gemini-2.5-pro',
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
如果包含表格，请以文本形式清晰呈现表格内容。
如果是扫描版PDF，请尽可能准确识别文字。`,

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
