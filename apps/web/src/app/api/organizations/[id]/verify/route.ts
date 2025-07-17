/**
 * 组织密码验证 API 路由
 * POST /api/organizations/[id]/verify - 验证组织密码
 */

import { db } from '@repo/db';
import { organizations } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 路由参数类型
type RouteParams = {
  params: Promise<{ id: string }>;
};

// 请求体验证
const verifySchema = z.object({
  password: z.string().min(1, '请输入密码'),
});

/**
 * 验证组织密码
 * 用于演讲者创建演讲时验证组织密码
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 解析和验证请求体
    const body = await request.json();
    const { password } = verifySchema.parse(body);

    // 查询组织信息
    const [organization] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        password: organizations.password,
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

    // 验证密码
    const isValid = organization.password === password;

    if (!isValid) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PASSWORD',
            message: '密码错误',
          },
        },
        { status: 401 }
      );
    }

    // 密码正确，返回成功
    return NextResponse.json({
      success: true,
      message: '密码验证成功',
      data: {
        id: organization.id,
        name: organization.name,
      },
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

    console.error('验证组织密码失败:', error);
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
