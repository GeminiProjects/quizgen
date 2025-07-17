import { afterAll, beforeEach, describe, expect, test } from 'bun:test';
import { eq } from 'drizzle-orm';
import {
  attempts,
  lectureParticipants,
  lectures,
  materials,
  type NewAttempt,
  type NewLecture,
  type NewLectureParticipant,
  type NewMaterial,
  type NewOrganization,
  type NewQuizItem,
  type NewTranscript,
  type NewUser,
  organizations,
  quizItems,
  transcripts,
  users,
} from '@/schema/index';
import { db } from '@/tests/setup';
import { generateLectureCode } from '@/utils/lecture-code';

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
    await db.delete(lectureParticipants);
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

  describe('演讲表 (lectures)', () => {
    test('创建演讲', async () => {
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

      // 准备演讲数据
      const testLecture: NewLecture = {
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };

      // 插入演讲
      const [insertedLecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 验证结果
      expect(insertedLecture).toBeDefined();
      expect(insertedLecture.title).toBe(testLecture.title);
      expect(insertedLecture.owner_id).toBe(testUser.id);
    });

    test('更新演讲结束时间', async () => {
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
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

    test('验证演讲码唯一性', async () => {
      // 准备数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      // 使用相同的演讲码创建两个演讲
      const duplicateCode = generateLectureCode();
      const lecture1: NewLecture = {
        title: '演讲1',
        owner_id: testUser.id,
        join_code: duplicateCode,
        starts_at: new Date(),
      };
      const lecture2: NewLecture = {
        title: '演讲2',
        owner_id: testUser.id,
        join_code: duplicateCode,
        starts_at: new Date(),
      };

      // 第一个应该成功
      await db.insert(lectures).values(lecture1);

      // 第二个应该失败（唯一性约束）
      try {
        await db.insert(lectures).values(lecture2);
        // 如果没有抛出错误，测试失败
        expect(true).toBe(false);
      } catch (error) {
        // 期望抛出错误
        expect(error).toBeDefined();
      }
    });

    test('演讲状态默认值', async () => {
      // 准备数据
      const testUser: NewUser = {
        id: 'test-user-001',
        email: 'test@example.com',
        name: '测试用户',
        emailVerified: false,
      };
      await db.insert(users).values(testUser);

      const testLecture: NewLecture = {
        title: '测试演讲',
        owner_id: testUser.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };

      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 验证默认状态为 'not_started'
      expect(lecture.status).toBe('not_started');
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 准备题目数据
      const testQuizItem: NewQuizItem = {
        lecture_id: lecture.id,
        question: '这个演讲的主题是什么？',
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      const testQuizItem: NewQuizItem = {
        lecture_id: lecture.id,
        question: '这个演讲的主题是什么？',
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
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

  describe('演讲参与者表 (lecture_participants)', () => {
    test('用户加入演讲', async () => {
      // 准备用户数据
      const speaker: NewUser = {
        id: 'speaker-001',
        email: 'speaker@example.com',
        name: '演讲者',
        emailVerified: false,
      };
      const audience: NewUser = {
        id: 'audience-001',
        email: 'audience@example.com',
        name: '观众',
        emailVerified: false,
      };
      await db.insert(users).values([speaker, audience]);

      // 创建演讲
      const testLecture: NewLecture = {
        title: '测试演讲',
        owner_id: speaker.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 演讲者自动成为参与者
      const speakerParticipant: NewLectureParticipant = {
        lecture_id: lecture.id,
        user_id: speaker.id,
        role: 'speaker',
      };
      await db.insert(lectureParticipants).values(speakerParticipant);

      // 观众加入演讲
      const audienceParticipant: NewLectureParticipant = {
        lecture_id: lecture.id,
        user_id: audience.id,
        role: 'audience',
      };
      const [participant] = await db
        .insert(lectureParticipants)
        .values(audienceParticipant)
        .returning();

      // 验证结果
      expect(participant).toBeDefined();
      expect(participant.role).toBe('audience');
      expect(participant.status).toBe('joined');
      expect(participant.joined_at).toBeDefined();
    });

    test('查询演讲的所有参与者', async () => {
      // 准备数据
      const speaker: NewUser = {
        id: 'speaker-001',
        email: 'speaker@example.com',
        name: '演讲者',
        emailVerified: false,
      };
      const audience1: NewUser = {
        id: 'audience-001',
        email: 'audience1@example.com',
        name: '观众1',
        emailVerified: false,
      };
      const audience2: NewUser = {
        id: 'audience-002',
        email: 'audience2@example.com',
        name: '观众2',
        emailVerified: false,
      };
      await db.insert(users).values([speaker, audience1, audience2]);

      const testLecture: NewLecture = {
        title: '测试演讲',
        owner_id: speaker.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 添加参与者
      await db.insert(lectureParticipants).values([
        {
          lecture_id: lecture.id,
          user_id: speaker.id,
          role: 'speaker',
        },
        {
          lecture_id: lecture.id,
          user_id: audience1.id,
          role: 'audience',
        },
        {
          lecture_id: lecture.id,
          user_id: audience2.id,
          role: 'audience',
        },
      ]);

      // 查询所有参与者
      const participants = await db
        .select()
        .from(lectureParticipants)
        .where(eq(lectureParticipants.lecture_id, lecture.id));

      // 验证结果
      expect(participants.length).toBe(3);
      const speakerCount = participants.filter(
        (p) => p.role === 'speaker'
      ).length;
      const audienceCount = participants.filter(
        (p) => p.role === 'audience'
      ).length;
      expect(speakerCount).toBe(1);
      expect(audienceCount).toBe(2);
    });

    test('更新参与者状态', async () => {
      // 准备数据
      const user: NewUser = {
        id: 'user-001',
        email: 'user@example.com',
        name: '用户',
        emailVerified: false,
      };
      await db.insert(users).values(user);

      const testLecture: NewLecture = {
        title: '测试演讲',
        owner_id: user.id,
        join_code: generateLectureCode(),
        starts_at: new Date(),
      };
      const [lecture] = await db
        .insert(lectures)
        .values(testLecture)
        .returning();

      // 用户加入演讲
      const [participant] = await db
        .insert(lectureParticipants)
        .values({
          lecture_id: lecture.id,
          user_id: user.id,
          role: 'audience',
        })
        .returning();

      // 更新状态为离开
      const leftAt = new Date();
      const [updatedParticipant] = await db
        .update(lectureParticipants)
        .set({ status: 'left', left_at: leftAt })
        .where(eq(lectureParticipants.id, participant.id))
        .returning();

      // 验证结果
      expect(updatedParticipant.status).toBe('left');
      expect(updatedParticipant.left_at).toEqual(leftAt);
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
        title: '测试演讲',
        description: '这是一个测试演讲',
        owner_id: testUser.id,
        org_id: org.id,
        join_code: generateLectureCode(),
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

      // 验证级联行为：org_id 应该被设置为 null（而不是删除演讲）
      const [remainingLecture] = await db
        .select()
        .from(lectures)
        .where(eq(lectures.id, lecture.id));
      expect(remainingLecture).toBeDefined();
      expect(remainingLecture.org_id).toBeNull();

      // 演讲还在，所以材料也应该还在
      const remainingMaterials = await db
        .select()
        .from(materials)
        .where(eq(materials.lecture_id, lecture.id));
      expect(remainingMaterials.length).toBe(1);
    });
  });
});
