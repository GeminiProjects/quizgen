import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// 从环境变量获取数据库连接字符串
const databaseUrl = process.env.DATABASE_URL;

// 确保数据库连接字符串存在
if (!databaseUrl) {
  throw new Error('环境变量 DATABASE_URL 未设置');
}

// 创建数据库连接实例
// 使用 snake_case 命名约定
export const db = drizzle(neon(databaseUrl), { casing: 'snake_case' });

// 导出 Drizzle ORM 常用工具
export {
  and,
  asc,
  avg,
  between,
  count,
  desc,
  eq,
  exists,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  max,
  min,
  ne,
  not,
  notBetween,
  notExists,
  notIlike,
  notInArray,
  notLike,
  or,
  sql,
  sum,
} from 'drizzle-orm';

// 导出 PostgreSQL 特定工具
export type { PgTableWithColumns, PgTransaction } from 'drizzle-orm/pg-core';

// 导出所有 Schema 定义
export * from './schema';
// 导出数据库类型定义
export * from './types';
// 导出工具函数
export * from './utils/lecture-code';
