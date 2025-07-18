/**
 * 答题记录管理 API 路由
 * 处理答题记录的创建、查询操作
 */

import {
  and,
  attempts,
  avg,
  count,
  db,
  eq,
  lectureParticipants,
  lectures,
  quizItems,
  sql,
  sum,
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
import { attemptSchemas } from '@/lib/schemas';

/**
 * 提交答题记录
 * POST /api/attempts
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
    attemptSchemas.submit
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { quiz_id, selected } = validationResult.data;

  try {
    // 查询题目和关联的演讲信息
    const [quizItem] = await db
      .select({
        id: quizItems.id,
        lecture_id: quizItems.lecture_id,
        question: quizItems.question,
        options: quizItems.options,
        answer: quizItems.answer,
        lecture_status: lectures.status,
      })
      .from(quizItems)
      .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
      .where(eq(quizItems.id, quiz_id))
      .limit(1);

    if (!quizItem) {
      return createErrorResponse('题目不存在', 404);
    }

    // 检查演讲状态
    if (quizItem.lecture_status === 'ended') {
      return createErrorResponse('演讲已结束，无法提交答题', 400);
    }

    if (quizItem.lecture_status === 'not_started') {
      return createErrorResponse('演讲尚未开始', 400);
    }

    // 检查用户是否参与了该演讲
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
      return createErrorResponse('请先加入演讲', 400);
    }

    // 检查是否已经提交过答案
    const [existingAttempt] = await db
      .select({ quiz_id: attempts.quiz_id })
      .from(attempts)
      .where(
        and(
          eq(attempts.quiz_id, quiz_id),
          eq(attempts.user_id, session.user.id)
        )
      )
      .limit(1);

    if (existingAttempt) {
      return createErrorResponse('您已经提交过答案了', 400);
    }

    // 计算是否正确和延迟时间
    const isCorrect = selected === quizItem.answer;
    const latencyMs = 1000; // 这里应该从客户端传入实际的延迟时间

    // 创建答题记录
    const [attempt] = await db
      .insert(attempts)
      .values({
        quiz_id,
        user_id: session.user.id,
        selected,
        is_correct: isCorrect,
        latency_ms: latencyMs,
      })
      .returning();

    return createSuccessResponse(
      {
        quiz_id: attempt.quiz_id,
        user_id: attempt.user_id,
        selected: attempt.selected,
        is_correct: attempt.is_correct,
        latency_ms: attempt.latency_ms,
        created_at: attempt.created_at,
        correct_answer: quizItem.answer,
      },
      '答题提交成功'
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
});

/**
 * 获取单个题目的统计
 */
async function getQuizStats(quiz_id: string, userId: string) {
  // 获取单个题目的统计
  const [quizItem] = await db
    .select({
      id: quizItems.id,
      lecture_id: quizItems.lecture_id,
      question: quizItems.question,
      options: quizItems.options,
      answer: quizItems.answer,
      lecture_owner_id: lectures.owner_id,
    })
    .from(quizItems)
    .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
    .where(eq(quizItems.id, quiz_id))
    .limit(1);

  if (!quizItem) {
    return { error: '题目不存在', status: 404 };
  }

  // 检查权限：只有演讲创建者能查看统计
  if (quizItem.lecture_owner_id !== userId) {
    return { error: '无权查看此题目统计', status: 403 };
  }

  // 查询统计数据
  const [stats] = await db
    .select({
      total_attempts: count(),
      correct_attempts: sum(
        sql`CASE WHEN ${attempts.is_correct} = true THEN 1 ELSE 0 END`
      ).mapWith(Number),
      average_latency: avg(attempts.latency_ms),
    })
    .from(attempts)
    .where(eq(attempts.quiz_id, quiz_id));

  // 统计各选项的选择次数
  const optionStats = await db
    .select({
      option_index: attempts.selected,
      count: count(),
    })
    .from(attempts)
    .where(eq(attempts.quiz_id, quiz_id))
    .groupBy(attempts.selected);

  return {
    data: {
      quiz_id,
      question: quizItem.question,
      options: quizItem.options,
      correct_answer: quizItem.answer,
      total_attempts: stats.total_attempts || 0,
      correct_attempts: stats.correct_attempts || 0,
      correct_rate: stats.total_attempts
        ? ((stats.correct_attempts || 0) / stats.total_attempts) * 100
        : 0,
      average_latency: stats.average_latency || 0,
      option_stats: optionStats,
    },
  };
}

/**
 * 获取演讲的统计
 */
async function getLectureStats(lecture_id: string, userId: string) {
  // 获取整个演讲的统计
  const [lecture] = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      owner_id: lectures.owner_id,
    })
    .from(lectures)
    .where(eq(lectures.id, lecture_id))
    .limit(1);

  if (!lecture) {
    return { error: '演讲不存在', status: 404 };
  }

  // 检查权限：只有演讲创建者能查看统计
  if (lecture.owner_id !== userId) {
    return { error: '无权查看此演讲统计', status: 403 };
  }

  // 查询演讲整体统计
  const [overallStats] = await db
    .select({
      total_questions: count(quizItems.id),
    })
    .from(quizItems)
    .where(eq(quizItems.lecture_id, lecture_id));

  const [participantStats] = await db
    .select({
      total_participants: count(),
    })
    .from(lectureParticipants)
    .where(eq(lectureParticipants.lecture_id, lecture_id));

  return {
    data: {
      lecture_id,
      lecture_title: lecture.title,
      total_questions: overallStats.total_questions || 0,
      total_participants: participantStats.total_participants || 0,
    },
  };
}

/**
 * 获取答题统计
 * GET /api/attempts/stats
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
    attemptSchemas.stats
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { quiz_id, lecture_id } = validationResult.data;

  try {
    if (quiz_id) {
      const result = await getQuizStats(quiz_id, session.user.id);
      if (result.error) {
        return createErrorResponse(result.error, result.status);
      }
      return createSuccessResponse(result.data);
    }

    if (lecture_id) {
      const result = await getLectureStats(lecture_id, session.user.id);
      if (result.error) {
        return createErrorResponse(result.error, result.status);
      }
      return createSuccessResponse(result.data);
    }

    return createErrorResponse('请指定 quiz_id 或 lecture_id', 400);
  } catch (error) {
    return handleDatabaseError(error);
  }
});
