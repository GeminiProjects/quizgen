import { NextResponse } from 'next/server';

/**
 * 成功响应
 */
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 错误响应
 */
export function error(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * 处理 API 错误的装饰器
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error('API Error:', err);
      return error(
        err instanceof Error ? err.message : 'Internal server error',
        500
      );
    }
  };
}
