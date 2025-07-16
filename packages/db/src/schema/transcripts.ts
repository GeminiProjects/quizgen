import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { lectures } from './lectures';

/**
 * 转录文本表
 * 存储实时语音转录
 */
export const transcripts = pgTable(
  'transcripts',
  {
    // 转录唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 演讲ID
    lecture_id: uuid('lecture_id')
      .notNull()
      .references(() => lectures.id, { onDelete: 'cascade' }),
    // 转录文本
    text: text('text').notNull(),
    // 转录时间
    ts: timestamp('ts').notNull().defaultNow(),
    // 创建时间
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    // 为演讲ID创建索引
    index('transcripts_lecture_id_idx').on(table.lecture_id),
    // 为时间戳创建索引
    index('transcripts_timestamp_idx').on(table.ts),
  ]
);

// 转录文本关系定义
export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  // 所属演讲
  lecture: one(lectures, {
    fields: [transcripts.lecture_id],
    references: [lectures.id],
  }),
}));

// Zod 模式验证
export const insertTranscriptSchema = createInsertSchema(transcripts);
export const selectTranscriptSchema = createSelectSchema(transcripts);

// TypeScript 类型导出
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
