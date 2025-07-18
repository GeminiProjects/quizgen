/**
 * Better Auth 认证相关数据表 schema
 * 基于官方文档手动创建，使用 auth_ 前缀
 */
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// 认证用户表（Better Auth 管理）
export const authUser = pgTable('auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// 会话表
export const authSession = pgTable('auth_session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
});

// OAuth 账户表
export const authAccount = pgTable('auth_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

// 验证表
export const authVerification = pgTable('auth_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// 类型定义
export type User = typeof authUser.$inferSelect;
export type NewUser = typeof authUser.$inferInsert;
export type Session = typeof authSession.$inferSelect;
export type NewSession = typeof authSession.$inferInsert;
export type Account = typeof authAccount.$inferSelect;
export type NewAccount = typeof authAccount.$inferInsert;
export type Verification = typeof authVerification.$inferSelect;
export type NewVerification = typeof authVerification.$inferInsert;

// 为了向后兼容，导出 users 表的别名
export const users = authUser;

// 导出所有表
export const authTables = {
  user: authUser,
  session: authSession,
  account: authAccount,
  verification: authVerification,
};
