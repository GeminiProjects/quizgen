import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

// 答题记录表 - 存储听众的答题记录
export const quizResponses = pgTable("quiz_responses", {
	id: serial("id").primaryKey(),
	quizId: integer("quiz_id").notNull(), // 关联quizzes表
	userId: integer("user_id").notNull(), // 关联users表（听众）
	userAnswer: varchar("user_answer", { length: 1 }).notNull(), // 用户选择的答案 A, B, C, D
	isCorrect: boolean("is_correct").notNull(), // 是否答对
	timeSpent: integer("time_spent"), // 答题用时（秒）
	nickname: varchar("nickname", { length: 50 }), // 匿名昵称
	feedback: text("feedback"), // 额外反馈：太快/太慢/乏味等
	answeredAt: timestamp("answered_at").defaultNow().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QuizResponse = typeof quizResponses.$inferSelect;
export type NewQuizResponse = typeof quizResponses.$inferInsert;
