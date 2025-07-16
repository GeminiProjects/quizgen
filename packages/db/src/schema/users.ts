import { relations } from 'drizzle-orm';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from './columns.helpers';

/**
 * 用户表
 * 由 Better Auth 管理，支持 GitHub OAuth 登录
 */
export const users = pgTable('users', {
  // 用户唯一标识
  id: text('id').primaryKey(),
  // 显示名称
  name: text('name'),
  // 邮箱地址
  email: text('email').notNull().unique(),
  // 邮箱验证状态
  emailVerified: boolean('email_verified').notNull().default(false),
  // 时间戳
  ...timestamps,
});

// 用户关系定义
export const usersRelations = relations(users, ({ many }) => ({
  // 用户创建的组织
  organizations: many(organizations),
  // 用户创建的演讲
  lectures: many(lectures),
  // 用户的答题记录
  attempts: many(attempts),
}));

// Zod 模式验证
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// TypeScript 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

import { attempts } from './attempts';
import { lectures } from './lectures';
import { organizations } from './organizations';
