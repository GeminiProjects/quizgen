import { authUser } from '@repo/auth/schema';
import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from './columns.helpers';
import { organizations } from './organizations';

/**
 * 演讲状态枚举
 */
export const lectureStatusEnum = pgEnum('lecture_status', [
  'not_started', // 未开始
  'in_progress', // 进行中
  'paused', // 暂停
  'ended', // 已结束
]);

/**
 * 演讲表
 * 存储演讲会话信息
 */
export const lectures = pgTable(
  'lectures',
  {
    // 演讲唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 演讲标题
    title: text('title').notNull(),
    // 演讲描述
    description: text('description'),
    // 创建者ID
    owner_id: text('owner_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    // 所属组织ID（可选，NULL表示个人演讲）
    org_id: uuid('org_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    // 演讲码（用于观众加入演讲）
    join_code: text('join_code').notNull().unique(),
    // 演讲状态
    status: lectureStatusEnum('status').notNull().default('not_started'),
    // 开始时间
    starts_at: timestamp('starts_at').notNull(),
    // 结束时间
    ends_at: timestamp('ends_at'),
    // 时间戳
    ...timestamps,
  },
  (table) => [
    // 为创建者ID创建索引
    index('lectures_owner_id_idx').on(table.owner_id),
    // 为组织ID创建索引
    index('lectures_org_id_idx').on(table.org_id),
    // 为演讲码创建索引（提高查询性能）
    index('lectures_join_code_idx').on(table.join_code),
  ]
);

// 演讲关系定义
export const lecturesRelations = relations(lectures, ({ one, many }) => ({
  // 创建者
  owner: one(authUser, {
    fields: [lectures.owner_id],
    references: [authUser.id],
  }),
  // 所属组织
  organization: one(organizations, {
    fields: [lectures.org_id],
    references: [organizations.id],
  }),
  // 演讲材料
  materials: many(materials),
  // 转录文本
  transcripts: many(transcripts),
  // 测验题目
  quizItems: many(quizItems),
  // 参与者
  participants: many(lectureParticipants),
}));

// Zod 模式验证
export const insertLectureSchema = createInsertSchema(lectures);
export const selectLectureSchema = createSelectSchema(lectures);

// TypeScript 类型导出
export type Lecture = typeof lectures.$inferSelect;
export type NewLecture = typeof lectures.$inferInsert;

// 导入相关表定义
import { lectureParticipants } from './lecture-participants';
import { materials } from './materials';
import { quizItems } from './quiz-items';
import { transcripts } from './transcripts';
