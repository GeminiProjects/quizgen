/**
 * 单个组织管理 API 路由
 * 处理组织的查询、更新、删除操作
 */

import { db, eq, organizations } from '@repo/db';
import type { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  validateRequestBody,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';
import { organizationSchemas } from '@/lib/schemas';

/**
 * 获取单个组织详情
 * GET /api/organizations/[id]
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
      // 查询组织
      const [organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          description: organizations.description,
          password: organizations.password,
          owner_id: organizations.owner_id,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!organization) {
        return createErrorResponse('组织不存在', 404);
      }

      // 检查权限：只有组织创建者才能查看详情
      if (organization.owner_id !== session.user.id) {
        return createErrorResponse('无权访问此组织', 403);
      }

      return createSuccessResponse(organization);
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 更新组织信息
 * PUT /api/organizations/[id]
 */
export const PUT = withErrorHandler(
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
      organizationSchemas.update
    );

    if (!validationResult.success) {
      return createErrorResponse(validationResult.error);
    }

    const updateData = validationResult.data;

    try {
      // 先检查组织是否存在且用户有权限
      const [existingOrganization] = await db
        .select({
          id: organizations.id,
          owner_id: organizations.owner_id,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!existingOrganization) {
        return createErrorResponse('组织不存在', 404);
      }

      if (existingOrganization.owner_id !== session.user.id) {
        return createErrorResponse('无权修改此组织', 403);
      }

      // 更新组织信息
      const [updatedOrganization] = await db
        .update(organizations)
        .set({
          ...updateData,
          updated_at: new Date(),
        })
        .where(eq(organizations.id, id))
        .returning({
          id: organizations.id,
          name: organizations.name,
          description: organizations.description,
          password: organizations.password,
          owner_id: organizations.owner_id,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
        });

      return createSuccessResponse(updatedOrganization, '组织更新成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);

/**
 * 删除组织
 * DELETE /api/organizations/[id]
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
      // 先检查组织是否存在且用户有权限
      const [existingOrganization] = await db
        .select({
          id: organizations.id,
          owner_id: organizations.owner_id,
        })
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);

      if (!existingOrganization) {
        return createErrorResponse('组织不存在', 404);
      }

      if (existingOrganization.owner_id !== session.user.id) {
        return createErrorResponse('无权删除此组织', 403);
      }

      // 删除组织
      await db.delete(organizations).where(eq(organizations.id, id));

      return createSuccessResponse(null, '组织删除成功');
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);
