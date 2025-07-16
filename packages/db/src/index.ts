import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 从环境变量获取数据库连接字符串
const databaseUrl = process.env.NEON_POSTGRES_URL;

// 确保数据库连接字符串存在
if (!databaseUrl) {
  throw new Error('环境变量 NEON_POSTGRES_URL 未设置');
}

// 创建数据库连接实例
// 使用 snake_case 命名约定
export const db = drizzle(neon(databaseUrl), { casing: 'snake_case' });

// 导出所有数据表模式
export * from './schema/index';
