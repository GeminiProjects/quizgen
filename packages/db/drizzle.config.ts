import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/schema/',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: { url: databaseUrl },
});
