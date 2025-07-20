/**
 * API 工具函数
 * 提供统一的 API 响应格式和错误处理
 */

import { NextResponse } from 'next/server';
import type { z } from 'zod';

/**
 * 统一的 API 响应类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  const response = NextResponse.json({
    success: true,
    data,
    message,
  });

  // 添加缓存头，缓存 5 秒
  response.headers.set(
    'Cache-Control',
    'public, s-maxage=5, stale-while-revalidate=59'
  );

  return response;
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * 验证请求体
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: `请求参数验证失败: ${result.error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ')}`,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (_error) {
    return {
      success: false,
      error: '无效的 JSON 格式',
    };
  }
}

/**
 * 验证查询参数
 */
export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  // 将 URLSearchParams 转换为对象
  const params = Object.fromEntries(searchParams.entries());

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      error: `查询参数验证失败: ${result.error.issues
        .map((e) => e.message)
        .join(', ')}`,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * 处理数据库错误
 */
export function handleDatabaseError(error: unknown): NextResponse<ApiResponse> {
  console.error('数据库错误:', error);

  // 处理常见的数据库错误
  if (error instanceof Error) {
    if (error.message.includes('duplicate key')) {
      return createErrorResponse('数据已存在', 409);
    }

    if (error.message.includes('foreign key')) {
      return createErrorResponse('关联数据不存在', 400);
    }

    if (error.message.includes('not null')) {
      return createErrorResponse('必填字段不能为空', 400);
    }
  }

  return createErrorResponse('数据库操作失败', 500);
}

/**
 * 异步错误处理包装器
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API 错误:', error);

      // 如果是数据库错误，使用专门的处理函数
      if (error instanceof Error && error.message.includes('数据库')) {
        return handleDatabaseError(error);
      }

      return createErrorResponse('服务器内部错误', 500);
    }
  };
}
