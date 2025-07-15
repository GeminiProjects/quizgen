import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { lectures } from "./lectures";

/**
 * 转录文本表
 * 存储演讲过程中的实时语音转文字内容
 */
export const transcripts = pgTable(
	"transcripts",
	{
		// 转录片段唯一标识符
		id: uuid("id").primaryKey().defaultRandom(),
		// 关联的演讲ID
		lectureId: uuid("lecture_id")
			.notNull()
			.references(() => lectures.id, { onDelete: "cascade" }),
		// 转录的文本内容
		text: text("text").notNull(),
		// 转录时间戳
		timestamp: timestamp("ts").notNull().defaultNow(),
		// 记录创建时间
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => ({
		// 为演讲ID创建索引，提高查询性能
		lectureIdIdx: index("transcripts_lecture_id_idx").on(table.lectureId),
		// 为时间戳创建索引，方便按时间查询
		timestampIdx: index("transcripts_timestamp_idx").on(table.timestamp),
	}),
);

// 转录文本关系定义
export const transcriptsRelations = relations(transcripts, ({ one }) => ({
	// 所属演讲（多对一）
	lecture: one(lectures, {
		fields: [transcripts.lectureId],
		references: [lectures.id],
	}),
}));

// Zod 模式验证
export const insertTranscriptSchema = createInsertSchema(transcripts);
export const selectTranscriptSchema = createSelectSchema(transcripts);

// TypeScript 类型导出
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
