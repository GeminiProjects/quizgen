import { relations } from 'drizzle-orm';
import { index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { timestamps } from './columns.helpers';
import { lectures } from './lectures';

/**
 * 材料表
 * 存储预上传的演讲材料
 *
 * 状态说明：
 * - processing: 材料正在处理中（上传、解析等）
 * - completed: 材料处理成功，可以使用
 * - timeout: 材料处理超时
 *
 * 注意：处理失败的材料会被自动删除，不会保存在数据库中
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
    // 材料状态: processing（处理中）, completed（成功）, timeout（超时）
    // 注意：失败的材料会被自动删除，不会保存在数据库中
    status: varchar('status', { length: 20 }).notNull().default('processing'),
    // 错误信息（当状态为 timeout 时使用）
    error_message: text('error_message'),
    // 创建者ID
    created_by: text('created_by'),
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
