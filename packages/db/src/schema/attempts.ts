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
 * 存储用户对每道题的答题情况
 */
export const attempts = pgTable(
	"attempts",
	{
		// 题目ID（外键）
		quizId: uuid("quiz_id")
			.notNull()
			.references(() => quizItems.id, { onDelete: "cascade" }),
		// 用户ID（外键）
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		// 用户选择的答案索引（0-3）
		selected: integer("selected").notNull(),
		// 是否答对
		isCorrect: boolean("is_correct").notNull(),
		// 答题耗时（毫秒）
		latencyMs: integer("latency_ms").notNull(),
		// 答题时间
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		// 复合主键：一个用户对一道题只能有一次答题记录
		pk: primaryKey({ columns: [table.quizId, table.userId] }),
		// 为用户ID创建索引，方便查询用户的答题记录
		userIdIdx: index("attempts_user_id_idx").on(table.userId),
		// 为题目ID创建索引，方便查询题目的答题统计
		quizIdIdx: index("attempts_quiz_id_idx").on(table.quizId),
	}),
);

// 答题记录关系定义
export const attemptsRelations = relations(attempts, ({ one }) => ({
	// 答题用户（多对一）
	user: one(users, {
		fields: [attempts.userId],
		references: [users.id],
	}),
	// 答题题目（多对一）
	quizItem: one(quizItems, {
		fields: [attempts.quizId],
		references: [quizItems.id],
	}),
}));

// Zod 模式验证
export const insertAttemptSchema = createInsertSchema(attempts, {
	// 选择的答案必须是0-3之间的整数
	selected: z.number().min(0).max(3),
	// 答题耗时必须是正数
	latencyMs: z.number().positive(),
});
export const selectAttemptSchema = createSelectSchema(attempts);

// TypeScript 类型导出
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
