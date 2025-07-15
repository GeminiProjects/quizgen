// 导入数据库类型
import type { Attempt, Lecture, QuizItem, User } from "@repo/db";

// 用户相关类型
export type { User, Lecture, QuizItem, Attempt };

// 演讲状态
export type LectureStatus = "upcoming" | "ongoing" | "ended";

// 扩展的演讲类型，包含状态和统计信息
export interface LectureWithStats extends Lecture {
    status: LectureStatus;
    participantCount: number;
    quizCount: number;
}

// 用户角色
export type UserRole = "speaker" | "audience";

// 答题状态
export type AnswerStatus = "pending" | "submitted" | "correct" | "incorrect";

// 答题界面状态
export interface QuizState {
    quizItem: QuizItem | null;
    selectedAnswer: number | null;
    status: AnswerStatus;
    timeLeft: number;
    isLoading: boolean;
}

// 统计信息
export interface QuizStats {
    totalAttempts: number;
    correctAttempts: number;
    correctRate: number;
    avgLatency: number;
    answerDistribution: number[]; // 每个选项的选择次数
}

