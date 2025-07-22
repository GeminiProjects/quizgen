'use server';

import {
  and,
  attempts,
  authUser,
  count,
  db,
  desc,
  eq,
  formatLectureCode,
  ilike,
  isValidLectureCode,
  lectureParticipants,
  lectures,
  or,
  quizItems,
  sql,
} from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { participationSchemas } from '@/lib/schemas/participation';
import type {
  ActionResult,
  LectureStatus,
  PaginatedResult,
  ParticipantRole,
  ParticipantStatus,
  ParticipatedLecture,
  QuizAttempt,
} from '@/types';
import {
  buildConditions,
  createErrorResponse,
  createPaginatedResponse,
  createPaginationParams,
  createSuccessResponse,
  handleActionError,
} from './utils';

/**
 * 获取用户参与的演讲列表
 *
 * @param params - 查询参数
 * @param params.page - 页码（默认 1）
 * @param params.limit - 每页数量（默认 50）
 * @param params.search - 搜索关键词（可选）
 * @param params.status - 演讲状态筛选（可选）
 * @returns 分页的参与演讲列表
 */
export async function getParticipatedLectures(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
}): Promise<ActionResult<PaginatedResult<ParticipatedLecture>>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 处理分页参数
    const { page, limit, offset } = createPaginationParams(params);

    // 构建查询条件
    const baseCondition = eq(lectureParticipants.user_id, session.user.id);
    const additionalConditions = [
      params?.status ? eq(lectures.status, params.status) : undefined,
      params?.search
        ? or(
            ilike(lectures.title, `%${params.search}%`),
            ilike(lectures.description, `%${params.search}%`),
            ilike(authUser.name, `%${params.search}%`)
          )
        : undefined,
    ];

    const conditions = buildConditions(baseCondition, additionalConditions);
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // 并行查询数据和总数
    const [data, total] = await Promise.all([
      // 查询参与的演讲数据
      db
        .select({
          id: lectures.id,
          title: lectures.title,
          description: lectures.description,
          owner_id: lectures.owner_id,
          org_id: lectures.org_id,
          status: lectures.status,
          starts_at: lectures.starts_at,
          ends_at: lectures.ends_at,
          created_at: lectures.created_at,
          updated_at: lectures.updated_at,
          owner_name: authUser.name,
          joined_at: lectureParticipants.joined_at,
          participant_role: lectureParticipants.role,
          participant_status: lectureParticipants.status,
          _count: {
            quiz_items: sql<number>`(select count(*) from ${quizItems} where ${quizItems.lecture_id} = ${lectures.id})`,
          },
        })
        .from(lectureParticipants)
        .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
        .innerJoin(authUser, eq(lectures.owner_id, authUser.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(lectureParticipants.joined_at)),

      // 查询总数
      db
        .select({ count: count() })
        .from(lectureParticipants)
        .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    return createSuccessResponse(
      createPaginatedResponse(data, total, page, limit)
    );
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 通过演讲码加入演讲
 *
 * @param data - 包含演讲码的数据
 * @param data.join_code - 演讲码
 * @returns 加入的演讲信息
 */
export async function joinLectureByCode(data: { join_code: string }): Promise<
  ActionResult<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    is_owner: boolean;
    already_joined: boolean;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = participationSchemas.joinByCode.parse(data);

    // 格式化并验证演讲码
    const formattedCode = formatLectureCode(validated.join_code);
    if (!isValidLectureCode(formattedCode)) {
      return createErrorResponse('无效的演讲码格式');
    }

    // 查询演讲
    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.join_code, formattedCode))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在或演讲码错误');
    }

    // 检查演讲状态
    if (lecture.status === 'ended') {
      return createErrorResponse('演讲已结束');
    }

    // 检查是否已参与
    const [existing] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lecture.id),
          eq(lectureParticipants.user_id, session.user.id)
        )
      )
      .limit(1);

    // 如果尚未参与，创建参与记录
    if (!existing) {
      await db.insert(lectureParticipants).values({
        lecture_id: lecture.id,
        user_id: session.user.id,
        role: lecture.owner_id === session.user.id ? 'speaker' : 'audience',
        status: 'joined',
        joined_at: new Date(),
      });
    }

    // 重验证参与页面
    revalidatePath('/participation');

    return createSuccessResponse({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      status: lecture.status,
      is_owner: lecture.owner_id === session.user.id,
      already_joined: !!existing,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 退出演讲
 *
 * @param lectureId - 演讲 ID
 * @returns 是否退出成功
 */
export async function exitLecture(
  lectureId: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证参与状态
    const [participant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, session.user.id)
        )
      )
      .limit(1);

    if (!participant) {
      return createErrorResponse('您未参与该演讲');
    }

    // 更新参与状态
    await db
      .update(lectureParticipants)
      .set({
        status: 'left',
        left_at: new Date(),
        updated_at: new Date(),
      })
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, session.user.id)
        )
      );

    // 重验证参与页面
    revalidatePath('/participation');

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 提交测验答题记录
 *
 * @param data - 答题数据
 * @param data.quiz_id - 测验题目 ID
 * @param data.selected - 选择的答案索引
 * @param data.latency_ms - 答题时间（毫秒）
 * @returns 答题结果
 */
