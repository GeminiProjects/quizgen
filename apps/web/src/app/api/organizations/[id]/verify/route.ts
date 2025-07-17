/**
 * 组织密码验证 API 路由
 * 验证组织密码是否正确
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
 * 验证组织密码
 * POST /api/organizations/[id]/verify
 */
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    // 验证用户身份
    const session = await getServerSideSession();

    if (!session) {
      return createErrorResponse('未登录', 401);
    }

    // 验证请求体
    const validationResult = await validateRequestBody(
      request,
      organizationSchemas.validatePassword
    );

    if (!validationResult.success) {
      return createErrorResponse(validationResult.error);
    }

    const { password } = validationResult.data;

    try {
      // 查询组织
      const [organization] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          password: organizations.password,
        })
        .from(organizations)
        .where(eq(organizations.id, params.id))
        .limit(1);

      if (!organization) {
        return createErrorResponse('组织不存在', 404);
      }

      // 验证密码
      if (organization.password !== password) {
        return createErrorResponse('密码错误', 400);
      }

      return createSuccessResponse(
        {
          id: organization.id,
          name: organization.name,
          verified: true,
        },
        '密码验证成功'
      );
    } catch (error) {
      return handleDatabaseError(error);
    }
  }
);
