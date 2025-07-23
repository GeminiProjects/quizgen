'use server';

import {
  and,
  attempts,
  db,
  desc,
  eq,
  lectureParticipants,
  lectures,
  quizItems,
  sql,
} from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import type { ActionResult, DateToString, Lecture, QuizItem } from '@/types';
import {
  createErrorResponse,
  createSuccessResponse,
  handleActionError,
  revalidatePaths,
} from './utils';

/**
 * 参与者信息类型
 */
export interface Participant {
  id: string;
  user_id: string;
  lecture_id: string;
  role: 'speaker' | 'audience' | 'assistant';
  status: 'joined' | 'active' | 'left' | 'kicked';
  joined_at: string;
  left_at: string | null;
}

/**
 * 答题记录类型
 */
export interface AttemptRecord {
  quiz_id: string;
  user_id: string;
  selected: number;
  is_correct: boolean;
  latency_ms: number;
  created_at: string;
  quiz: QuizItem;
}

/**
 * 参与的演讲数据类型
 */
export interface ParticipatedLectureData {
  participant: Participant;
  lecture: DateToString<Lecture>;
  stats: {
    totalQuizzes: number;
    answeredQuizzes: number;
    correctAnswers: number;
  };
}

/**
 * 使用演讲码加入演讲
 *
 * @param code - 演讲码
 * @param nickname - 昵称（可选，匿名用户必填）
 * @returns 参与信息和演讲信息
 */
