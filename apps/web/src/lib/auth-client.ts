/**
 * Better Auth 客户端配置
 * 用于前端认证操作
 */
import { createAuthClient } from 'better-auth/react';

// 创建认证客户端实例
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

// 导出常用的认证方法
export const { signIn, signOut, useSession, getSession } = authClient;

// 导出类型
export type AuthClient = typeof authClient;
