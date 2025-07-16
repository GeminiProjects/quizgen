/**
 * Next.js 中间件 - 路由保护
 * 基于 Better Auth 会话进行访问控制
 */

import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取会话 cookie（用于快速检查，不是完整验证）
  const sessionCookie = getSessionCookie(request);

  // 如果未登录用户访问受保护的路由，重定向到主页
  if (!sessionCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 配置要应用中间件的路由
export const config = {
  matcher: [
    '/dashboard/:path*', // 保护仪表板路由
  ],
};
