/**
 * 单个组织管理 API 路由
 * GET /api/organizations/[id] - 获取组织详情
 * PATCH /api/organizations/[id] - 更新组织信息
 * DELETE /api/organizations/[id] - 删除组织
 */

import { auth } from '@repo/auth';
import { db } from '@repo/db';
import { lectures, organizations } from '@repo/db/schema';
import { eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 路由参数类型
type RouteParams = {
  params: Promise<{ id: string }>;
};

// 更新请求体验证
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  password: z.string().min(6).optional(),
});

/**
 * 获取组织详情
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 查询组织信息和统计数据
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        owner_id: organizations.owner_id,
        created_at: organizations.created_at,
        updated_at: organizations.updated_at,
        // 统计演讲数量
        lecture_count: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${lectures} 
          WHERE ${lectures.org_id} = ${organizations.id}
        )`,
      })
      .from(organizations)
      .where(eq(organizations.id, id));

    if (!organization) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '组织不存在',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: organization,
    });
  } catch (error) {
    console.error('获取组织详情失败:', error);
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
 * 更新组织信息
 * 仅组织创建者可以更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // 查询组织信息
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));

    if (!organization) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '组织不存在',
          },
        },
        { status: 404 }
      );
    }

    // 验证权限
    if (organization.owner_id !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: '只有组织创建者可以修改组织信息',
          },
        },
        { status: 403 }
      );
    }

    // 解析和验证请求体
    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // 更新组织信息
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...validatedData,
        updated_at: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        owner_id: organizations.owner_id,
        created_at: organizations.created_at,
        updated_at: organizations.updated_at,
      });

    return NextResponse.json({
      data: updatedOrganization,
      message: '组织信息更新成功',
    });
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

    console.error('更新组织信息失败:', error);
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
 * 删除组织
 * 仅组织创建者可以删除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // 查询组织信息
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));

    if (!organization) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: '组织不存在',
          },
        },
        { status: 404 }
      );
    }

    // 验证权限
    if (organization.owner_id !== session.user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: '只有组织创建者可以删除组织',
          },
        },
        { status: 403 }
      );
    }

    // 删除组织（关联的演讲会将 org_id 设置为 null）
    await db.delete(organizations).where(eq(organizations.id, id));

    return NextResponse.json({
      message: '组织删除成功',
    });
  } catch (error) {
    console.error('删除组织失败:', error);
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
