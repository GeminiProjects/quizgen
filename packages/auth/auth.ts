/**
 * Better Auth CLI 配置文件
 * 用于生成数据库 schema
 */
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // 数据库配置 - 使用连接字符串
  database: {
    provider: 'pg',
    url: process.env.DATABASE_URL || 'postgres://your_postgres_url',
  },

  // 仅配置 GitHub 社交登录
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // 基础配置
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
});
