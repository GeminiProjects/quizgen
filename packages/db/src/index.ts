import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// 配置 Neon Serverless（优化生产环境性能）
if (process.env.VERCEL_ENV === 'production') {
  // 使用 Vercel 的 WebSocket 代理以获得更好的连接性能
  neonConfig.useSecureWebSocket = true;
  neonConfig.wsProxy = (host, port) => `wss://${host}:${port}/v2`;

  // 启用连接池以减少延迟
  neonConfig.poolQueryViaFetch = true;
}

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
  // 使用 Neon 连接池
  const pool = new Pool({
    connectionString: databaseUrl,
    // 连接池配置
    max: 10, // 最大连接数
    idleTimeoutMillis: 30_000, // 空闲连接超时
    connectionTimeoutMillis: 10_000, // 连接超时
  });

  db = drizzleNeon(pool, {
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
