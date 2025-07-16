import { relations } from "drizzle-orm";
import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { timestamps } from "./columns.helpers";
import { lectures } from "./lectures";
import { users } from "./users";

/**
 * 组织表
 * 用于管理系列讲座集合
 */
export const organizations = pgTable(
	"organizations",
	{
		// 组织唯一标识
		id: uuid("id").primaryKey().defaultRandom(),
		// 组织名称
		name: text("name").notNull(),
		// 组织描述
		description: text("description"),
		// 加入密码（演讲者创建讲座时需要）
		password: text("password").notNull(),
		// 创建者ID
		owner_id: text("owner_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		// 时间戳
		...timestamps,
	},
	(table) => [
		// 为创建者ID创建索引
		index("organizations_owner_id_idx").on(table.owner_id),
	],
);

// 组织关系定义
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
	// 组织创建者
	owner: one(users, {
		fields: [organizations.owner_id],
		references: [users.id],
	}),
	// 组织内的讲座
	lectures: many(lectures),
}));

// Zod 模式验证
export const insertOrganizationSchema = createInsertSchema(organizations);
export const selectOrganizationSchema = createSelectSchema(organizations);

// TypeScript 类型导出
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;