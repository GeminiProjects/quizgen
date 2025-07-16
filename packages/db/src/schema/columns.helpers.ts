import { timestamp } from 'drizzle-orm/pg-core';

/**
 * 可复用的列定义
 */

// 通用时间戳字段
export const timestamps = {
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
};
