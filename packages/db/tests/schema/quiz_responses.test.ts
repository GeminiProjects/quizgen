import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import {
	type NewQuizResponse,
	quizResponses,
} from "../../src/schema/quiz_responses";
import { db } from "../setup";

describe("答题记录表测试", () => {
	beforeEach(async () => {
		// 清空测试数据
		await db.delete(quizResponses);
	});

	describe("答题记录创建", () => {
		it("应该能创建答题记录", async () => {
			const newResponse: NewQuizResponse = {
				quizId: 1,
				userId: 1,
				userAnswer: "A",
				isCorrect: true,
				timeSpent: 5,
				nickname: "聪明的小猫",
			};

			const result = await db
				.insert(quizResponses)
				.values(newResponse)
				.returning();

			expect(result).toHaveLength(1);
			expect(result[0].userAnswer).toBe("A");
			expect(result[0].isCorrect).toBe(true);
			expect(result[0].timeSpent).toBe(5);
			expect(result[0].nickname).toBe("聪明的小猫");
			expect(result[0].answeredAt).toBeDefined();
		});

		it("应该能创建错误答案记录", async () => {
			const newResponse: NewQuizResponse = {
				quizId: 1,
				userId: 2,
				userAnswer: "B",
				isCorrect: false,
				timeSpent: 8,
				nickname: "好奇的小狗",
			};

			const result = await db
				.insert(quizResponses)
				.values(newResponse)
				.returning();

			expect(result[0].isCorrect).toBe(false);
			expect(result[0].userAnswer).toBe("B");
		});
	});

	describe("答案选项验证", () => {
		it("应该支持所有答案选项", async () => {
			const answers = ["A", "B", "C", "D"];

			for (const answer of answers) {
				const response: NewQuizResponse = {
					quizId: 1,
					userId: 1,
					userAnswer: answer,
					isCorrect: answer === "A", // 假设A是正确答案
					timeSpent: 6,
				};

				const result = await db
					.insert(quizResponses)
					.values(response)
					.returning();
				expect(result[0].userAnswer).toBe(answer);
			}
		});
	});

	describe("反馈功能", () => {
		it("应该能记录用户反馈", async () => {
			const feedbackOptions = [
				"讲得太快",
				"讲得太慢",
				"内容很乏味",
				"题目质量差",
				"很有趣",
			];

			for (const feedback of feedbackOptions) {
				const response: NewQuizResponse = {
					quizId: 1,
					userId: 1,
					userAnswer: "A",
					isCorrect: true,
					timeSpent: 7,
					feedback,
				};

				const result = await db
					.insert(quizResponses)
					.values(response)
					.returning();
				expect(result[0].feedback).toBe(feedback);
			}
		});
	});

	describe("匿名昵称", () => {
		it("应该支持主题化昵称", async () => {
			const nicknames = [
				"聪明的小猫",
				"快乐的小狗",
				"美味的蛋糕",
				"甜蜜的巧克力",
				"可爱的熊猫",
			];

			for (const nickname of nicknames) {
				const response: NewQuizResponse = {
					quizId: 1,
					userId: 1,
					userAnswer: "A",
					isCorrect: true,
					nickname,
				};

				const result = await db
					.insert(quizResponses)
					.values(response)
					.returning();
				expect(result[0].nickname).toBe(nickname);
			}
		});
	});

	describe("统计查询", () => {
		beforeEach(async () => {
			// 准备测试数据
			const testData = [
				{
					quizId: 1,
					userId: 1,
					userAnswer: "A",
					isCorrect: true,
					timeSpent: 5,
					nickname: "用户1",
				},
				{
					quizId: 1,
					userId: 2,
					userAnswer: "B",
					isCorrect: false,
					timeSpent: 8,
					nickname: "用户2",
				},
				{
					quizId: 1,
					userId: 3,
					userAnswer: "A",
					isCorrect: true,
					timeSpent: 6,
					nickname: "用户3",
				},
				{
					quizId: 2,
					userId: 1,
					userAnswer: "C",
					isCorrect: true,
					timeSpent: 4,
					nickname: "用户1",
				},
				{
					quizId: 2,
					userId: 2,
					userAnswer: "D",
					isCorrect: false,
					timeSpent: 9,
					nickname: "用户2",
				},
			];

			await db.insert(quizResponses).values(testData);
		});

		it("应该能按题目查询答题记录", async () => {
			const quiz1Responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.quizId, 1));
			const quiz2Responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.quizId, 2));

			expect(quiz1Responses).toHaveLength(3);
			expect(quiz2Responses).toHaveLength(2);
		});

		it("应该能按用户查询答题记录", async () => {
			const user1Responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.userId, 1));
			const user2Responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.userId, 2));

			expect(user1Responses).toHaveLength(2);
			expect(user2Responses).toHaveLength(2);
		});

		it("应该能查询正确答案的记录", async () => {
			const correctResponses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.isCorrect, true));
			const wrongResponses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.isCorrect, false));

			expect(correctResponses).toHaveLength(3);
			expect(wrongResponses).toHaveLength(2);
		});

		it("应该能查询特定题目的正确率", async () => {
			const quiz1Responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.quizId, 1));
			const quiz1Correct = quiz1Responses.filter((r) => r.isCorrect).length;
			const quiz1Total = quiz1Responses.length;
			const quiz1AccuracyRate = (quiz1Correct / quiz1Total) * 100;

			expect(quiz1AccuracyRate).toBeCloseTo(66.67, 1); // 2/3 ≈ 66.67%
		});
	});

	describe("答题时间统计", () => {
		it("应该能统计平均答题时间", async () => {
			const testData = [
				{
					quizId: 1,
					userId: 1,
					userAnswer: "A",
					isCorrect: true,
					timeSpent: 5,
				},
				{
					quizId: 1,
					userId: 2,
					userAnswer: "B",
					isCorrect: false,
					timeSpent: 8,
				},
				{
					quizId: 1,
					userId: 3,
					userAnswer: "A",
					isCorrect: true,
					timeSpent: 7,
				},
			];

			await db.insert(quizResponses).values(testData);

			const responses = await db
				.select()
				.from(quizResponses)
				.where(eq(quizResponses.quizId, 1));
			const totalTime = responses.reduce(
				(sum, r) => sum + (r.timeSpent || 0),
				0,
			);
			const averageTime = totalTime / responses.length;

			expect(averageTime).toBeCloseTo(6.67, 1); // (5+8+7)/3 ≈ 6.67
		});
	});
});
