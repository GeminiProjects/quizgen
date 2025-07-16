import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import {
  attempts,
  lectures,
  materials,
  type NewAttempt,
  type NewLecture,
  type NewMaterial,
  type NewOrganization,
  type NewQuizItem,
  type NewTranscript,
  type NewUser,
  organizations,
  quizItems,
  transcripts,
  users,
} from '../src/schema/index';
import { db } from './setup';

/**
 * 数据库表功能测试
 * 验证各个数据表的基本 CRUD 操作
 */

describe('数据库表功能测试', () => {
  // 清理函数
  const cleanup = async () => {
    // 按照外键依赖顺序删除数据
    await db.delete(attempts);
    await db.delete(quizItems);
    await db.delete(transcripts);
    await db.delete(materials);
    await db.delete(lectures);
    await db.delete(organizations);
    await db.delete(users);
  };

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('用户表 (users)', () => {
    test('创建用户', async () => {
      // 准备测试数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };

      // 插入用户
      const [insertedUser] = await db
        .insert(users)
        .values(testUser)
        .returning();

      // 验证结果
      expect(insertedUser).toBeDefined();
      expect(insertedUser.id).toBe(testUser.id);
      expect(insertedUser.email).toBe(testUser.email);
      expect(insertedUser.name).toBe(testUser.name ?? null);
    });

    test('查询用户', async () => {
      // 准备测试数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };

      // 插入测试数据
      await db.insert(users).values(testUser);

      // 查询用户
      const [foundUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUser.id));

      // 验证结果
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe(testUser.email);
    });
  });

  describe('组织表 (organizations)', () => {
    test('创建组织', async () => {
      // 先创建用户
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      // 准备组织数据
      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };

      // 插入组织
      const [insertedOrg] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      // 验证结果
      expect(insertedOrg).toBeDefined();
      expect(insertedOrg.name).toBe(testOrganization.name);
      expect(insertedOrg.owner_id).toBe(testUser.id);
    });

    test('查询组织及关联用户', async () => {
      // 插入测试数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      // 查询组织
      const foundOrg = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, org.id));

      // 验证结果
      expect(foundOrg.length).toBe(1);
      expect(foundOrg[0].owner_id).toBe(testUser.id);
    });
  });

  describe('讲座表 (lectures)', () => {
    test('创建讲座', async () => {
      // 准备依赖数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      // 准备讲座数据
      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };

      // 插入讲座
      const [insertedLecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 验证结果
      expect(insertedLecture).toBeDefined();
      expect(insertedLecture.title).toBe(testLecture.title);
      expect(insertedLecture.owner_id).toBe(testUser.id);
    });

    test('更新讲座结束时间', async () => {
      // 准备数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 更新结束时间
      const endsAt = new Date();
      const [updatedLecture] = await db
        .update(lectures)
        .set({ ends_at: endsAt })
        .where(eq(lectures.id, lecture.id))
        .returning();

      // 验证结果
      expect(updatedLecture.ends_at).toEqual(endsAt);
    });
  });

  describe('材料表 (materials)', () => {
    test('创建材料', async () => {
      // 准备依赖数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 准备材料数据
      const testMaterial: NewMaterial = {
        lecture_id: lecture.id,
        file_type: 'pdf',
        file_name: 'test.pdf',
        text_content: '这是测试内容',
      };

      // 插入材料
      const [insertedMaterial] = await db
        .insert(materials)
        .values(testMaterial)
        .returning();

      // 验证结果
      expect(insertedMaterial).toBeDefined();
      expect(insertedMaterial.file_name).toBe(testMaterial.file_name);
      expect(insertedMaterial.lecture_id).toBe(lecture.id);
    });
  });

  describe('转录文本表 (transcripts)', () => {
    test('创建转录文本', async () => {
      // 准备依赖数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 准备转录数据
      const testTranscript: NewTranscript = {
        lecture_id: lecture.id,
        text: '这是一段转录的演讲内容',
        ts: new Date(),
      };

      // 插入转录
      const [insertedTranscript] = await db
        .insert(transcripts)
        .values(testTranscript)
        .returning();

      // 验证结果
      expect(insertedTranscript).toBeDefined();
      expect(insertedTranscript.text).toBe(testTranscript.text);
    });
  });

  describe('测验题目表 (quiz_items)', () => {
    test('创建测验题目', async () => {
      // 准备依赖数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 准备题目数据
      const testQuizItem: NewQuizItem = {
        lecture_id: lecture.id,
        question: '这个讲座的主题是什么？',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer: 0,
      };

      // 插入题目
      const [insertedQuizItem] = await db
        .insert(quizItems)
        .values(testQuizItem)
        .returning();

      // 验证结果
      expect(insertedQuizItem).toBeDefined();
      expect(insertedQuizItem.question).toBe(testQuizItem.question);
      expect(insertedQuizItem.options).toEqual(testQuizItem.options);
      expect(insertedQuizItem.answer).toBe(0);
    });
  });

  describe('答题记录表 (attempts)', () => {
    test('创建答题记录', async () => {
      // 准备依赖数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      const testQuizItem: NewQuizItem = {
        lecture_id: lecture.id,
        question: '这个讲座的主题是什么？',
        options: ['选项A', '选项B', '选项C', '选项D'],
        answer: 0,
      };
      const [quizItem] = await db
        .insert(quizItems)
        .values(testQuizItem)
        .returning();

      // 准备答题数据
      const testAttempt: NewAttempt = {
        user_id: testUser.id,
        quiz_id: quizItem.id,
        selected: 0,
        is_correct: true,
        latency_ms: 1500,
      };

      // 插入答题记录
      const [insertedAttempt] = await db
        .insert(attempts)
        .values(testAttempt)
        .returning();

      // 验证结果
      expect(insertedAttempt).toBeDefined();
      expect(insertedAttempt.user_id).toBe(testUser.id);
      expect(insertedAttempt.is_correct).toBe(true);
    });

    test('查询用户答题统计', async () => {
      // 准备数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 创建多个题目和答题记录
      const quizItemPromises: Promise<(typeof quizItems.$inferSelect)[]>[] = [];
      for (let i = 0; i < 3; i++) {
        const testQuizItem: NewQuizItem = {
          lecture_id: lecture.id,
          question: `问题${i + 1}`,
          options: ['选项A', '选项B', '选项C', '选项D'],
          answer: 0,
        };
        quizItemPromises.push(
          db.insert(quizItems).values(testQuizItem).returning()
        );
      }
      const insertedQuizItems = await Promise.all(quizItemPromises);

      // 创建答题记录
      const attemptPromises = insertedQuizItems.map((quizItemArray, i) => {
        const [quizItem] = quizItemArray;
        return db.insert(attempts).values({
          user_id: testUser.id,
          quiz_id: quizItem.id,
          selected: i,
          is_correct: i < 2, // 前两题正确
          latency_ms: 2000 + i * 500,
        });
      });
      await Promise.all(attemptPromises);

      // 查询用户的答题记录
      const userAttempts = await db
        .select()
        .from(attempts)
        .where(eq(attempts.user_id, testUser.id));

      // 验证结果
      expect(userAttempts.length).toBe(3);
      const correctCount = userAttempts.filter((a) => a.is_correct).length;
      expect(correctCount).toBe(2);
    });
  });

  describe('级联删除测试', () => {
    test('删除组织时级联删除相关数据', async () => {
      // 准备完整的数据链
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testOrganization: NewOrganization = {
        name: '测试组织',
        description: '这是一个测试组织',
        password: 'test123',
        owner_id: testUser.id,
      };
      const [org] = await db
        .insert(organizations)
        .values(testOrganization)
        .returning();

      const testLecture: NewLecture = {
        title: '测试讲座',
        description: '这是一个测试讲座',
        owner_id: testUser.id,
        org_id: org.id,
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      const testMaterial: NewMaterial = {
        lecture_id: lecture.id,
        file_type: 'pdf',
        file_name: 'test.pdf',
        text_content: '这是测试内容',
      };
      const [_material] = await db
        .insert(materials)
        .values(testMaterial)
        .returning();

      // 删除组织
      await db.delete(organizations).where(eq(organizations.id, org.id));

      // 验证级联行为：org_id 应该被设置为 null（而不是删除讲座）
      const [remainingLecture] = await db
        .select()
        .from(lectures)
        .where(eq(lectures.id, lecture.id));
      expect(remainingLecture).toBeDefined();
      expect(remainingLecture.org_id).toBeNull();

      // 讲座还在，所以材料也应该还在
      const remainingMaterials = await db
        .select()
        .from(materials)
        .where(eq(materials.lecture_id, lecture.id));
      expect(remainingMaterials.length).toBe(1);
    });
  });
});
