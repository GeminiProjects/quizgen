import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * 用户表
 * 由 Better Auth 管理，仅支持 GitHub OAuth 登录
 */
export const users = pgTable("users", {
	// 用户唯一标识符
	id: text("id").primaryKey(),
	// 用户显示名称
	name: text("name"),
	// GitHub 邮箱（GitHub OAuth 登录后会提供）
	email: text("email").notNull().unique(),
	// 邮箱验证状态
	emailVerified: boolean("email_verified").notNull().default(false),
	// 记录创建时间
	createdAt: timestamp("created_at").notNull().defaultNow(),
	// 记录更新时间
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 用户关系定义
export const usersRelations = relations(users, ({ many }) => ({
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

import { attempts } from "./attempts";
import { lectures } from "./lectures";
