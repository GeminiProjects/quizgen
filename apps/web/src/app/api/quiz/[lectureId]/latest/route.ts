import { and, db, desc, eq, quizItems, sql } from '@repo/db';
import type { NextRequest } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

/**
 * 获取演讲最新推送的题目
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  const { lectureId } = await params;

  // 验证用户身份
  const session = await getServerSideSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 获取最新推送的题目
    const [latestQuiz] = await db
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

    if (!latestQuiz) {
      return Response.json({ quiz: null });
    }

    // 检查是否在5分钟内推送
    if (!latestQuiz.pushed_at) {
      return Response.json({ quiz: null });
    }
    const pushedTime = new Date(latestQuiz.pushed_at).getTime();
    const now = Date.now();
    if (now - pushedTime > 5 * 60 * 1000) {
      return Response.json({ quiz: null });
    }

    return Response.json({
      quiz: {
        ...latestQuiz,
        ts: latestQuiz.ts.toISOString(),
        created_at: latestQuiz.created_at.toISOString(),
        pushed_at: latestQuiz.pushed_at?.toISOString(),
      },
    });
  } catch (error) {
    console.error('获取最新题目失败:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
