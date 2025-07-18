/**
 * 组织管理 API 路由
 * 处理组织的创建、查询操作
 */

import { and, count, db, eq, ilike, organizations, users } from '@repo/db';
import type { NextRequest } from 'next/server';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  validateRequestBody,
  validateSearchParams,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';
import { organizationSchemas } from '@/lib/schemas';

/**
 * 创建组织
 * POST /api/organizations
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
    organizationSchemas.create
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { name, description, password } = validationResult.data;

  try {
    // 创建组织
    const [organization] = await db
      .insert(organizations)
      .values({
        name,
        description,
        password,
        owner_id: session.user.id,
      })
      .returning();

    return createSuccessResponse(
      {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        owner_id: organization.owner_id,
        created_at: organization.created_at,
        updated_at: organization.updated_at,
      },
      '组织创建成功'
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
});

/**
 * 获取组织列表
 * GET /api/organizations
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  // 验证查询参数
  const validationResult = validateSearchParams(
    request.nextUrl.searchParams,
    organizationSchemas.list
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { page, limit, search } = validationResult.data;

  try {
    // 构建查询条件
    const conditions = [eq(organizations.owner_id, session.user.id)];

    if (search) {
      conditions.push(ilike(organizations.name, `%${search}%`));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // 查询组织列表（包含 owner 信息）
    const [organizationList, totalCount] = await Promise.all([
      db
        .select({
          id: organizations.id,
          name: organizations.name,
          description: organizations.description,
          password: organizations.password,
          owner_id: organizations.owner_id,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
          owner: {
            id: users.id,
            email: users.email,
            name: users.name,
            avatar_url: users.image,
          },
        })
        .from(organizations)
        .innerJoin(users, eq(organizations.owner_id, users.id))
        .where(whereClause)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(organizations.created_at),

      db
        .select({ count: count() })
        .from(organizations)
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    return createSuccessResponse({
      data: organizationList,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    return handleDatabaseError(error);
  }
});