export async function submitQuizAttempt(data: {
  quiz_id: string;
  selected: number;
  latency_ms: number;
}): Promise<
  ActionResult<{
    is_correct: boolean;
    correct_answer: number;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = participationSchemas.submitAttempt.parse(data);

    // 获取题目信息以验证答案
    const [quiz] = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.id, validated.quiz_id))
      .limit(1);

    if (!quiz) {
      return createErrorResponse('题目不存在');
    }

    // 检查是否已答过题
    const [existing] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.quiz_id, validated.quiz_id),
          eq(attempts.user_id, session.user.id)
        )
      )
      .limit(1);

    if (existing) {
      return createErrorResponse('您已经回答过这道题了');
    }

    // 判断答案是否正确
    const isCorrect = quiz.answer === validated.selected;

    // 保存答题记录
    await db.insert(attempts).values({
      quiz_id: validated.quiz_id,
      user_id: session.user.id,
      selected: validated.selected,
      is_correct: isCorrect,
      latency_ms: validated.latency_ms,
      created_at: new Date(),
    });

    // 重验证参与页面
    revalidatePath(`/participation/${quiz.lecture_id}`);

    return createSuccessResponse({
      is_correct: isCorrect,
      correct_answer: quiz.answer,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取用户在某个演讲中的答题记录
 *
 * @param lectureId - 演讲 ID
 * @returns 答题记录列表
 */
export async function getMyQuizAttempts(lectureId: string): Promise<
  ActionResult<
    Array<{
      quiz_id: string;
      selected: number;
      is_correct: boolean;
      latency_ms: number | null;
      created_at: string;
      question: string;
      options: string[];
      answer: number;
    }>
  >
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询答题记录
    const data = await db
      .select({
        quiz_id: attempts.quiz_id,
        selected: attempts.selected,
        is_correct: attempts.is_correct,
        latency_ms: attempts.latency_ms,
        created_at: attempts.created_at,
        question: quizItems.question,
        options: quizItems.options,
        answer: quizItems.answer,
      })
      .from(attempts)
      .innerJoin(quizItems, eq(attempts.quiz_id, quizItems.id))
      .where(
        and(
          eq(attempts.user_id, session.user.id),
          eq(quizItems.lecture_id, lectureId)
        )
      )
      .orderBy(desc(attempts.created_at));

    return createSuccessResponse(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取参与的演讲详情及测验题目
 *
 * @param lectureId - 演讲 ID
 * @returns 演讲详情和测验题目（包含答题状态）
 */
export async function getParticipatedLectureWithQuizzes(
  lectureId: string
): Promise<ActionResult<ParticipatedLecture>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证用户是否参与了该演讲
    const participant = await validateParticipation(lectureId, session.user.id);
    if (!participant.success) {
      return participant;
    }

    // 获取演讲详情
    const lectureResult = await fetchLectureDetails(lectureId);
    if (!lectureResult.success) {
      return lectureResult;
    }

    // 获取测验题目和答题记录
    const quizzesResult = await fetchQuizzesWithAttempts(
      lectureId,
      session.user.id
    );
    if (!quizzesResult.success) {
      return quizzesResult;
    }

    // 组合数据并返回
    return createSuccessResponse({
      ...lectureResult.data,
      status: lectureResult.data.status as LectureStatus,
      participant_role: participant.data.role as ParticipantRole,
      participant_status: participant.data.status as ParticipantStatus,
      joined_at: participant.data.joined_at,
      quizzes: quizzesResult.data,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 验证用户是否参与了演讲
 *
 * @param lectureId - 演讲 ID
 * @param userId - 用户 ID
 * @returns 参与信息
 */
async function validateParticipation(
  lectureId: string,
  userId: string
): Promise<
  ActionResult<{
    role: string;
    status: string;
    joined_at: string;
  }>
> {
  const [participant] = await db
    .select()
    .from(lectureParticipants)
    .where(
      and(
        eq(lectureParticipants.lecture_id, lectureId),
        eq(lectureParticipants.user_id, userId)
      )
    )
    .limit(1);

  if (!participant) {
    return createErrorResponse('您未参与该演讲');
  }

  return createSuccessResponse(participant);
}

/**
 * 获取演讲详情
 *
 * @param lectureId - 演讲 ID
 * @returns 演讲详情
 */
async function fetchLectureDetails(lectureId: string): Promise<
  ActionResult<{
    id: string;
    title: string;
    description: string | null;
    owner_id: string;
    org_id: string | null;
    status: string;
    starts_at: string;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    owner_name: string | null;
  }>
> {
  const [lecture] = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      description: lectures.description,
      owner_id: lectures.owner_id,
      org_id: lectures.org_id,
      status: lectures.status,
      starts_at: lectures.starts_at,
      ends_at: lectures.ends_at,
      created_at: lectures.created_at,
      updated_at: lectures.updated_at,
      owner_name: authUser.name,
    })
    .from(lectures)
    .leftJoin(authUser, eq(lectures.owner_id, authUser.id))
    .where(eq(lectures.id, lectureId))
    .limit(1);

  if (!lecture) {
    return createErrorResponse('演讲不存在');
  }

  return createSuccessResponse(lecture);
}

/**
 * 获取测验题目和用户的答题记录
 *
 * @param lectureId - 演讲 ID
 * @param userId - 用户 ID
 * @returns 测验题目列表（包含答题状态）
 */
async function fetchQuizzesWithAttempts(
  lectureId: string,
  userId: string
): Promise<
  ActionResult<
    Array<{
      id: string;
      question: string;
      options: string[];
      ts: string;
      created_at: string;
      attempted: boolean;
      my_attempt?: QuizAttempt;
    }>
  >
> {
  // 获取测验题目（不包含答案）
  const quizzes = await db
    .select({
      id: quizItems.id,
      question: quizItems.question,
      options: quizItems.options,
      ts: quizItems.ts,
      created_at: quizItems.created_at,
    })
    .from(quizItems)
    .where(eq(quizItems.lecture_id, lectureId))
    .orderBy(desc(quizItems.created_at));

  // 获取用户的答题记录
  const myAttempts = await db
    .select({
      quiz_id: attempts.quiz_id,
      selected: attempts.selected,
      is_correct: attempts.is_correct,
    })
    .from(attempts)
    .where(
      and(
        eq(attempts.user_id, userId),
        sql`${attempts.quiz_id} IN (SELECT id FROM ${quizItems} WHERE lecture_id = ${lectureId})`
      )
    );

  // 创建答题记录映射
  const attemptMap = new Map(myAttempts.map((a) => [a.quiz_id, a]));

  // 组合数据
  const quizzesWithAttempts = quizzes.map((q) => ({
    ...q,
    attempted: attemptMap.has(q.id),
    my_attempt: attemptMap.get(q.id),
  }));

  return createSuccessResponse(quizzesWithAttempts);
}

/**
 * 获取参与统计信息
 *
 * @param userId - 用户 ID（可选，默认当前用户）
 * @returns 参与统计
 */
export async function getParticipationStats(userId?: string): Promise<
  ActionResult<{
    totalLectures: number;
    activeLectures: number;
    totalAttempts: number;
    correctAttempts: number;
    averageScore: number;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();
    const targetUserId = userId || session.user.id;

    // 查询参与的演讲数量
    const [lectureStats] = await db
      .select({
        total: count(),
        active: sql<number>`count(case when ${lectures.status} = 'in_progress' then 1 end)`,
      })
      .from(lectureParticipants)
      .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
      .where(eq(lectureParticipants.user_id, targetUserId));

    // 查询答题统计
    const [attemptStats] = await db
      .select({
        total: count(),
        correct: sql<number>`count(case when ${attempts.is_correct} then 1 end)`,
      })
      .from(attempts)
      .where(eq(attempts.user_id, targetUserId));

    // 计算平均分
    const averageScore =
      attemptStats.total > 0
        ? Math.round((attemptStats.correct / attemptStats.total) * 100)
        : 0;

    return createSuccessResponse({
      totalLectures: lectureStats.total,
      activeLectures: lectureStats.active,
      totalAttempts: attemptStats.total,
      correctAttempts: attemptStats.correct,
      averageScore,
    });
  } catch (error) {
    return handleActionError(error);
  }
}
