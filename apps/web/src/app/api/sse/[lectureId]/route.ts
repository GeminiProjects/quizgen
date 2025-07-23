import { and, db, eq, lectureParticipants, quizItems } from '@repo/db';
import type { NextRequest } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

// 存储活跃的 SSE 连接
const activeConnections = new Map<
  string,
  Set<ReadableStreamDefaultController>
>();

export async function GET(
  request: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  const { lectureId } = params;

  // 验证用户身份
  const session = await getServerSideSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

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
    return new Response('Not a participant', { status: 403 });
  }

  // 创建 SSE 响应
  const stream = new ReadableStream({
    start(controller) {
      // 添加到活跃连接列表
      if (!activeConnections.has(lectureId)) {
        activeConnections.set(lectureId, new Set());
      }
      activeConnections.get(lectureId)?.add(controller);

      // 发送初始连接消息
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      // 设置心跳，防止连接超时
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`
          );
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000); // 每30秒发送一次心跳

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const connections = activeConnections.get(lectureId);
        if (connections) {
          connections.delete(controller);
          if (connections.size === 0) {
            activeConnections.delete(lectureId);
          }
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// 推送题目给所有连接的参与者
export async function pushQuizToParticipants(
  lectureId: string,
  quizId: string
) {
  const connections = activeConnections.get(lectureId);
  if (!connections || connections.size === 0) {
    return 0;
  }

  // 获取题目信息
  const [quiz] = await db
    .select()
    .from(quizItems)
    .where(eq(quizItems.id, quizId))
    .limit(1);

  if (!quiz) {
    return 0;
  }

  const message = JSON.stringify({
    type: 'new_quiz',
    quiz: {
      ...quiz,
      ts: quiz.ts.toISOString(),
      created_at: quiz.created_at.toISOString(),
    },
  });

  let pushedCount = 0;
  const deadConnections: ReadableStreamDefaultController[] = [];

  // 推送给所有连接
  for (const controller of connections) {
    try {
      controller.enqueue(`data: ${message}\n\n`);
      pushedCount++;
    } catch {
      // 记录失效的连接
      deadConnections.push(controller);
    }
  }

  // 清理失效连接
  for (const controller of deadConnections) {
    connections.delete(controller);
  }

  return pushedCount;
}
