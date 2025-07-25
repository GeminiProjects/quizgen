import {
  and,
  db,
  eq,
  gt,
  lectureParticipants,
  lectures,
  quizItems,
  sql,
} from '@repo/db';
import type { NextRequest } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lectureId: string }> }
) {
  const { lectureId } = await params;

  // 验证用户身份
  const session = await getServerSideSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 验证演讲是否存在且正在进行中
  const [lecture] = await db
    .select()
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1);

  if (!lecture) {
    return new Response('Lecture not found', { status: 404 });
  }

  if (lecture.status !== 'in_progress') {
    return new Response('Lecture is not in progress', { status: 400 });
  }

  // 检查用户是否为参与者
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
    return new Response('Not a participant', { status: 403 });
  }

  // 创建 SSE 响应流
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始连接消息
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      // 记录连接活跃状态
      await db
        .update(lectureParticipants)
        .set({
          last_active_at: new Date(),
          is_online: true,
        })
        .where(
          and(
            eq(lectureParticipants.user_id, session.user.id),
            eq(lectureParticipants.lecture_id, lectureId)
          )
        );

      // 获取最近推送的题目（如果有）
      const [latestPushedQuiz] = await db
        .select()
        .from(quizItems)
        .where(
          and(
            eq(quizItems.lecture_id, lectureId),
            sql`${quizItems.pushed_at} is not null`
          )
        )
        .orderBy(sql`${quizItems.pushed_at} desc`)
        .limit(1);

      // 如果有最近推送的题目，立即发送给新连接的用户
      if (latestPushedQuiz?.pushed_at) {
        const pushedTime = new Date(latestPushedQuiz.pushed_at).getTime();
        const now = Date.now();
        // 如果题目是在最近5分钟内推送的，发送给用户
        if (now - pushedTime < 5 * 60 * 1000) {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'new_quiz',
              quiz: {
                ...latestPushedQuiz,
                ts: latestPushedQuiz.ts.toISOString(),
                created_at: latestPushedQuiz.created_at.toISOString(),
                pushed_at: latestPushedQuiz.pushed_at.toISOString(),
              },
            })}\n\n`
          );
        }
      }

      // 跟踪最后推送的题目ID
      let lastPushedQuizId = latestPushedQuiz?.id || null;

      // 轮询检查新题目
      const pollInterval = setInterval(async () => {
        try {
          // 检查演讲状态
          const [currentLecture] = await db
            .select()
            .from(lectures)
            .where(eq(lectures.id, lectureId))
            .limit(1);

          if (!currentLecture || currentLecture.status !== 'in_progress') {
            controller.enqueue(
              `data: ${JSON.stringify({ type: 'lecture_ended' })}\n\n`
            );
            clearInterval(pollInterval);
            controller.close();
            return;
          }

          // 更新活跃时间
          await db
            .update(lectureParticipants)
            .set({ last_active_at: new Date() })
            .where(
              and(
                eq(lectureParticipants.user_id, session.user.id),
                eq(lectureParticipants.lecture_id, lectureId)
              )
            );

          // 检查是否有新题目
          const [newQuiz] = await db
            .select()
            .from(quizItems)
            .where(
              and(
                eq(quizItems.lecture_id, lectureId),
                sql`${quizItems.pushed_at} is not null`
              )
            )
            .orderBy(sql`${quizItems.pushed_at} desc`)
            .limit(1);

          if (newQuiz && newQuiz.id !== lastPushedQuizId) {
            // 发现新题目
            lastPushedQuizId = newQuiz.id;
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'new_quiz',
                quiz: {
                  ...newQuiz,
                  ts: newQuiz.ts.toISOString(),
                  created_at: newQuiz.created_at.toISOString(),
                  pushed_at: newQuiz.pushed_at?.toISOString(),
                },
              })}\n\n`
            );
          } else {
            // 发送心跳
            controller.enqueue(
              `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`
            );
          }
        } catch (error) {
          console.error('SSE polling error:', error);
          clearInterval(pollInterval);
          controller.close();
        }
      }, 3000); // 每3秒轮询一次，确保快速响应

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        // 标记用户离线
        db.update(lectureParticipants)
          .set({ is_online: false })
          .where(
            and(
              eq(lectureParticipants.user_id, session.user.id),
              eq(lectureParticipants.lecture_id, lectureId)
            )
          )
          .catch(console.error);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  });
}

// 获取活跃参与者数量
export async function getActiveParticipantCount(
  lectureId: string
): Promise<number> {
  // 获取最近30秒内活跃的参与者
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(lectureParticipants)
    .where(
      and(
        eq(lectureParticipants.lecture_id, lectureId),
        eq(lectureParticipants.is_online, true),
        gt(lectureParticipants.last_active_at, thirtySecondsAgo)
      )
    );

  return result[0]?.count || 0;
}
