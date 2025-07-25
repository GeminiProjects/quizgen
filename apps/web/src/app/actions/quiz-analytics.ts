'use server';

import { attempts, db, eq, quizItems } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

interface QuizAnalyticsData {
  quizId: string;
  question: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  options: string[];
  optionStats: {
    option: number;
    text: string;
    count: number;
    percentage: number;
    isCorrect: boolean;
  }[];
  avgResponseTime: number;
  pushedAt: string | null;
}

export async function getQuizAnalytics(lectureId: string) {
  try {
    await requireAuth();

    // 获取该演讲的所有题目
    const quizItemsList = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.lecture_id, lectureId))
      .orderBy(quizItems.created_at);

    if (quizItemsList.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // 对每个题目进行统计分析
    const analyticsData: QuizAnalyticsData[] = await Promise.all(
      quizItemsList.map(async (quiz) => {
        // 获取该题目的所有答题记录
        const attemptsList = await db
          .select()
          .from(attempts)
          .where(eq(attempts.quiz_id, quiz.id));

        const totalAttempts = attemptsList.length;
        const correctAttempts = attemptsList.filter((a) => a.is_correct).length;
        const correctRate =
          totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

        // 统计每个选项的选择情况
        const optionCounts = new Map<number, number>();
        let totalResponseTime = 0;

        for (const attempt of attemptsList) {
          const currentCount = optionCounts.get(attempt.selected) || 0;
          optionCounts.set(attempt.selected, currentCount + 1);
          totalResponseTime += attempt.latency_ms || 0;
        }

        // 构建选项统计数据
        const optionStats = quiz.options.map((optionText, index) => {
          const optionCount = optionCounts.get(index) || 0;
          const percentage =
            totalAttempts > 0 ? (optionCount / totalAttempts) * 100 : 0;
          const isCorrect = index === quiz.answer;

          return {
            option: index,
            text: optionText,
            count: optionCount,
            percentage,
            isCorrect,
          };
        });

        // 计算平均响应时间（秒）
        const avgResponseTime =
          totalAttempts > 0 ? totalResponseTime / totalAttempts / 1000 : 0;

        return {
          quizId: quiz.id,
          question: quiz.question,
          totalAttempts,
          correctAttempts,
          correctRate,
          options: quiz.options,
          optionStats,
          avgResponseTime,
          pushedAt: quiz.pushed_at?.toISOString() || null,
        };
      })
    );

    revalidatePath(`/lectures/${lectureId}`);

    return {
      success: true,
      data: analyticsData,
    };
  } catch (error) {
    console.error('Failed to get quiz analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取数据分析失败',
    };
  }
}
