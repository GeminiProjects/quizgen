import { db, lectureParticipants, lectures, quizItems } from '@repo/db';
import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';

/**
 * 获取用户参与的单个演讲详情
 * GET /api/participation/[id]
 */
export const GET = withErrorHandler(
  async (_req: NextRequest, { params }: { params: { id: string } }) => {
    // 验证用户身份
    const session = await getServerSideSession();
    if (!session?.user.id) {
      return createErrorResponse('未登录', 401);
    }

    const lectureId = params.id;

    // 验证用户是否参与了该演讲
    const [participantRecord] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, session.user.id)
        )
      )
      .limit(1);

    if (!participantRecord) {
      return createErrorResponse('您未参与该演讲或演讲不存在', 403);
    }

    // 查询演讲详情
    const [lectureData] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lectureData) {
      return createErrorResponse('演讲不存在', 404);
    }

    // 查询该演讲下的测验题目
    const quizzes = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.lecture_id, lectureId))
      .orderBy(quizItems.created_at);

    return createSuccessResponse({
      ...lectureData,
      quizzes,
    });
  }
);

/**
 * 退出演讲
 * DELETE /api/participation/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSideSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const lectureId = params.id;
  const userId = session.user.id;

  try {
    const result = await db
      .delete(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lectureId),
          eq(lectureParticipants.user_id, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Participation record not found or already removed.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    console.error('Failed to exit lecture:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to exit lecture.' },
      { status: 500 }
    );
  }
}
