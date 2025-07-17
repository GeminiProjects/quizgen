/**
 * 组织管理 API 路由
 * GET /api/organizations - 获取组织列表
 * POST /api/organizations - 创建新组织
 */

import { auth } from '@repo/auth';
import { db } from '@repo/db';
import { insertOrganizationSchema, organizations } from '@repo/db/schema';
import { and, desc, eq, like, type SQL, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// GET 请求的查询参数验证
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  ownerId: z.string().optional(),
});

/**
 * 获取组织列表
 * 支持分页、搜索和按创建者筛选
 */
export async function GET(request: NextRequest) {
  try {
    // 解析查询参数
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    // 构建查询条件
    const conditions: SQL[] = [];
    if (query.search) {
      conditions.push(like(organizations.name, `%${query.search}%`));
    }
    if (query.ownerId) {
      conditions.push(eq(organizations.owner_id, query.ownerId));
    }

    // 计算分页
    const offset = (query.page - 1) * query.limit;

    // 并行查询总数和数据
    const [totalResult, items] = await Promise.all([
      // 查询总数
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined),
      // 查询数据
      db
        .select({
          id: organizations.id,
          name: organizations.name,
          description: organizations.description,
          owner_id: organizations.owner_id,
          created_at: organizations.created_at,
          updated_at: organizations.updated_at,
          // 不返回密码字段
        })
        .from(organizations)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(organizations.created_at))
        .limit(query.limit)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / query.limit);

    return NextResponse.json({
      data: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
    });
  } catch (error) {
    // 参数验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数错误',
            details: error.message,
          },
        },
        { status: 400 }
      );
    }

    // 其他错误
    console.error('获取组织列表失败:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 创建新组织
 * 需要用户登录
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '请先登录',
          },
        },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();

    // 验证输入数据
    const validatedData = insertOrganizationSchema.parse({
      ...body,
      owner_id: session.user.id,
    });

    // 创建组织
    const [newOrganization] = await db
      .insert(organizations)
      .values(validatedData)
      .returning({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        owner_id: organizations.owner_id,
        created_at: organizations.created_at,
        updated_at: organizations.updated_at,
      });

    return NextResponse.json(
      {
        data: newOrganization,
        message: '组织创建成功',
      },
      { status: 201 }
    );
  } catch (error) {
    // 参数验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求数据验证失败',
            details: error.message,
          },
        },
        { status: 400 }
      );
    }

    // 其他错误
    console.error('创建组织失败:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: '服务器内部错误',
        },
      },
      { status: 500 }
    );
  }
}
