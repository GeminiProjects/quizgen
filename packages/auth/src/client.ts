/**
 * Better Auth 客户端配置
 * 仅支持 GitHub OAuth 登录
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// 导出常用的认证方法
export const { signIn, signOut, useSession, getSession } = authClient;

// 导出类型
export type AuthClient = typeof authClient;
