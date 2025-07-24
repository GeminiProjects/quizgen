import { authUser } from '@repo/auth/schema';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from './columns.helpers';
import { lectures } from './lectures';

/**
 * 评论可见性枚举
 */
export const commentVisibilityEnum = pgEnum('comment_visibility', [
  'public', // 公开可见
  'speaker_only', // 仅演讲者可见
]);

/**
 * 评论表
 * 存储演讲过程中的聊天记录
 */
export const comments = pgTable(
  'comments',
  {
    // 评论唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 演讲ID
    lecture_id: uuid('lecture_id')
      .notNull()
      .references(() => lectures.id, { onDelete: 'cascade' }),
    // 用户ID
    user_id: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    // 评论内容
    content: text('content').notNull(),
    // 是否匿名评论
    is_anonymous: boolean('is_anonymous').notNull().default(false),
    // 评论可见性
    visibility: commentVisibilityEnum('visibility').notNull().default('public'),
    // 时间戳
    ...timestamps,
  },
  (table) => [
    // 为演讲ID创建索引
    index('comments_lecture_id_idx').on(table.lecture_id),
    // 为用户ID创建索引
    index('comments_user_id_idx').on(table.user_id),
    // 为创建时间创建索引（用于排序）
    index('comments_created_at_idx').on(table.created_at),
  ]
);

// 评论关系定义
export const commentsRelations = relations(comments, ({ one }) => ({
  // 关联的演讲
  lecture: one(lectures, {
    fields: [comments.lecture_id],
    references: [lectures.id],
  }),
  // 关联的用户
  user: one(authUser, {
    fields: [comments.user_id],
    references: [authUser.id],
  }),
}));

// Zod 模式验证
export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

// TypeScript 类型导出
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;