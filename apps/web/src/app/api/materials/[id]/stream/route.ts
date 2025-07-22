/**
 * 材料处理进度流式 API
 * GET /api/materials/[id]/stream
 *
 * 使用 Server-Sent Events (SSE) 实时推送材料处理进度
 */

import { db, eq, lectures, materials } from '@repo/db';
import type { NextRequest } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // 验证用户身份
    const session = await getServerSideSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const materialId = id;

    // 验证材料存在并检查权限
    const [materialWithLecture] = await db
      .select({
        material: materials,
        lecture_owner_id: lectures.owner_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!materialWithLecture) {
      return new Response('Material not found', { status: 404 });
    }

    if (materialWithLecture.lecture_owner_id !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // 创建 SSE 响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // 发送初始状态
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'status',
              status: materialWithLecture.material.status,
              progress: 0,
            })}\n\n`
          )
        );

        // 轮询检查状态变化
        let previousContent = '';
        let checkCount = 0;
        const maxChecks = 100; // 最多检查 100 次（约 5 分钟）

        const interval = setInterval(async () => {
          checkCount++;

          try {
            // 查询最新状态
            const [current] = await db
              .select()
              .from(materials)
              .where(eq(materials.id, materialId))
              .limit(1);

            if (!current) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', message: '材料不存在' })}\n\n`
                )
              );
              controller.close();
              clearInterval(interval);
              return;
            }
            // 发送状态更新
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'update',
                  status: current.status,
                  elapsedSeconds: checkCount * 3,
                })}\n\n`
              )
            );

            // 如果有新内容，发送内容片段
            if (
              current.text_content &&
              current.text_content.length > previousContent.length
            ) {
              const newContent = current.text_content.substring(
                previousContent.length
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'content',
                    content: newContent,
                  })}\n\n`
                )
              );
              previousContent = current.text_content;
            }

            // 处理完成或超时，关闭连接
            if (
              current.status === 'completed' ||
              current.status === 'timeout'
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'complete',
                    status: current.status,
                    finalContent: current.text_content,
                  })}\n\n`
                )
              );
              controller.close();
              clearInterval(interval);
            }

            // 超过最大检查次数，强制结束
            if (checkCount >= maxChecks) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'timeout',
                    message: '处理超时',
                  })}\n\n`
                )
              );
              controller.close();
              clearInterval(interval);
            }
          } catch (error) {
            console.error('Stream error:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: '获取状态失败',
                })}\n\n`
              )
            );
            controller.close();
            clearInterval(interval);
          }
        }, 3000); // 每3秒检查一次

        // 清理函数
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    // 返回 SSE 响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
