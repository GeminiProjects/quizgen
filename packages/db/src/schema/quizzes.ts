import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

// 题目状态枚举
export const quizStatusEnum = pgEnum("quiz_status", [
    "draft",
    "active",
    "completed",
    "cancelled",
]);

// 测验题目表 - 存储AI生成的选择题
export const quizzes = pgTable("quizzes", {
    id: serial("id").primaryKey(),
    presentationId: integer("presentation_id").notNull(), // 关联presentations表
    question: text("question").notNull(), // 题目内容
    optionA: varchar("option_a", { length: 255 }).notNull(),
    optionB: varchar("option_b", { length: 255 }).notNull(),
    optionC: varchar("option_c", { length: 255 }).notNull(),
    optionD: varchar("option_d", { length: 255 }).notNull(),
    correctAnswer: varchar("correct_answer", { length: 1 }).notNull(), // A, B, C, D
    explanation: text("explanation"), // 答案解释
    status: quizStatusEnum("status").notNull().default("draft"),
    timeLimit: integer("time_limit").notNull().default(10), // 答题时间限制（秒）
    difficulty: integer("difficulty").default(1), // 难度等级 1-5
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
