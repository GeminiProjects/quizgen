'use server';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateContext } from '@repo/ai';
import { db, eq, lectures, materials } from '@repo/db';
import type { FilePart } from 'ai';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import type { ActionResult, Material } from '@/types';
import {
  assertOwnership,
  createErrorResponse,
  createSuccessResponse,
  handleActionError,
} from './utils';

/**
 * 处理材料文件上传和内容提取
 *
 * @param input - 上传参数
 * @param input.lectureId - 演讲 ID
 * @param input.fileName - 文件名
 * @param input.fileType - 文件类型
 * @param input.fileData - 文件数据（Base64 编码）
 * @returns 创建的材料记录
 */
export async function uploadMaterial(input: {
  lectureId: string;
  fileName: string;
  fileType: string;
  fileData: string;
}): Promise<ActionResult<Material>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, input.lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 创建材料记录（初始状态为 processing）
    const [material] = await db
      .insert(materials)
      .values({
        lecture_id: input.lectureId,
        file_name: input.fileName,
        file_type: input.fileType,
        status: 'processing',
        created_by: session.user.id,
      })
      .returning();

    // 异步处理文件内容提取
    processFileAsync(material.id, input).catch(async (error) => {
      console.error('文件处理失败:', error);

      // 处理失败，删除材料记录（根据需求，失败的材料会被自动删除）
      try {
        await db.delete(materials).where(eq(materials.id, material.id));
        console.log(`已删除失败的材料记录: ${material.id}`);
      } catch (deleteError) {
        console.error('删除失败记录时出错:', deleteError);
      }
    });

    // 重验证演讲详情页
    revalidatePath(`/lectures/${input.lectureId}`);

    return createSuccessResponse(material);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取材料的实时处理状态（用于 SSE）
 *
 * @param materialId - 材料 ID
 * @returns 材料状态和内容
 */
export async function getMaterialProcessingStatus(materialId: string): Promise<
  ActionResult<{
    status: string;
    textContent?: string;
    error?: string;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询材料及其所属演讲
    const [material] = await db
      .select({
        material: materials,
        lecture_owner_id: lectures.owner_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!material) {
      return createErrorResponse('材料不存在');
    }

    // 验证权限
    assertOwnership(material.lecture_owner_id, session.user.id, '演讲材料');

    return createSuccessResponse({
      status: material.material.status,
      textContent: material.material.text_content || undefined,
      error: material.material.error_message || undefined,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 异步处理文件内容提取
 *
 * @param materialId - 材料 ID
 * @param input - 文件信息
 */
async function processFileAsync(
  materialId: string,
  input: {
    fileName: string;
    fileType: string;
    fileData: string;
  }
) {
  try {
    // 检查 API Key
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('缺少 GOOGLE_GENERATIVE_AI_API_KEY 环境变量');
    }

    // 创建 Google AI 客户端
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    // 将 Base64 转换为 Buffer
    const buffer = Buffer.from(input.fileData, 'base64');

    // 创建文件部分，符合 AI SDK 的 FilePart 类型
    const filePart: FilePart = {
      type: 'file',
      data: buffer,
      filename: input.fileName,
      mediaType: input.fileType,
    };

    // 生成上下文（流式处理）
    const result = generateContext({
      model: google('gemini-2.0-flash-exp'),
      file: filePart,
    });

    // 收集完整的文本内容
    let fullText = '';

    // 处理流式响应
    for await (const chunk of result.textStream) {
      fullText += chunk;

      // 定期更新数据库中的部分内容（每 1000 字符更新一次）
      if (fullText.length % 1000 === 0) {
        await db
          .update(materials)
          .set({
            text_content: fullText,
          })
          .where(eq(materials.id, materialId));
      }
    }

    // 更新最终状态
    await db
      .update(materials)
      .set({
        status: 'completed',
        text_content: fullText,
      })
      .where(eq(materials.id, materialId));

    console.log(`材料处理完成: ${materialId}, 提取了 ${fullText.length} 字符`);
  } catch (error) {
    console.error(`材料处理失败 (${materialId}):`, error);

    // 处理超时错误
    const isTimeout =
      error instanceof Error && error.message.includes('timeout');

    if (isTimeout) {
      // 超时状态
      await db
        .update(materials)
        .set({
          status: 'timeout',
          error_message: '处理超时，请重试',
        })
        .where(eq(materials.id, materialId));
    } else {
      // 其他错误，删除记录
      throw error;
    }
  }
}
