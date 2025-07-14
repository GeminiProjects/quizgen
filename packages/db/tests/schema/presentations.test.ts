import { beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import {
    type NewPresentation,
    presentations,
} from "../../src/schema/presentations";
import { db } from "../setup";

describe("演讲表测试", () => {
    beforeEach(async () => {
        // 清空测试数据
        await db.delete(presentations);
    });

    describe("演讲创建", () => {
        it("应该能创建基本演讲", async () => {
            const newPresentation: NewPresentation = {
                title: "测试演讲",
                description: "这是一个测试演讲",
                speakerId: 1,
                status: "draft",
                inputType: "text",
                inputContent: "这是输入内容",
            };

            const result = await db
                .insert(presentations)
                .values(newPresentation)
                .returning();

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe("测试演讲");
            expect(result[0].status).toBe("draft");
            expect(result[0].inputType).toBe("text");
            expect(result[0].createdAt).toBeDefined();
        });

        it("应该能创建带组织者的演讲", async () => {
            const newPresentation: NewPresentation = {
                title: "组织者演讲",
                speakerId: 1,
                organizerId: 2,
                status: "active",
            };

            const result = await db
                .insert(presentations)
                .values(newPresentation)
                .returning();

            expect(result[0].speakerId).toBe(1);
            expect(result[0].organizerId).toBe(2);
        });
    });

    describe("状态管理", () => {
        it("应该支持所有演讲状态", async () => {
            const statuses = ["draft", "active", "completed", "cancelled"] as const;

            for (const status of statuses) {
                const presentation: NewPresentation = {
                    title: `${status} 演讲`,
                    speakerId: 1,
                    status,
                };

                const result = await db
                    .insert(presentations)
                    .values(presentation)
                    .returning();
                expect(result[0].status).toBe(status);
            }
        });

        it("应该能更新演讲状态", async () => {
            const newPresentation: NewPresentation = {
                title: "状态测试演讲",
                speakerId: 1,
                status: "draft",
            };

            const [created] = await db
                .insert(presentations)
                .values(newPresentation)
                .returning();

            const [updated] = await db
                .update(presentations)
                .set({ status: "active", startedAt: new Date() })
                .where(eq(presentations.id, created.id))
                .returning();

            expect(updated.status).toBe("active");
            expect(updated.startedAt).toBeDefined();
        });
    });

    describe("输入材料类型", () => {
        it("应该支持所有输入材料类型", async () => {
            const inputTypes = ["text", "ppt", "pdf", "audio", "video"] as const;

            for (const inputType of inputTypes) {
                const presentation: NewPresentation = {
                    title: `${inputType} 材料演讲`,
                    speakerId: 1,
                    inputType,
                    inputContent: `${inputType} 内容或文件路径`,
                };

                const result = await db
                    .insert(presentations)
                    .values(presentation)
                    .returning();
                expect(result[0].inputType).toBe(inputType);
            }
        });
    });

    describe("查询操作", () => {
        it("应该能按演讲者查询演讲", async () => {
            const presentations1 = [
                { title: "演讲1", speakerId: 1 },
                { title: "演讲2", speakerId: 1 },
            ];

            const presentations2 = [{ title: "演讲3", speakerId: 2 }];

            await db
                .insert(presentations)
                .values([...presentations1, ...presentations2]);

            const speaker1Presentations = await db
                .select()
                .from(presentations)
                .where(eq(presentations.speakerId, 1));
            const speaker2Presentations = await db
                .select()
                .from(presentations)
                .where(eq(presentations.speakerId, 2));

            expect(speaker1Presentations).toHaveLength(2);
            expect(speaker2Presentations).toHaveLength(1);
        });

        it("应该能按状态查询演讲", async () => {
            const testData = [
                { title: "草稿演讲", speakerId: 1, status: "draft" as const },
                { title: "活跃演讲", speakerId: 1, status: "active" as const },
                { title: "完成演讲", speakerId: 1, status: "completed" as const },
            ];

            await db.insert(presentations).values(testData);

            const activePresentations = await db
                .select()
                .from(presentations)
                .where(eq(presentations.status, "active"));

            expect(activePresentations).toHaveLength(1);
            expect(activePresentations[0].title).toBe("活跃演讲");
        });
    });

    describe("时间管理", () => {
        it("应该能设置演讲时间", async () => {
            const scheduledTime = new Date("2024-01-01T10:00:00Z");

            const newPresentation: NewPresentation = {
                title: "定时演讲",
                speakerId: 1,
                scheduledAt: scheduledTime,
            };

            const result = await db
                .insert(presentations)
                .values(newPresentation)
                .returning();

            expect(result[0].scheduledAt).toEqual(scheduledTime);
        });
    });
});
