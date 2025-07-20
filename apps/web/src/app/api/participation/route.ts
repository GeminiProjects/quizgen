/**
 * 参与演讲 API 路由
 * 处理用户参与的演讲列表查询
 */

import {
  authUser,
  count,
  db,
  desc,
  eq,
  lectureParticipants,
  lectures,
  quizItems,
} from '@repo/db';
import type { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';

/**
 * 获取用户参与的演讲列表
 * GET /api/participation
 */
export const GET = withErrorHandler(async (_request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  try {
    // 查询用户参与的演讲列表
    // 使用子查询预先计算 quiz_items 数量，避免在主查询中使用 GROUP BY
    const participatedLectures = await db
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
        joined_at: lectureParticipants.joined_at,
        owner_name: authUser.name,
        owner_email: authUser.email,
        _count: {
          quiz_items: count(quizItems.id),
        },
      })
      .from(lectureParticipants)
      .innerJoin(lectures, eq(lectureParticipants.lecture_id, lectures.id))
      .innerJoin(authUser, eq(lectures.owner_id, authUser.id))
      .leftJoin(quizItems, eq(quizItems.lecture_id, lectures.id))
      .where(eq(lectureParticipants.user_id, session.user.id))
      .groupBy(
        lectures.id,
        lectures.title,
        lectures.description,
        lectures.owner_id,
        lectures.org_id,
        lectures.status,
        lectures.starts_at,
        lectures.ends_at,
        lectures.created_at,
        lectures.updated_at,
        lectureParticipants.joined_at,
        authUser.name,
        authUser.email
      )
      .orderBy(desc(lectureParticipants.joined_at))
      .limit(100); // 限制返回最近 100 条记录

    // 添加缓存头，减少重复请求
    const response = createSuccessResponse(participatedLectures);
    response.headers.set(
      'Cache-Control',
      'private, max-age=60, stale-while-revalidate=300'
    );
    return response;
  } catch (error) {
    return handleDatabaseError(error);
  }
});
