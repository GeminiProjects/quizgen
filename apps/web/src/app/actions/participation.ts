'use server';

import {
  and,
  attempts,
  db,
  desc,
  eq,
  lectureParticipants,
  quizItems,
} from '@repo/db';
import type { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { submitAnswerSchema } from '@/lib/schemas';

export async function submitAnswer(input: z.infer<typeof submitAnswerSchema>) {
  try {
    const { user } = await requireAuth();
    const { lectureId, quizItemId, answer } = submitAnswerSchema.parse(input);

    const participantRecords = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, user.id)
        )
      )
      .limit(1);

    if (participantRecords.length === 0) {
      throw new Error('您不是本次讲座的参与者。');
    }

    const quizItemRecords = await db
      .select()
      .from(quizItems)
      .where(
        and(eq(quizItems.id, quizItemId), eq(quizItems.lecture_id, lectureId))
      )
      .limit(1);

    const quizItem = quizItemRecords[0];

    if (!quizItem) {
      throw new Error('测验不存在。');
    }

    await db.insert(attempts).values({
      quiz_id: quizItemId,
      user_id: user.id,
      selected: answer,
      is_correct: quizItem.answer === answer,
      latency_ms: 1000, // Placeholder
    });

    return { data: '答案提交成功。' };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('violates unique constraint')) {
        return { error: '您已经回答过此题，请勿重复提交。' };
      }
      return { error: error.message };
    }
    return { error: '发生未知错误。' };
  }
}

export async function getActiveQuiz(lectureId: string) {
  try {
    const { user } = await requireAuth();

    const participantRecords = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, user.id)
        )
      )
      .limit(1);

    if (participantRecords.length === 0) {
      throw new Error('您不是本次讲座的参与者。');
    }

    const quizItemRecords = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.lecture_id, lectureId))
      .orderBy(desc(quizItems.created_at))
      .limit(1);

    const quizItem = quizItemRecords[0];

    if (!quizItem) {
      return { data: null };
    }

    return { data: quizItem };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '发生未知错误。' };
  }
}

export async function getParticipationHistory(lectureId: string) {
  try {
    const { user } = await requireAuth();

    const participantRecords = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, user.id)
        )
      )
      .limit(1);

    if (participantRecords.length === 0) {
      throw new Error('您不是本次讲座的参与者。');
    }

    const history = await db
      .select({
        attempt: attempts,
        quizItem: quizItems,
      })
      .from(attempts)
      .leftJoin(quizItems, eq(attempts.quiz_id, quizItems.id))
      .where(
        and(eq(attempts.user_id, user.id), eq(quizItems.lecture_id, lectureId))
      )
      .orderBy(desc(attempts.created_at));

    return { data: history };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: '发生未知错误。' };
  }
}
