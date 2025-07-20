import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// 从环境变量获取数据库连接字符串
const databaseUrl = process.env.DATABASE_URL;

// 确保数据库连接字符串存在
if (!databaseUrl) {
  throw new Error('环境变量 DATABASE_URL 未设置');
}

// 创建数据库连接实例
let db: ReturnType<typeof drizzlePg> | ReturnType<typeof drizzleNeon>;

// 兼容 Neon Serverless 和 PostgreSQL 连接
if (databaseUrl.includes('neon')) {
  db = drizzleNeon(databaseUrl, {
    casing: 'snake_case',
    schema,
  });
} else {
  db = drizzlePg(databaseUrl, {
    casing: 'snake_case',
    schema,
  });
}

// 导出数据库连接实例
export { db };

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
