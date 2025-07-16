import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { timestamps } from "./columns.helpers";
import { organizations } from "./organizations";
import { users } from "./users";

/**
 * 讲座表
 * 存储演讲会话信息
 */
export const lectures = pgTable(
	"lectures",
	{
		// 讲座唯一标识
		id: uuid("id").primaryKey().defaultRandom(),
		// 讲座标题
		title: text("title").notNull(),
		// 讲座描述
		description: text("description"),
		// 创建者ID
		owner_id: text("owner_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		// 所属组织ID（可选，NULL表示个人讲座）
		org_id: uuid("org_id").references(() => organizations.id, {
			onDelete: "set null",
		}),
		// 开始时间
		starts_at: timestamp("starts_at").notNull(),
		// 结束时间
		ends_at: timestamp("ends_at"),
		// 时间戳
		...timestamps,
	},
	(table) => [
		// 为创建者ID创建索引
		index("lectures_owner_id_idx").on(table.owner_id),
		// 为组织ID创建索引
		index("lectures_org_id_idx").on(table.org_id),
	],
);

// 讲座关系定义
export const lecturesRelations = relations(lectures, ({ one, many }) => ({
	// 创建者
	owner: one(users, {
		fields: [lectures.owner_id],
		references: [users.id],
	}),
	// 所属组织
	organization: one(organizations, {
		fields: [lectures.org_id],
		references: [organizations.id],
	}),
	// 讲座材料
	materials: many(materials),
	// 转录文本
	transcripts: many(transcripts),
	// 测验题目
	quizItems: many(quizItems),
}));

// Zod 模式验证
export const insertLectureSchema = createInsertSchema(lectures);
export const selectLectureSchema = createSelectSchema(lectures);

// TypeScript 类型导出
export type Lecture = typeof lectures.$inferSelect;
export type NewLecture = typeof lectures.$inferInsert;

// 导入相关表定义
import { materials } from "./materials";
import { quizItems } from "./quiz_items";
import { transcripts } from "./transcripts";
