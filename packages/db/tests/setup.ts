import { beforeAll } from 'bun:test';
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api';
import { drizzle } from 'drizzle-orm/pglite';

// 直接导入 schema 文件，避免导入 index.ts 中需要环境变量的代码
import * as schema from '../src/schema/index';

export const db = drizzle({ casing: 'snake_case' });

const initializeDB = async () => {
  const prev = generateDrizzleJson({});
  const cur = generateDrizzleJson(schema, prev.id, undefined, 'snake_case');
  const statements = await generateMigration(prev, cur);
  for (const statement of statements) {
    // biome-ignore lint/nursery/noAwaitInLoop: 数据库迁移 SQL 必须顺序执行
    await db.execute(statement);
  }
};

beforeAll(async () => {
  await initializeDB();
});
