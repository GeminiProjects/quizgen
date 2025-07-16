import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { lectures } from './lectures';

/**
 * 测验题目表
 * 存储AI生成的选择题
 */
export const quizItems = pgTable(
  'quiz_items',
  {
    // 题目唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 讲座ID
    lecture_id: uuid('lecture_id')
      .notNull()
      .references(() => lectures.id, { onDelete: 'cascade' }),
    // 题目内容
    question: text('question').notNull(),
    // 四个选项
    options: json('options').$type<string[]>().notNull(),
    // 正确答案（0-3）
    answer: integer('answer').notNull(),
    // 生成时间
    ts: timestamp('ts').notNull().defaultNow(),
    // 创建时间
    created_at: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    // 为讲座ID创建索引
    index('quiz_items_lecture_id_idx').on(table.lecture_id),
    // 为时间戳创建索引
    index('quiz_items_timestamp_idx').on(table.ts),
  ]
);

// 测验题目关系定义
export const quizItemsRelations = relations(quizItems, ({ one, many }) => ({
  // 所属讲座
  lecture: one(lectures, {
    fields: [quizItems.lecture_id],
    references: [lectures.id],
  }),
  // 答题记录
  attempts: many(attempts),
}));

// 选项数组验证
const optionsSchema = z.array(z.string()).length(4);

// Zod 模式验证
export const insertQuizItemSchema = createInsertSchema(quizItems, {
  // 选项必须为4个元素
  options: optionsSchema,
  // 答案必须为0-3
  answer: z.number().min(0).max(3),
});
export const selectQuizItemSchema = createSelectSchema(quizItems);

// TypeScript 类型导出
export type QuizItem = typeof quizItems.$inferSelect;
export type NewQuizItem = typeof quizItems.$inferInsert;

import { attempts } from './attempts';
