import {
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// 演讲状态枚举
export const presentationStatusEnum = pgEnum("presentation_status", [
	"draft",
	"active",
	"completed",
	"cancelled",
]);

// 输入材料类型枚举
export const inputTypeEnum = pgEnum("input_type", [
	"text",
	"ppt",
	"pdf",
	"audio",
	"video",
]);

// 演讲/课程表 - 存储演讲信息和输入材料
export const presentations = pgTable("presentations", {
	id: serial("id").primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description"),
	speakerId: integer("speaker_id").notNull(), // 关联users表
	organizerId: integer("organizer_id"), // 关联users表，可选
	status: presentationStatusEnum("status").notNull().default("draft"),
	inputType: inputTypeEnum("input_type"), // 输入材料类型
	inputContent: text("input_content"), // 输入材料内容或文件路径
	scheduledAt: timestamp("scheduled_at"),
	startedAt: timestamp("started_at"),
	endedAt: timestamp("ended_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Presentation = typeof presentations.$inferSelect;
export type NewPresentation = typeof presentations.$inferInsert;