/**
 * 单个测验题目管理 API 路由
 * 处理测验题目的查询、更新、删除操作
 */

import {
  and,
  db,
  eq,
  lectureParticipants,
  lectures,
  quizItems,
} from '@repo/db';
import type { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  validateRequestBody,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';
import { quizItemSchemas } from '@/lib/schemas';

/**
 * 获取单个测验题目详情
 * GET /api/quiz-items/[id]
 */
export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    try {
      // 查询题目和关联的演讲信息
      const [quizItem] = await db
        .select({
          id: quizItems.id,
          lecture_id: quizItems.lecture_id,
          question: quizItems.question,
          options: quizItems.options,
          answer: quizItems.answer,
          ts: quizItems.ts,
          created_at: quizItems.created_at,
          lecture_owner_id: lectures.owner_id,
        })
        .from(quizItems)
        .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
        .where(eq(quizItems.id, id))
        .limit(1);

      if (!quizItem) {
        return createErrorResponse('题目不存在', 404);
      }

      // 检查用户是否是演讲创建者或参与者
      const isOwner = quizItem.lecture_owner_id === session.user.id;

      if (!isOwner) {
        // 检查是否是参与者
        const [participant] = await db
          .select({ id: lectureParticipants.id })
          .from(lectureParticipants)
          .where(
            and(
              eq(lectureParticipants.lecture_id, quizItem.lecture_id),
              eq(lectureParticipants.user_id, session.user.id)
            )
          )
          .limit(1);

        if (!participant) {
          return createErrorResponse('无权访问此题目', 403);
        }
      }

      // 返回题目信息（如果不是演讲创建者，隐藏答案）
      return createSuccessResponse({
        id: quizItem.id,
        lecture_id: quizItem.lecture_id,
        question: quizItem.question,
        options: quizItem.options,
        answer: isOwner ? quizItem.answer : undefined,
        ts: quizItem.ts,
        created_at: quizItem.created_at,
      });
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 更新测验题目
 * PUT /api/quiz-items/[id]
 */
export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    // 验证请求体
    const validationResult = await validateRequestBody(
      request,
      quizItemSchemas.create.omit({ lecture_id: true })
    );

    if (!validationResult.success) {
      return createErrorResponse(validationResult.error);
    }

    const { question, options, answer } = validationResult.data;

    try {
      // 先检查题目是否存在且用户有权限
      const [existingQuizItem] = await db
        .select({
          id: quizItems.id,
          lecture_id: quizItems.lecture_id,
          lecture_owner_id: lectures.owner_id,
          lecture_status: lectures.status,
        })
        .from(quizItems)
        .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
        .where(eq(quizItems.id, id))
        .limit(1);

      if (!existingQuizItem) {
        return createErrorResponse('题目不存在', 404);
      }

      if (existingQuizItem.lecture_owner_id !== session.user.id) {
        return createErrorResponse('无权修改此题目', 403);
      }

      // 检查演讲状态
      if (existingQuizItem.lecture_status === 'ended') {
        return createErrorResponse('已结束的演讲无法修改题目', 400);
      }

      // 更新题目
      const [updatedQuizItem] = await db
        .update(quizItems)
        .set({
          question,
          options,
          answer,
        })
        .where(eq(quizItems.id, id))
        .returning();

      return createSuccessResponse(updatedQuizItem, '题目更新成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 删除测验题目
 * DELETE /api/quiz-items/[id]
 */
export const DELETE = withErrorHandler(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    try {
      // 先检查题目是否存在且用户有权限
      const [existingQuizItem] = await db
        .select({
          id: quizItems.id,
          lecture_id: quizItems.lecture_id,
          lecture_owner_id: lectures.owner_id,
          lecture_status: lectures.status,
        })
        .from(quizItems)
        .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
        .where(eq(quizItems.id, id))
        .limit(1);

      if (!existingQuizItem) {
        return createErrorResponse('题目不存在', 404);
      }

      if (existingQuizItem.lecture_owner_id !== session.user.id) {
        return createErrorResponse('无权删除此题目', 403);
      }

      // 检查演讲状态
      if (existingQuizItem.lecture_status === 'ended') {
        return createErrorResponse('已结束的演讲无法删除题目', 400);
      }

      // 删除题目
      await db.delete(quizItems).where(eq(quizItems.id, id));

      return createSuccessResponse(null, '题目删除成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);
