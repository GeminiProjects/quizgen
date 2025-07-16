import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { quizItems } from "./quiz_items";
import { users } from "./users";

/**
 * 答题记录表
 * 存储听众答题情况
 */
export const attempts = pgTable(
	"attempts",
	{
		// 题目ID
		quiz_id: uuid("quiz_id")
			.notNull()
			.references(() => quizItems.id, { onDelete: "cascade" }),
		// 用户ID
		user_id: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		// 选择答案（0-3）
		selected: integer("selected").notNull(),
		// 是否正确
		is_correct: boolean("is_correct").notNull(),
		// 答题耗时（毫秒）
		latency_ms: integer("latency_ms").notNull(),
		// 答题时间
		created_at: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		// 复合主键：同一用户对同一题只能答一次
		primaryKey({ columns: [table.quiz_id, table.user_id] }),
		// 为用户ID创建索引
		index("attempts_user_id_idx").on(table.user_id),
		// 为题目ID创建索引
		index("attempts_quiz_id_idx").on(table.quiz_id),
	],
);

// 答题记录关系定义
export const attemptsRelations = relations(attempts, ({ one }) => ({
	// 答题用户
	user: one(users, {
		fields: [attempts.user_id],
		references: [users.id],
	}),
	// 答题题目
	quizItem: one(quizItems, {
		fields: [attempts.quiz_id],
		references: [quizItems.id],
	}),
}));

// Zod 模式验证
export const insertAttemptSchema = createInsertSchema(attempts, {
	// 选择答案必须为0-3
	selected: z.number().min(0).max(3),
	// 答题耗时必须为正数
	latency_ms: z.number().positive(),
});
export const selectAttemptSchema = createSelectSchema(attempts);

// TypeScript 类型导出
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
