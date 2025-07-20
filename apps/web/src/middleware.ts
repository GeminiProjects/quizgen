/**
 * Next.js 中间件 - 简化版
 * 只处理：
 * 1. 已登录用户访问首页时重定向
 * 2. 添加安全响应头
 */

import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 跳过 API 路由
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 添加安全响应头
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 只在首页检查登录状态
  if (pathname === '/') {
    const sessionCookie = request.cookies.get('better-auth.session_token');

    // 如果已登录且不是明确要求登录（?auth=required），则重定向
    if (sessionCookie && searchParams.get('auth') !== 'required') {
      const callbackUrl = searchParams.get('callbackUrl');
      const redirectUrl = callbackUrl?.startsWith('/')
        ? callbackUrl
        : '/participation';

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return response;
}

// 配置要应用中间件的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - 静态文件 (_next/static/*, _next/image/*)
     * - 公共资源 (favicon.ico, robots.txt 等)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
