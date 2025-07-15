import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { lectures } from "./lectures";

/**
 * 材料表
 * 存储演讲前上传的相关材料（PPT、PDF、文本等）
 */
export const materials = pgTable(
	"materials",
	{
		// 材料唯一标识符
		id: uuid("id").primaryKey().defaultRandom(),
		// 关联的演讲ID
		lectureId: uuid("lecture_id")
			.notNull()
			.references(() => lectures.id, { onDelete: "cascade" }),
		// 文件名
		fileName: text("file_name").notNull(),
		// 文件类型（MIME类型）
		fileType: text("file_type").notNull(),
		// 提取的文本内容
		textContent: text("text_content").notNull(),
		// 记录创建时间
		createdAt: timestamp("created_at").notNull().defaultNow(),
		// 记录更新时间
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => ({
		// 为演讲ID创建索引，提高查询性能
		lectureIdIdx: index("materials_lecture_id_idx").on(table.lectureId),
	}),
);

// 材料关系定义
export const materialsRelations = relations(materials, ({ one }) => ({
	// 所属演讲（多对一）
	lecture: one(lectures, {
		fields: [materials.lectureId],
		references: [lectures.id],
	}),
}));

// Zod 模式验证
export const insertMaterialSchema = createInsertSchema(materials);
export const selectMaterialSchema = createSelectSchema(materials);

// TypeScript 类型导出
export type Material = typeof materials.$inferSelect;
export type NewMaterial = typeof materials.$inferInsert;
