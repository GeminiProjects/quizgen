/**
 * 演讲管理 API 路由
 * 处理演讲的创建、查询操作
 */

import {
  and,
  count,
  db,
  eq,
  generateLectureCode,
  ilike,
  lectures,
  or,
  organizations,
} from '@repo/db';
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
import { lectureSchemas } from '@/lib/schemas';

/**
 * 创建演讲
 * POST /api/lectures
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
    lectureSchemas.create
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { title, description, org_id, org_password, starts_at } =
    validationResult.data;

  try {
    // 如果指定了组织，验证组织密码
    if (org_id && org_password) {
      const [organization] = await db
        .select({
          id: organizations.id,
          password: organizations.password,
        })
        .from(organizations)
        .where(eq(organizations.id, org_id))
        .limit(1);

      if (!organization) {
        return createErrorResponse('组织不存在', 404);
      }

      if (organization.password !== org_password) {
        return createErrorResponse('组织密码错误', 400);
      }
    }

    // 生成唯一的演讲码
    let joinCode: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    do {
      joinCode = generateLectureCode();
      attempts++;

      // 检查是否已存在
      const [existingLecture] = await db
        .select({ id: lectures.id })
        .from(lectures)
        .where(eq(lectures.join_code, joinCode))
        .limit(1);

      if (!existingLecture) {
        break;
      }

      if (attempts >= MAX_ATTEMPTS) {
        return createErrorResponse('生成演讲码失败，请重试', 500);
      }
    } while (attempts < MAX_ATTEMPTS);

    // 创建演讲
    const [lecture] = await db
      .insert(lectures)
      .values({
        title,
        description,
        owner_id: session.user.id,
        org_id: org_id || null,
        join_code: joinCode,
        starts_at: new Date(starts_at),
        status: 'not_started',
      })
      .returning();

    return createSuccessResponse(
      {
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        owner_id: lecture.owner_id,
        org_id: lecture.org_id,
        join_code: lecture.join_code,
        status: lecture.status,
        starts_at: lecture.starts_at,
        ends_at: lecture.ends_at,
        created_at: lecture.created_at,
        updated_at: lecture.updated_at,
      },
      '演讲创建成功'
    );
  } catch (error) {
    return handleDatabaseError(error);
  }
});

/**
 * 获取演讲列表
 * GET /api/lectures
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
    lectureSchemas.list
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { page, limit, org_id, status, search } = validationResult.data;

  try {
    // 构建查询条件
    const conditions = [eq(lectures.owner_id, session.user.id)];

    if (org_id) {
      conditions.push(eq(lectures.org_id, org_id));
    }

    if (status) {
      conditions.push(eq(lectures.status, status));
    }

    if (search) {
      const searchConditions = [ilike(lectures.title, `%${search}%`)];

      if (lectures.description) {
        searchConditions.push(ilike(lectures.description, `%${search}%`));
      }

      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // 查询演讲列表
    const [lectureList, totalCount] = await Promise.all([
      db
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
        .where(whereClause)
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(lectures.starts_at),

      db
        .select({ count: count() })
        .from(lectures)
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    return createSuccessResponse({
      data: lectureList,
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
