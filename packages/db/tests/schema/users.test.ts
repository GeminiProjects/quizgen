import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { type NewUser, users } from "../../src/schema/users";
import { db } from "../setup";

describe("用户表测试", () => {
	beforeEach(async () => {
		// 清空测试数据
		await db.delete(users);
	});

	describe("用户创建", () => {
		it("应该能创建演讲者用户", async () => {
			const newUser: NewUser = {
				username: "speaker_test",
				email: "speaker@test.com",
				password: "password123",
				role: "speaker",
				displayName: "测试演讲者",
			};

			const result = await db.insert(users).values(newUser).returning();

			expect(result).toHaveLength(1);
			expect(result[0].username).toBe("speaker_test");
			expect(result[0].role).toBe("speaker");
			expect(result[0].displayName).toBe("测试演讲者");
			expect(result[0].createdAt).toBeDefined();
		});

		it("应该能创建组织者用户", async () => {
			const newUser: NewUser = {
				username: "organizer_test",
				email: "organizer@test.com",
				password: "password123",
				role: "organizer",
			};

			const result = await db.insert(users).values(newUser).returning();

			expect(result[0].role).toBe("organizer");
		});

		it("应该能创建听众用户", async () => {
			const newUser: NewUser = {
				username: "audience_test",
				email: "audience@test.com",
				password: "password123",
				role: "audience",
			};

			const result = await db.insert(users).values(newUser).returning();

			expect(result[0].role).toBe("audience");
		});
	});

	describe("约束验证", () => {
		it("应该强制用户名唯一", async () => {
			const user1: NewUser = {
				username: "duplicate_test",
				email: "user1@test.com",
				password: "password123",
				role: "speaker",
			};

			const user2: NewUser = {
				username: "duplicate_test",
				email: "user2@test.com",
				password: "password123",
				role: "audience",
			};

			await db.insert(users).values(user1);

			expect(async () => {
				await db.insert(users).values(user2);
			}).toThrow();
		});

		it("应该强制邮箱唯一", async () => {
			const user1: NewUser = {
				username: "user1",
				email: "duplicate@test.com",
				password: "password123",
				role: "speaker",
			};

			const user2: NewUser = {
				username: "user2",
				email: "duplicate@test.com",
				password: "password123",
				role: "audience",
			};

			await db.insert(users).values(user1);

			expect(async () => {
				await db.insert(users).values(user2);
			}).toThrow();
		});
	});

	describe("查询操作", () => {
		it("应该能按角色查询用户", async () => {
			const speakers = [
				{
					username: "speaker1",
					email: "speaker1@test.com",
					password: "pwd",
					role: "speaker" as const,
				},
				{
					username: "speaker2",
					email: "speaker2@test.com",
					password: "pwd",
					role: "speaker" as const,
				},
			];

			const audience = [
				{
					username: "audience1",
					email: "audience1@test.com",
					password: "pwd",
					role: "audience" as const,
				},
			];

			await db.insert(users).values([...speakers, ...audience]);

			const foundSpeakers = await db
				.select()
				.from(users)
				.where(eq(users.role, "speaker"));
			const foundAudience = await db
				.select()
				.from(users)
				.where(eq(users.role, "audience"));

			expect(foundSpeakers).toHaveLength(2);
			expect(foundAudience).toHaveLength(1);
		});
	});

	describe("更新操作", () => {
		it("应该能更新用户显示名称", async () => {
			const newUser: NewUser = {
				username: "update_test",
				email: "update@test.com",
				password: "password123",
				role: "speaker",
				displayName: "原始名称",
			};

			const [created] = await db.insert(users).values(newUser).returning();

			const [updated] = await db
				.update(users)
				.set({ displayName: "更新后的名称" })
				.where(eq(users.id, created.id))
				.returning();

			expect(updated.displayName).toBe("更新后的名称");
			expect(updated.updatedAt).toBeDefined();
		});
	});
});
