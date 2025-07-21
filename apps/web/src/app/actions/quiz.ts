'use server';

import { attempts, db, desc, eq, quizItems, sql } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function getQuizItems(lectureId: string) {
  await requireAuth();

  const data = await db
    .select({
      id: quizItems.id,
      lecture_id: quizItems.lecture_id,
      ts: quizItems.ts,
      question: quizItems.question,
      options: quizItems.options,
      answer: quizItems.answer,
      created_at: quizItems.created_at,
      _count: {
        attempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id})`,
        correctAttempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id} and ${attempts.selected} = ${quizItems.answer})`,
      },
    })
    .from(quizItems)
    .where(eq(quizItems.lecture_id, lectureId))
    .orderBy(desc(quizItems.created_at));

  return data.map((item) => ({
    ...item,
    ts: item.ts.toISOString(),
    created_at: item.created_at.toISOString(),
  }));
}

export async function deleteQuizItem(id: string) {
  await requireAuth();

  // 获取quiz所属的lecture
  const [quiz] = await db
    .select({ lecture_id: quizItems.lecture_id })
    .from(quizItems)
    .where(eq(quizItems.id, id))
    .limit(1);

  if (!quiz) {
    throw new Error('测验题目不存在');
  }

  // TODO: 验证用户是否是演讲的所有者

  await db.delete(quizItems).where(eq(quizItems.id, id));

  revalidatePath(`/lectures/${quiz.lecture_id}`);
  return true;
}

export async function pushQuizItem(lectureId: string, _quizId: string) {
  await requireAuth();

  // TODO: 实现推送逻辑
  // 这里需要与 WebSocket 或其他实时通信机制集成

  revalidatePath(`/lectures/${lectureId}`);
  return true;
}
