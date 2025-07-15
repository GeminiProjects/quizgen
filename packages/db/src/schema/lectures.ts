import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

/**
 * 演讲/讲座表
 * 存储每场演讲的基本信息
 */
export const lectures = pgTable("lectures", {
	// 演讲唯一标识符
	id: uuid("id").primaryKey().defaultRandom(),
	// 演讲标题
	title: text("title").notNull(),
	// 演讲描述（可选）
	description: text("description"),
	// 演讲者ID（外键关联到用户表）
	ownerId: text("owner_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	// 演讲开始时间
	startsAt: timestamp("starts_at").notNull(),
	// 演讲结束时间（可选）
	endsAt: timestamp("ends_at"),
	// 记录创建时间
	createdAt: timestamp("created_at").notNull().defaultNow(),
	// 记录更新时间
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 演讲关系定义
export const lecturesRelations = relations(lectures, ({ one, many }) => ({
	// 演讲者（一对一）
	owner: one(users, {
		fields: [lectures.ownerId],
		references: [users.id],
	}),
	// 演讲材料（一对多）
	materials: many(materials),
	// 演讲转录文本（一对多）
	transcripts: many(transcripts),
	// 演讲题目（一对多）
	quizItems: many(quizItems),
}));

// Zod 模式验证
export const insertLectureSchema = createInsertSchema(lectures);
export const selectLectureSchema = createSelectSchema(lectures);

// TypeScript 类型导出
export type Lecture = typeof lectures.$inferSelect;
export type NewLecture = typeof lectures.$inferInsert;

import { materials } from "./materials";
import { quizItems } from "./quiz_items";
import { transcripts } from "./transcripts";
