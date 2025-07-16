/**
 * Better Auth 服务端配置
 * 仅支持 GitHub OAuth 登录
 */

import { db } from '@repo/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { authTables } from './schema';

export const auth = betterAuth({
  // 数据库配置 - 使用 Drizzle 适配器
  database: drizzleAdapter(db, {
    provider: 'pg', // PostgreSQL
    schema: {
      user: authTables.user,
      session: authTables.session,
      account: authTables.account,
      verification: authTables.verification,
    },
  }),

  // 仅配置 GitHub 社交登录
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // 基础配置
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET as string,
});

// 导出类型
export type Auth = typeof auth;