export async function joinLectureByCode(
  code: string,
  _nickname?: string
): Promise<
  ActionResult<{
    participant: Participant;
    lecture: DateToString<Lecture>;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查找演讲
    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.join_code, code.toUpperCase()))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲码无效');
    }

    // 验证演讲状态
    if (lecture.status === 'ended') {
      return createErrorResponse('演讲已结束');
    }

    // 检查是否已经参与
    const [existingParticipant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.user_id, session.user.id),
          eq(lectureParticipants.lecture_id, lecture.id)
        )
      )
      .limit(1);

    if (existingParticipant) {
      return createSuccessResponse({
        participant: {
          ...existingParticipant,
          joined_at: existingParticipant.joined_at.toISOString(),
        },
        lecture: {
          ...lecture,
          created_at: lecture.created_at.toISOString(),
          updated_at: lecture.updated_at.toISOString(),
        },
      });
    }

    // 创建新的参与记录
    const [participant] = await db
      .insert(lectureParticipants)
      .values({
        user_id: session.user.id,
        lecture_id: lecture.id,
        role: 'audience',
        status: 'joined',
      })
      .returning();

    // 重验证路径
    revalidatePaths(['/participation', `/participation/${lecture.id}`]);

    return createSuccessResponse({
      participant: {
        ...participant,
        joined_at: participant.joined_at.toISOString(),
      },
      lecture: {
        ...lecture,
        created_at: lecture.created_at.toISOString(),
        updated_at: lecture.updated_at.toISOString(),
      },
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取用户参与的演讲列表
 *
 * @returns 参与的演讲列表
 */
export async function getParticipatedLectures(): Promise<
  ActionResult<ParticipatedLectureData[]>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询参与的演讲
    const participatedData = await db
      .select({
        participant: lectureParticipants,
        lecture: lectures,
      })
      .from(lectureParticipants)
      .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
      .where(eq(lectureParticipants.user_id, session.user.id))
      .orderBy(desc(lectureParticipants.joined_at));

    // 获取每个演讲的答题统计
    const results = await Promise.all(
      participatedData.map(async ({ participant, lecture }) => {
        // 获取演讲的题目总数
        const [quizCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(quizItems)
          .where(eq(quizItems.lecture_id, lecture.id));

        // 获取答题统计
        const [attemptStats] = await db
          .select({
            answeredCount: sql<number>`count(distinct ${attempts.quiz_id})`,
            correctCount: sql<number>`count(*) filter (where ${attempts.is_correct})`,
          })
          .from(attempts)
          .where(eq(attempts.user_id, session.user.id));

        return {
          participant: {
            ...participant,
            joined_at: participant.joined_at.toISOString(),
          },
          lecture: {
            ...lecture,
            created_at: lecture.created_at.toISOString(),
            updated_at: lecture.updated_at.toISOString(),
          },
          stats: {
            totalQuizzes: Number(quizCount?.count || 0),
            answeredQuizzes: Number(attemptStats?.answeredCount || 0),
            correctAnswers: Number(attemptStats?.correctCount || 0),
          },
        };
      })
    );

    return createSuccessResponse(results);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取参与演讲的详细信息
 *
 * @param lectureId - 演讲 ID
 * @returns 参与信息、演讲信息和当前活跃的题目
 */
export async function getParticipationDetail(lectureId: string): Promise<
  ActionResult<{
    participant: Participant;
    lecture: DateToString<Lecture>;
    activeQuiz: QuizItem | null;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询参与信息和演讲信息
    const [data] = await db
      .select({
        participant: lectureParticipants,
        lecture: lectures,
      })
      .from(lectureParticipants)
      .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
      .where(
        and(
          eq(lectureParticipants.user_id, session.user.id),
          eq(lectureParticipants.lecture_id, lectureId)
        )
      )
      .limit(1);

    if (!data) {
      return createErrorResponse('您尚未参与该演讲');
    }

    // TODO: 获取当前活跃的题目（需要实现推送机制后确定）
    const activeQuiz: QuizItem | null = null;

    return createSuccessResponse({
      participant: {
        ...data.participant,
        joined_at: data.participant.joined_at.toISOString(),
      },
      lecture: {
        ...data.lecture,
        created_at: data.lecture.created_at.toISOString(),
        updated_at: data.lecture.updated_at.toISOString(),
      },
      activeQuiz,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 提交答题
 *
 * @param input - 答题输入
 * @param input.quizId - 题目 ID
 * @param input.selected - 选择的答案索引
 * @param input.latencyMs - 答题耗时（毫秒）
 * @returns 答题结果
 */
export async function submitAnswer(input: {
  quizId: string;
  selected: number;
  latencyMs?: number;
}): Promise<
  ActionResult<{
    isCorrect: boolean;
    correctAnswer: number;
    explanation?: string;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入
    if (input.selected < 0 || input.selected > 3) {
      return createErrorResponse('无效的答案选择');
    }

    // 获取题目信息
    const [quiz] = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.id, input.quizId))
      .limit(1);

    if (!quiz) {
      return createErrorResponse('题目不存在');
    }

    // 获取参与信息
    const [participant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.user_id, session.user.id),
          eq(lectureParticipants.lecture_id, quiz.lecture_id)
        )
      )
      .limit(1);

    if (!participant) {
      return createErrorResponse('您尚未参与该演讲');
    }

    // 检查是否已经答过题
    const [existingAttempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.user_id, session.user.id),
          eq(attempts.quiz_id, input.quizId)
        )
      )
      .limit(1);

    if (existingAttempt) {
      return createErrorResponse('您已经回答过这道题目');
    }

    // 判断答案是否正确
    const isCorrect = input.selected === quiz.answer;

    // 创建答题记录
    await db.insert(attempts).values({
      quiz_id: input.quizId,
      user_id: session.user.id,
      selected: input.selected,
      is_correct: isCorrect,
      latency_ms: input.latencyMs || 0,
    });

    // 重验证路径
    revalidatePath(`/participation/${quiz.lecture_id}`);

    return createSuccessResponse({
      isCorrect,
      correctAnswer: quiz.answer,
      explanation: quiz.explanation || undefined,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取答题历史记录
 *
 * @param lectureId - 演讲 ID
 * @returns 答题历史记录列表
 */
export async function getAnswerHistory(
  lectureId: string
): Promise<ActionResult<AttemptRecord[]>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 获取参与信息
    const [participant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.user_id, session.user.id),
          eq(lectureParticipants.lecture_id, lectureId)
        )
      )
      .limit(1);

    if (!participant) {
      return createErrorResponse('您尚未参与该演讲');
    }

    // 查询答题记录
    const attemptData = await db
      .select({
        attempt: attempts,
        quiz: quizItems,
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

    const results: AttemptRecord[] = attemptData.map(({ attempt, quiz }) => ({
      ...attempt,
      created_at: attempt.created_at.toISOString(),
      quiz: {
        ...quiz,
        ts: quiz.ts.toISOString(),
        created_at: quiz.created_at.toISOString(),
        pushed_at: quiz.pushed_at?.toISOString() || null,
      },
    }));

    return createSuccessResponse(results);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取演讲的最新题目（用于轮询）
 *
 * @param lectureId - 演讲 ID
 * @param lastQuizId - 上一次获取的题目 ID
 * @returns 最新的题目（如果有）
 */
export async function getLatestQuiz(
  lectureId: string,
  lastQuizId?: string
): Promise<ActionResult<QuizItem | null>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证参与权限
    const [participant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.user_id, session.user.id),
          eq(lectureParticipants.lecture_id, lectureId)
        )
      )
      .limit(1);

    if (!participant) {
      return createErrorResponse('您尚未参与该演讲');
    }

    // 获取最新推送的题目
    const query = db
      .select()
      .from(quizItems)
      .where(
        and(
          eq(quizItems.lecture_id, lectureId),
          sql`${quizItems.pushed_at} is not null`
        )
      )
      .orderBy(desc(quizItems.pushed_at))
      .limit(1);

    const [latestQuiz] = await query;

    // 如果没有新题目或与上次相同，返回 null
    if (!latestQuiz || (lastQuizId && latestQuiz.id === lastQuizId)) {
      return createSuccessResponse(null);
    }

    // 检查是否已经答过题
    const [existingAttempt] = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.user_id, session.user.id),
          eq(attempts.quiz_id, latestQuiz.id)
        )
      )
      .limit(1);

    // 如果已经答过，返回 null
    if (existingAttempt) {
      return createSuccessResponse(null);
    }

    return createSuccessResponse({
      ...latestQuiz,
      ts: latestQuiz.ts.toISOString(),
      created_at: latestQuiz.created_at.toISOString(),
    });
  } catch (error) {
    return handleActionError(error);
  }
}
