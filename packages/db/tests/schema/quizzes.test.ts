import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import {
    type NewQuiz,
    quizzes,
} from "../../src/schema/quizzes";
import { db } from "../setup";

describe("测验题目表测试", () => {
    beforeEach(async () => {
        // 清空测试数据
        await db.delete(quizzes);
    });

    describe("题目创建", () => {
        it("应该能创建四选一题目", async () => {
            const newQuiz: NewQuiz = {
                presentationId: 1,
                question: "以下哪个是JavaScript的正确语法？",
                optionA: "var x = 1;",
                optionB: "variable x = 1;",
                optionC: "int x = 1;",
                optionD: "let x := 1;",
                correctAnswer: "A",
                explanation: "JavaScript使用var、let或const声明变量",
                difficulty: 2,
            };

            const result = await db.insert(quizzes).values(newQuiz).returning();

            expect(result).toHaveLength(1);
            expect(result[0].question).toBe("以下哪个是JavaScript的正确语法？");
            expect(result[0].correctAnswer).toBe("A");
            expect(result[0].timeLimit).toBe(10); // 默认值
            expect(result[0].difficulty).toBe(2);
            expect(result[0].isPublished).toBe(false); // 默认值
        });

        it("应该能设置自定义时间限制", async () => {
            const newQuiz: NewQuiz = {
                presentationId: 1,
                question: "复杂题目",
                optionA: "选项A",
                optionB: "选项B",
                optionC: "选项C",
                optionD: "选项D",
                correctAnswer: "B",
                timeLimit: 30,
            };

            const result = await db.insert(quizzes).values(newQuiz).returning();

            expect(result[0].timeLimit).toBe(30);
        });
    });

    describe("题目状态管理", () => {
        it("应该支持所有题目状态", async () => {
            const statuses = ["draft", "active", "completed", "cancelled"] as const;

            for (const status of statuses) {
                const quiz: NewQuiz = {
                    presentationId: 1,
                    question: `${status} 状态题目`,
                    optionA: "选项A",
                    optionB: "选项B",
                    optionC: "选项C",
                    optionD: "选项D",
                    correctAnswer: "A",
                    status,
                };

                const result = await db.insert(quizzes).values(quiz).returning();
                expect(result[0].status).toBe(status);
            }
        });

        it("应该能发布题目", async () => {
            const newQuiz: NewQuiz = {
                presentationId: 1,
                question: "发布测试题目",
                optionA: "选项A",
                optionB: "选项B",
                optionC: "选项C",
                optionD: "选项D",
                correctAnswer: "A",
            };

            const [created] = await db.insert(quizzes).values(newQuiz).returning();

            const publishTime = new Date();
            const [published] = await db
                .update(quizzes)
                .set({
                    isPublished: true,
                    publishedAt: publishTime,
                    status: "active",
                })
                .where(eq(quizzes.id, created.id))
                .returning();

            expect(published.isPublished).toBe(true);
            expect(published.publishedAt).toBeDefined();
            expect(published.status).toBe("active");
        });
    });

    describe("答案验证", () => {
        it("应该只接受ABCD作为正确答案", async () => {
            const validAnswers = ["A", "B", "C", "D"];

            for (const answer of validAnswers) {
                const quiz: NewQuiz = {
                    presentationId: 1,
                    question: `答案${answer}的题目`,
                    optionA: "选项A",
                    optionB: "选项B",
                    optionC: "选项C",
                    optionD: "选项D",
                    correctAnswer: answer,
                };

                const result = await db.insert(quizzes).values(quiz).returning();
                expect(result[0].correctAnswer).toBe(answer);
            }
        });
    });

    describe("难度等级", () => {
        it("应该支持1-5难度等级", async () => {
            const difficulties = [1, 2, 3, 4, 5];

            for (const difficulty of difficulties) {
                const quiz: NewQuiz = {
                    presentationId: 1,
                    question: `难度${difficulty}的题目`,
                    optionA: "选项A",
                    optionB: "选项B",
                    optionC: "选项C",
                    optionD: "选项D",
                    correctAnswer: "A",
                    difficulty,
                };

                const result = await db.insert(quizzes).values(quiz).returning();
                expect(result[0].difficulty).toBe(difficulty);
            }
        });
    });

    describe("查询操作", () => {
        it("应该能按演讲查询题目", async () => {
            const quizzes1 = [
                {
                    presentationId: 1,
                    question: "题目1",
                    optionA: "A",
                    optionB: "B",
                    optionC: "C",
                    optionD: "D",
                    correctAnswer: "A",
                },
                {
                    presentationId: 1,
                    question: "题目2",
                    optionA: "A",
                    optionB: "B",
                    optionC: "C",
                    optionD: "D",
                    correctAnswer: "B",
                },
            ];

            const quizzes2 = [
                {
                    presentationId: 2,
                    question: "题目3",
                    optionA: "A",
                    optionB: "B",
                    optionC: "C",
                    optionD: "D",
                    correctAnswer: "C",
                },
            ];

            await db.insert(quizzes).values([...quizzes1, ...quizzes2]);

            const presentation1Quizzes = await db
                .select()
                .from(quizzes)
                .where(eq(quizzes.presentationId, 1));
            const presentation2Quizzes = await db
                .select()
                .from(quizzes)
                .where(eq(quizzes.presentationId, 2));

            expect(presentation1Quizzes).toHaveLength(2);
            expect(presentation2Quizzes).toHaveLength(1);
        });

        it("应该能查询已发布的题目", async () => {
            const testData = [
                {
                    presentationId: 1,
                    question: "未发布题目",
                    optionA: "A",
                    optionB: "B",
                    optionC: "C",
                    optionD: "D",
                    correctAnswer: "A",
                    isPublished: false,
                },
                {
                    presentationId: 1,
                    question: "已发布题目",
                    optionA: "A",
                    optionB: "B",
                    optionC: "C",
                    optionD: "D",
                    correctAnswer: "B",
                    isPublished: true,
                },
            ];

            await db.insert(quizzes).values(testData);

            const publishedQuizzes = await db
                .select()
                .from(quizzes)
                .where(eq(quizzes.isPublished, true));

            expect(publishedQuizzes).toHaveLength(1);
            expect(publishedQuizzes[0].question).toBe("已发布题目");
        });
    });
});
