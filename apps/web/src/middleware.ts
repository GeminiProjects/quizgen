/**
 * Next.js 中间件 - 路由保护
 * 基于 Better Auth 会话进行访问控制
 */

import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

// 受保护的路由前缀
const PROTECTED_PATHS = ['/dashboard', '/lecture', '/organization', '/profile'];

// 公开路由（登录后需要重定向）
const AUTH_PATHS = ['/auth'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 获取会话 cookie（用于快速检查，不是完整验证）
  const sessionCookie = getSessionCookie(request);
  const isAuthenticated = !!sessionCookie;

  // 检查是否是受保护的路由
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // 未登录用户访问受保护路由 -> 重定向到登录页
  if (!isAuthenticated && isProtectedPath) {
    const signinUrl = new URL('/auth/signin', request.url);
    // 保存原始 URL，登录后可以重定向回来
    signinUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signinUrl);
  }

  // 已登录用户访问登录页 -> 重定向到 dashboard
  if (isAuthenticated && isAuthPath) {
    // 优先使用 callbackUrl 参数
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl?.startsWith('/')) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 已登录用户访问根路径 -> 重定向到 dashboard
  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 添加安全响应头
  const response = NextResponse.next();

  // 基本安全头
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// 配置要应用中间件的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api 路由 (/api/*)
     * - 静态文件 (_next/static/*, _next/image/*)
     * - 公共资源 (favicon.ico, robots.txt 等)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
