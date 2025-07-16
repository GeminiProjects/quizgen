/**
 * API 测试环境设置
 * 使用 PGLite 在内存中模拟 PostgreSQL 数据库
 */
import { beforeAll } from 'bun:test';
import * as schema from '@repo/db/schema';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/pglite';

// 创建内存数据库实例
export const createTestDB = () => {
  const db = drizzle({ casing: 'snake_case' });
  return db;
};

// 全局测试数据库实例
export const testDB = createTestDB();

// 初始化数据库结构
const initializeDB = async () => {
  const prev = generateDrizzleJson({});
  const cur = generateDrizzleJson(schema, prev.id, undefined, 'snake_case');
  const statements = await generateMigration(prev, cur);

  for (const statement of statements) {
    // biome-ignore lint/nursery/noAwaitInLoop: 数据库迁移 SQL 必须顺序执行
    await testDB.execute(statement);
  }
};

// 在所有测试开始前初始化数据库
beforeAll(async () => {
  await initializeDB();
});
