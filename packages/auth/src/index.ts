/**
 * Better Auth 服务端配置
 * 仅支持 GitHub OAuth 登录
 */

import { db } from '@repo/db';
import { betterAuth, type Session, type User } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
  anonymous,
  type BetterAuthPlugin,
  oAuthProxy,
} from 'better-auth/plugins';
import { authTables } from './schema';

const plugins: BetterAuthPlugin[] = [];

// 配置 OAuth 代理插件（如果设置了代理环境变量）
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) {
  plugins.push(oAuthProxy({}));
}

if (process.env.NODE_ENV === 'development') {
  plugins.push(anonymous());
}

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

  // 仅在有环境变量时配置 GitHub 社交登录
  socialProviders:
    process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {},

  // 基础配置
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET as string,

  // 插件
  plugins,
});

// 导出类型
export type Auth = typeof auth;

// 导出 Better Auth 相关类型
export type { Session, User } from 'better-auth';

export type SessionResponse = {
  session: Session;
  user: User;
};
