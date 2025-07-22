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
import type { ParticipatedLecture } from '@/types';

export async function getParticipatedLectures(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
}) {
  const session = await requireAuth();

  const { page = 1, limit = 50, search, status } = params || {};

  const conditions = [eq(lectureParticipants.user_id, session.user.id)];

  if (status) {
    conditions.push(eq(lectures.status, status));
  }

  if (search) {
    const searchCondition = or(
      ilike(lectures.title, `%${search}%`),
      ilike(lectures.description, `%${search}%`),
      ilike(authUser.name, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0];

  const [data, total] = await Promise.all([
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
      .offset((page - 1) * limit)
      .orderBy(desc(lectureParticipants.joined_at)),

    db
      .select({ count: count() })
      .from(lectureParticipants)
      .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
      .where(whereClause)
      .then((result) => result[0].count),
  ]);

  return {
    data: data.map((item) => ({
      ...item,
      starts_at: item.starts_at?.toISOString(),
      ends_at: item.ends_at?.toISOString(),
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString(),
      joined_at: item.joined_at.toISOString(),
    })),
    total,
  };
}

export async function joinLectureByCode(data: { join_code: string }) {
  const session = await requireAuth();

  const validated = participationSchemas.joinByCode.parse(data);
  const formattedCode = formatLectureCode(validated.join_code);

  if (!isValidLectureCode(formattedCode)) {
    throw new Error('无效的演讲码格式');
  }

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(eq(lectures.join_code, formattedCode))
    .limit(1);

  if (!lecture) {
    throw new Error('演讲不存在或演讲码错误');
  }

  if (lecture.status === 'ended') {
    throw new Error('演讲已结束');
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

  if (!existing) {
    await db.insert(lectureParticipants).values({
      lecture_id: lecture.id,
      user_id: session.user.id,
      role: lecture.owner_id === session.user.id ? 'speaker' : 'audience',
      status: 'joined',
      joined_at: new Date(),
    });
  }

  revalidatePath('/participation');

  return {
    id: lecture.id,
    title: lecture.title,
    description: lecture.description,
    status: lecture.status,
    is_owner: lecture.owner_id === session.user.id,
    already_joined: !!existing,
  };
}

export async function exitLecture(lectureId: string) {
  const session = await requireAuth();

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
    throw new Error('您未参与该演讲');
  }

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

  revalidatePath('/participation');
  return true;
}

export async function submitQuizAttempt(data: {
  quiz_id: string;
  selected: number;
  latency_ms: number;
}) {
  const session = await requireAuth();

  const validated = participationSchemas.submitAttempt.parse(data);

  // 获取题目信息以验证答案
  const [quiz] = await db
    .select()
    .from(quizItems)
    .where(eq(quizItems.id, validated.quiz_id))
    .limit(1);

  if (!quiz) {
    throw new Error('题目不存在');
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
    throw new Error('您已经回答过这道题了');
  }

  const isCorrect = quiz.answer === validated.selected;

  await db.insert(attempts).values({
    quiz_id: validated.quiz_id,
    user_id: session.user.id,
    selected: validated.selected,
    is_correct: isCorrect,
    latency_ms: validated.latency_ms,
    created_at: new Date(),
  });

  revalidatePath(`/participation/${quiz.lecture_id}`);

  return {
    is_correct: isCorrect,
    correct_answer: quiz.answer,
  };
}

export async function getMyQuizAttempts(lectureId: string) {
  const session = await requireAuth();

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

  return data.map((item) => ({
    ...item,
    created_at: item.created_at.toISOString(),
  }));
}

export async function getParticipatedLectureWithQuizzes(
  lectureId: string
): Promise<ParticipatedLecture> {
  const session = await requireAuth();

  // 验证用户是否参与了该演讲
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
    throw new Error('您未参与该演讲');
  }

  // 获取演讲详情
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
    throw new Error('演讲不存在');
  }

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
        eq(attempts.user_id, session.user.id),
        sql`${attempts.quiz_id} IN (SELECT id FROM ${quizItems} WHERE lecture_id = ${lectureId})`
      )
    );

  const attemptMap = new Map(myAttempts.map((a) => [a.quiz_id, a]));

  return {
    ...lecture,
    starts_at: lecture.starts_at?.toISOString(),
    ends_at: lecture.ends_at?.toISOString() || null,
    created_at: lecture.created_at.toISOString(),
    updated_at: lecture.updated_at.toISOString(),
    participant_role: participant.role,
    participant_status: participant.status,
    joined_at: participant.joined_at.toISOString(),
    quizzes: quizzes.map((q) => ({
      ...q,
      ts: q.ts.toISOString(),
      created_at: q.created_at.toISOString(),
      attempted: attemptMap.has(q.id),
      my_attempt: attemptMap.get(q.id),
    })),
  };
}
