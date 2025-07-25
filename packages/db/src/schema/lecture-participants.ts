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
 * 参与者状态枚举
 */
export const participantStatusEnum = pgEnum('participant_status', [
  'joined', // 已加入
  'active', // 活跃中（正在参与）
  'left', // 已离开
  'kicked', // 被踢出
]);

/**
 * 参与者角色枚举
 */
export const participantRoleEnum = pgEnum('participant_role', [
  'speaker', // 演讲者
  'audience', // 观众
  'assistant', // 助理（可协助管理）
]);

/**
 * 演讲参与者表
 * 管理用户加入演讲的状态
 */
export const lectureParticipants = pgTable(
  'lecture_participants',
  {
    // 参与演讲唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 演讲ID
    lecture_id: uuid('lecture_id')
      .notNull()
      .references(() => lectures.id, { onDelete: 'cascade' }),
    // 用户ID
    user_id: text('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    // 参与者角色
    role: participantRoleEnum('role').notNull().default('audience'),
    // 参与状态
    status: participantStatusEnum('status').notNull().default('joined'),
    // 加入时间
    joined_at: timestamp('joined_at').notNull().defaultNow(),
    // 离开时间
    left_at: timestamp('left_at'),
    // 是否在线
    is_online: boolean('is_online').notNull().default(false),
    // 最后活跃时间
    last_active_at: timestamp('last_active_at').notNull().defaultNow(),
    // 时间戳
    ...timestamps,
  },
  (table) => [
    // 为演讲ID创建索引
    index('participants_lecture_id_idx').on(table.lecture_id),
    // 为用户ID创建索引
    index('participants_user_id_idx').on(table.user_id),
    // 复合唯一索引：一个用户在一个演讲中只能有一条活跃记录
    index('participants_lecture_user_idx').on(table.lecture_id, table.user_id),
    // 在线状态索引
    index('participants_online_status_idx').on(
      table.lecture_id,
      table.is_online,
      table.last_active_at
    ),
  ]
);

// 演讲参与者关系定义
export const lectureParticipantsRelations = relations(
  lectureParticipants,
  ({ one }) => ({
    // 关联的演讲
    lecture: one(lectures, {
      fields: [lectureParticipants.lecture_id],
      references: [lectures.id],
    }),
    // 关联的用户
    user: one(authUser, {
      fields: [lectureParticipants.user_id],
      references: [authUser.id],
    }),
  })
);

// Zod 模式验证
export const insertLectureParticipantSchema =
  createInsertSchema(lectureParticipants);
export const selectLectureParticipantSchema =
  createSelectSchema(lectureParticipants);

// TypeScript 类型导出
export type LectureParticipant = typeof lectureParticipants.$inferSelect;
export type NewLectureParticipant = typeof lectureParticipants.$inferInsert;
