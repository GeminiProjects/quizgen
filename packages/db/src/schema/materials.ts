import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from './columns.helpers';
import { lectures } from './lectures';

/**
 * 材料表
 * 存储预上传的演讲材料
 */
export const materials = pgTable(
  'materials',
  {
    // 材料唯一标识
    id: uuid('id').primaryKey().defaultRandom(),
    // 演讲ID
    lecture_id: uuid('lecture_id')
      .notNull()
      .references(() => lectures.id, { onDelete: 'cascade' }),
    // 文件名
    file_name: text('file_name').notNull(),
    // 文件类型
    file_type: text('file_type').notNull(),
    // 文本内容
    text_content: text('text_content'),
    // 上传状态: pending, uploading, processing, extracting, completed, failed
    upload_status: varchar('upload_status', { length: 20 }).default('pending'),
    // Gemini API 返回的文件 URI
    gemini_file_uri: text('gemini_file_uri'),
    // 处理进度 (0-100)
    processing_progress: integer('processing_progress').default(0),
    // 错误信息
    error_message: text('error_message'),
    // 创建者ID
    created_by: uuid('created_by'),
    // 时间戳
    ...timestamps,
  },
  (table) => [
    // 为演讲ID创建索引
    index('materials_lecture_id_idx').on(table.lecture_id),
  ]
);

// 材料关系定义
export const materialsRelations = relations(materials, ({ one }) => ({
  // 所属演讲
  lecture: one(lectures, {
    fields: [materials.lecture_id],
    references: [lectures.id],
  }),
}));

// Zod 模式验证
export const insertMaterialSchema = createInsertSchema(materials);
export const selectMaterialSchema = createSelectSchema(materials);

// TypeScript 类型导出
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
