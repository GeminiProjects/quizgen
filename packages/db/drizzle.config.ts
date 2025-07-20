import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '../../.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('环境变量 DATABASE_URL 未设置');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/schema/',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url: databaseUrl },
});
