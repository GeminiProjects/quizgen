/**
 * 测验题目管理 API 路由
 * 处理测验题目的创建、查询操作
 */

import {
  and,
  count,
  db,
  desc,
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
  validateSearchParams,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';
import { quizItemSchemas } from '@/lib/schemas';

/**
 * 创建测验题目
 * POST /api/quiz-items
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  // 验证请求体
  const validationResult = await validateRequestBody(
    request,
    quizItemSchemas.create
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { question, options, answer, lecture_id } = validationResult.data;

  try {
    // 验证演讲是否存在且用户有权限
    const [lecture] = await db
      .select({
        id: lectures.id,
        owner_id: lectures.owner_id,
        status: lectures.status,
      })
      .from(lectures)
      .where(eq(lectures.id, lecture_id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在', 404);
    }

    if (lecture.owner_id !== session.user.id) {
      return createErrorResponse('无权在此演讲中创建题目', 403);
    }

    // 检查演讲状态
    if (lecture.status === 'ended') {
      return createErrorResponse('已结束的演讲无法创建题目', 400);
    }

    // 创建测验题目
    const [quizItem] = await db
      .insert(quizItems)
      .values({
        lecture_id,
        question,
        options,
        answer,
        ts: new Date(),
      })
      .returning();

    return createSuccessResponse(
      {
        id: quizItem.id,
        lecture_id: quizItem.lecture_id,
        question: quizItem.question,
        options: quizItem.options,
        answer: quizItem.answer,
        ts: quizItem.ts,
        created_at: quizItem.created_at,
      },
      '题目创建成功'
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
});

/**
 * 获取测验题目列表
 * GET /api/quiz-items
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  // 验证查询参数
  const validationResult = validateSearchParams(
    request.nextUrl.searchParams,
    quizItemSchemas.list
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { lecture_id, page, limit } = validationResult.data;

  try {
    // 验证演讲是否存在且用户有权限访问
    const [lecture] = await db
      .select({
        id: lectures.id,
        owner_id: lectures.owner_id,
        status: lectures.status,
      })
      .from(lectures)
      .where(eq(lectures.id, lecture_id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在', 404);
    }

    // 验证用户是否是演讲创建者或参与者
    if (lecture.owner_id !== session.user.id) {
      // 检查是否是参与者
      const [participant] = await db
        .select({ id: lectureParticipants.id })
        .from(lectureParticipants)
        .where(
          and(
            eq(lectureParticipants.lecture_id, lecture_id),
            eq(lectureParticipants.user_id, session.user.id)
          )
        )
        .limit(1);

      if (!participant) {
        return createErrorResponse('无权访问此演讲的题目', 403);
      }
    }

    // 查询题目列表
    const [quizItemList, totalCount] = await Promise.all([
      db
        .select({
          id: quizItems.id,
          lecture_id: quizItems.lecture_id,
          question: quizItems.question,
          options: quizItems.options,
          answer: quizItems.answer,
          ts: quizItems.ts,
          created_at: quizItems.created_at,
        })
        .from(quizItems)
        .where(eq(quizItems.lecture_id, lecture_id))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(quizItems.ts)),

      db
        .select({ count: count() })
        .from(quizItems)
        .where(eq(quizItems.lecture_id, lecture_id))
        .then((result) => result[0].count),
    ]);

    // 如果不是演讲创建者，隐藏答案
    const isOwner = lecture.owner_id === session.user.id;
    const processedQuizItems = quizItemList.map((item) => ({
      ...item,
      answer: isOwner ? item.answer : undefined,
    }));

    return createSuccessResponse({
      data: processedQuizItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
});
