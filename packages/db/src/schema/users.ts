import {
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

// 用户角色枚举
export const userRoleEnum = pgEnum("user_role", [
    "speaker",
    "organizer",
    "audience",
]);

// 用户表 - 支持演讲者、组织者、听众三种角色
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull(),
    displayName: varchar("display_name", { length: 100 }),
    avatar: text("avatar"), // 头像URL
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
