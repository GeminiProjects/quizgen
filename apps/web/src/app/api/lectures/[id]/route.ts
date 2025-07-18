/**
 * 单个演讲管理 API 路由
 * 处理演讲的查询、更新、删除操作
 */

import { db, eq, lectures } from '@repo/db';
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
 * 获取单个演讲详情
 * GET /api/lectures/[id]
 */
export const GET = withErrorHandler(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
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
        .where(eq(lectures.id, id))
        .limit(1);

      if (!lecture) {
        return createErrorResponse('演讲不存在', 404);
      }

      // 检查权限：只有演讲创建者才能查看详情
      if (lecture.owner_id !== session.user.id) {
        return createErrorResponse('无权访问此演讲', 403);
      }

      return createSuccessResponse(lecture);
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 更新演讲信息
 * PATCH /api/lectures/[id]
 */
export const PATCH = withErrorHandler(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    // 验证请求体
    const validationResult = await validateRequestBody(
      request,
      lectureSchemas.update
    );

    if (!validationResult.success) {
      return createErrorResponse(validationResult.error);
    }

    const updateData = validationResult.data;

    try {
      // 先检查演讲是否存在且用户有权限
      const [existingLecture] = await db
        .select({
          id: lectures.id,
          owner_id: lectures.owner_id,
          status: lectures.status,
        })
        .from(lectures)
        .where(eq(lectures.id, id))
        .limit(1);

      if (!existingLecture) {
        return createErrorResponse('演讲不存在', 404);
      }

      if (existingLecture.owner_id !== session.user.id) {
        return createErrorResponse('无权修改此演讲', 403);
      }

      // 准备更新数据
      const updateValues: Record<string, unknown> = {
        updated_at: new Date(),
      };

      if (updateData.title) {
        updateValues.title = updateData.title;
      }

      if (updateData.description !== undefined) {
        updateValues.description = updateData.description;
      }

      if (updateData.status) {
        updateValues.status = updateData.status;

        // 如果状态变为 'ended'，设置结束时间
        if (updateData.status === 'ended') {
          updateValues.ends_at = new Date();
        }
      }

      if (updateData.starts_at) {
        updateValues.starts_at = new Date(updateData.starts_at);
      }

      if (updateData.ends_at) {
        updateValues.ends_at = new Date(updateData.ends_at);
      }

      // 更新演讲信息
      const [updatedLecture] = await db
        .update(lectures)
        .set(updateValues)
        .where(eq(lectures.id, id))
        .returning({
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
        });

      return createSuccessResponse(updatedLecture, '演讲更新成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 删除演讲
 * DELETE /api/lectures/[id]
 */
export const DELETE = withErrorHandler(
  async (
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    try {
      // 先检查演讲是否存在且用户有权限
      const [existingLecture] = await db
        .select({
          id: lectures.id,
          owner_id: lectures.owner_id,
          status: lectures.status,
        })
        .from(lectures)
        .where(eq(lectures.id, id))
        .limit(1);

      if (!existingLecture) {
        return createErrorResponse('演讲不存在', 404);
      }

      if (existingLecture.owner_id !== session.user.id) {
        return createErrorResponse('无权删除此演讲', 403);
      }

      // 检查演讲状态，进行中的演讲不能删除
      if (existingLecture.status === 'in_progress') {
        return createErrorResponse('进行中的演讲无法删除', 400);
      }

      // 删除演讲
      await db.delete(lectures).where(eq(lectures.id, id));

      return createSuccessResponse(null, '演讲删除成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);
