import { relations } from "drizzle-orm";
import {
	index,
	integer,
	json,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { lectures } from "./lectures";

/**
 * 测验题目表
 * 存储AI生成的四选一选择题
 */
export const quizItems = pgTable(
	"quiz_items",
	{
		// 题目唯一标识符
		id: uuid("id").primaryKey().defaultRandom(),
		// 关联的演讲ID
		lectureId: uuid("lecture_id")
			.notNull()
			.references(() => lectures.id, { onDelete: "cascade" }),
		// 题目内容
		question: text("question").notNull(),
		// 四个选项（JSON数组）
		options: json("options").$type<string[]>().notNull(),
		// 正确答案索引（0-3）
		answer: integer("answer").notNull(),
		// 题目生成时间戳
		timestamp: timestamp("ts").notNull().defaultNow(),
		// 记录创建时间
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		// 为演讲ID创建索引，提高查询性能
		lectureIdIdx: index("quiz_items_lecture_id_idx").on(table.lectureId),
		// 为时间戳创建索引，方便按时间查询
		timestampIdx: index("quiz_items_timestamp_idx").on(table.timestamp),
	}),
);

// 测验题目关系定义
export const quizItemsRelations = relations(quizItems, ({ one, many }) => ({
	// 所属演讲（多对一）
	lecture: one(lectures, {
		fields: [quizItems.lectureId],
		references: [lectures.id],
	}),
	// 答题记录（一对多）
	attempts: many(attempts),
}));

// 选项数组验证：必须包含4个字符串元素
const optionsSchema = z.array(z.string()).length(4);

// Zod 模式验证
export const insertQuizItemSchema = createInsertSchema(quizItems, {
	// 选项必须是4个元素的数组
	options: optionsSchema,
	// 答案必须是0-3之间的整数
	answer: z.number().min(0).max(3),
});
export const selectQuizItemSchema = createSelectSchema(quizItems);

// TypeScript 类型导出
export type QuizItem = typeof quizItems.$inferSelect;
export type NewQuizItem = typeof quizItems.$inferInsert;

import { attempts } from "./attempts";
