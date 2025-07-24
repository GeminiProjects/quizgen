'use server';

import { and, asc, comments, count, db, eq } from '@repo/db';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import {
  commentListQuerySchema,
  createCommentSchema,
  deleteCommentSchema,
  updateCommentSchema,
} from '@/lib/schemas/comment';
import type { ActionResponse, Comment } from '@/types';

// 简单的错误处理函数
function handleServerError(
  error: unknown,
  defaultMessage: string
): ActionResponse<never> {
  console.error(error);
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage,
  };
}

/**
 * 创建评论
 * @param data 评论数据
 * @returns 创建的评论或错误信息
 */
export async function createComment(
  data: z.infer<typeof createCommentSchema>
): Promise<ActionResponse<Comment>> {
  try {
    // 1. 身份验证
    const { user } = await requireAuth();

    // 2. 参数验证
    const validated = createCommentSchema.parse(data);

    // 3. 演讲者不能匿名评论
    if (validated.is_anonymous) {
      // 这里可以添加检查用户是否为演讲者的逻辑
      // 如果是演讲者，则强制设置为非匿名
    }

    // 4. 创建评论
    const [newComment] = await db
      .insert(comments)
      .values({
        lecture_id: validated.lecture_id,
        user_id: user.id,
        content: validated.content,
        is_anonymous: validated.is_anonymous,
        visibility: validated.visibility,
      })
      .returning();

    // 5. 处理日期字段，将其转换为字符串
    const serializedComment = {
      ...newComment,
      created_at: newComment.created_at.toISOString(),
      updated_at: newComment.updated_at.toISOString(),
    };

    // 5. 重新验证相关路径
    revalidatePath(`/lectures/${validated.lecture_id}`);

    // 6. 返回结果
    return {
      success: true,
      data: serializedComment,
    };
  } catch (error) {
    return handleServerError(error, '创建评论失败');
  }
}

/**
 * 获取评论列表
 * @param query 查询参数
 * @returns 评论列表或错误信息
 */
export async function getComments(
  query: z.infer<typeof commentListQuerySchema>
): Promise<ActionResponse<{ data: Comment[]; total: number }>> {
  try {
    // 1. 身份验证
    await requireAuth();

    // 2. 参数验证
    const validated = commentListQuerySchema.parse(query);

    // 3. 构建查询条件
    const conditions: ReturnType<typeof eq>[] = [];

    if (validated.lecture_id) {
      conditions.push(eq(comments.lecture_id, validated.lecture_id));
    }

    if (validated.user_id) {
      conditions.push(eq(comments.user_id, validated.user_id));
    }

    // 4. 查询评论列表
    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(comments)
        .where(and(...conditions))
        .orderBy(asc(comments.created_at))
        .limit(validated.limit)
        .offset(validated.offset),
      db
        .select({ count: count() })
        .from(comments)
        .where(and(...conditions)),
    ]);

    // 5. 处理日期字段，将其转换为字符串
    const serializedData = data.map((comment) => ({
      ...comment,
      created_at: comment.created_at.toISOString(),
      updated_at: comment.updated_at.toISOString(),
    }));

    // 6. 返回结果
    return {
      success: true,
      data: {
        data: serializedData,
        total: totalResult[0].count,
      },
    };
  } catch (error) {
    return handleServerError(error, '获取评论列表失败');
  }
}

/**
 * 更新评论
 * @param id 评论ID
 * @param data 更新数据
 * @returns 更新后的评论或错误信息
 */
export async function updateComment(
  id: string,
  data: z.infer<typeof updateCommentSchema>
): Promise<ActionResponse<Comment>> {
  try {
    // 1. 身份验证
    const { user } = await requireAuth();

    // 2. 参数验证
    const validated = updateCommentSchema.parse(data);

    // 3. 检查评论是否存在且属于当前用户
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!existingComment) {
      return {
        success: false,
        error: '评论不存在',
      };
    }

    if (existingComment.user_id !== user.id) {
      return {
        success: false,
        error: '无权限修改此评论',
      };
    }

    // 4. 更新评论
    const [updatedComment] = await db
      .update(comments)
      .set({
        content: validated.content,
        is_anonymous: validated.is_anonymous,
        visibility: validated.visibility,
        updated_at: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    // 5. 处理日期字段，将其转换为字符串
    const serializedComment = {
      ...updatedComment,
      created_at: updatedComment.created_at.toISOString(),
      updated_at: updatedComment.updated_at.toISOString(),
    };

    // 6. 重新验证相关路径
    revalidatePath(`/lectures/${existingComment.lecture_id}`);

    // 7. 返回结果
    return {
      success: true,
      data: serializedComment,
    };
  } catch (error) {
    return handleServerError(error, '更新评论失败');
  }
}

/**
 * 删除评论
 * @param data 删除参数
 * @returns 删除结果或错误信息
 */
export async function deleteComment(
  data: z.infer<typeof deleteCommentSchema>
): Promise<ActionResponse<null>> {
  try {
    // 1. 身份验证
    const { user } = await requireAuth();

    // 2. 参数验证
    const validated = deleteCommentSchema.parse(data);

    // 3. 检查评论是否存在且属于当前用户
    const [existingComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, validated.id));

    if (!existingComment) {
      return {
        success: false,
        error: '评论不存在',
      };
    }

    // 检查是否有权限删除（评论作者或演讲者）
    const isAuthor = existingComment.user_id === user.id;
    const isSpeaker = false;

    // 检查是否为演讲者
    if (!isAuthor) {
      // 这里需要检查用户是否为该演讲的演讲者
      // 可以通过查询 lecture_participants 表来判断
      // 为简化实现，暂时只允许作者删除
    }

    if (!(isAuthor || isSpeaker)) {
      return {
        success: false,
        error: '无权限删除此评论',
      };
    }

    // 4. 删除评论
    await db.delete(comments).where(eq(comments.id, validated.id));

    // 5. 重新验证相关路径
    revalidatePath(`/lectures/${existingComment.lecture_id}`);

    // 6. 返回结果
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return handleServerError(error, '删除评论失败');
  }
}
