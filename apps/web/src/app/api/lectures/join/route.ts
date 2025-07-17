/**
 * 加入演讲 API 路由
 * 通过演讲码加入演讲
 */

import {
  and,
  db,
  eq,
  formatLectureCode,
  isValidLectureCode,
  lectureParticipants,
  lectures,
} from '@repo/db';
import type { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  validateRequestBody,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';
import { lectureSchemas } from '@/lib/schemas';

/**
 * 通过演讲码加入演讲
 * POST /api/lectures/join
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  // 验证请求体
  const validationResult = await validateRequestBody(
    request,
    lectureSchemas.joinByCode
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { join_code } = validationResult.data;

  // 格式化演讲码
  const formattedCode = formatLectureCode(join_code);

  // 验证演讲码格式
  if (!isValidLectureCode(formattedCode)) {
    return createErrorResponse('无效的演讲码格式', 400);
  }

  try {
    // 查询演讲
    const [lecture] = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        description: lectures.description,
        owner_id: lectures.owner_id,
        org_id: lectures.org_id,
        join_code: lectures.join_code,
        status: lectures.status,
        starts_at: lectures.starts_at,
        ends_at: lectures.ends_at,
        created_at: lectures.created_at,
        updated_at: lectures.updated_at,
      })
      .from(lectures)
      .where(eq(lectures.join_code, formattedCode))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在或演讲码错误', 404);
    }

    // 检查演讲状态
    if (lecture.status === 'ended') {
      return createErrorResponse('演讲已结束', 400);
    }

    // 检查用户是否已经参与该演讲
    const [existingParticipant] = await db
      .select({
        id: lectureParticipants.id,
      })
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, lecture.id),
          eq(lectureParticipants.user_id, session.user.id)
        )
      )
      .limit(1);

    if (!existingParticipant) {
      // 添加参与者记录
      await db.insert(lectureParticipants).values({
        lecture_id: lecture.id,
        user_id: session.user.id,
        joined_at: new Date(),
      });
    }

    // 返回演讲信息（不包含敏感信息）
    return createSuccessResponse(
      {
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        owner_id: lecture.owner_id,
        org_id: lecture.org_id,
        status: lecture.status,
        starts_at: lecture.starts_at,
        ends_at: lecture.ends_at,
        is_owner: lecture.owner_id === session.user.id,
        already_joined: !!existingParticipant,
      },
      existingParticipant ? '已加入演讲' : '成功加入演讲'
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
});
