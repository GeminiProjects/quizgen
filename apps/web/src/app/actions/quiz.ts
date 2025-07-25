'use server';

import { generateQuestions } from '@repo/ai';
import {
  and,
  attempts,
  db,
  desc,
  eq,
  lectures,
  materials,
  quizItems,
  sql,
  transcripts,
} from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { quizItemSchemas } from '@/lib/schemas';
import { defaultQuizModel } from '@/models';
import type { ActionResult, QuizItem } from '@/types';
import {
  assertOwnership,
  createErrorResponse,
  createSuccessResponse,
  handleActionError,
  revalidatePaths,
} from './utils';

/**
 * 获取演讲的所有测验题目
 *
 * @param lectureId - 演讲 ID
 * @returns 测验题目列表（包含答题统计）
 */
export async function getQuizItems(lectureId: string): Promise<
  ActionResult<
    Array<
      QuizItem & {
        _count: {
          attempts: number;
          correctAttempts: number;
        };
      }
    >
  >
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 查询测验题目及统计信息
    const data = await db
      .select({
        id: quizItems.id,
        lecture_id: quizItems.lecture_id,
        ts: quizItems.ts,
        question: quizItems.question,
        options: quizItems.options,
        answer: quizItems.answer,
        explanation: quizItems.explanation,
        created_at: quizItems.created_at,
        pushed_at: quizItems.pushed_at,
        _count: {
          attempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id})`,
          correctAttempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id} and ${attempts.selected} = ${quizItems.answer})`,
        },
      })
      .from(quizItems)
      .where(eq(quizItems.lecture_id, lectureId))
      .orderBy(desc(quizItems.created_at));

    return createSuccessResponse(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取单个测验题目详情
 *
 * @param id - 测验题目 ID
 * @returns 测验题目详情
 */
export async function getQuizItem(
  id: string
): Promise<ActionResult<QuizItem | null>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询测验题目及其所属演讲
    const [quizWithLecture] = await db
      .select({
        quiz: quizItems,
        lecture_owner_id: lectures.owner_id,
      })
      .from(quizItems)
      .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
      .where(eq(quizItems.id, id))
      .limit(1);

    if (!quizWithLecture) {
      return createSuccessResponse(null);
    }

    // 验证权限
    assertOwnership(
      quizWithLecture.lecture_owner_id,
      session.user.id,
      '测验题目'
    );

    return createSuccessResponse(quizWithLecture.quiz);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 创建测验题目
 *
 * @param input - 创建测验题目的输入数据
 * @param input.lecture_id - 演讲 ID
 * @param input.question - 问题
 * @param input.options - 选项列表（4个选项）
 * @param input.answer - 正确答案索引（0-3）
 * @param input.ts - 时间戳（可选）
 * @returns 创建的测验题目信息
 */
export async function createQuizItem(input: {
  lecture_id: string;
  question: string;
  options: string[];
  answer: number;
  ts?: string;
}): Promise<ActionResult<QuizItem>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据（保存 ts 字段）
    const { ts, ...restInput } = input;
    const validated = quizItemSchemas.create.parse(restInput);

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, validated.lecture_id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 创建测验题目
    const [quizItem] = await db
      .insert(quizItems)
      .values({
        lecture_id: validated.lecture_id,
        question: validated.question,
        options: validated.options,
        answer: validated.answer,
        ts: ts ? new Date(ts) : new Date(),
      })
      .returning();

    // 重验证演讲详情页
    revalidatePath(`/lectures/${validated.lecture_id}`);

    return createSuccessResponse(quizItem);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 批量创建测验题目
 *
 * @param lectureId - 演讲 ID
 * @param items - 测验题目列表
 * @returns 创建的测验题目列表
 */
export async function createQuizItems(
  lectureId: string,
  items: Array<{
    question: string;
    options: string[];
    answer: number;
    ts?: string;
  }>
): Promise<ActionResult<QuizItem[]>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 验证并准备数据
    const validatedItems = items.map((item) => {
      const { ts, ...restItem } = item;
      const validated = quizItemSchemas.create.parse({
        ...restItem,
        lecture_id: lectureId,
      });
      return {
        lecture_id: lectureId,
        question: validated.question,
        options: validated.options,
        answer: validated.answer,
        ts: ts ? new Date(ts) : new Date(),
      };
    });

    // 批量创建测验题目
    const createdItems = await db
      .insert(quizItems)
      .values(validatedItems)
      .returning();

    // 重验证演讲详情页
    revalidatePath(`/lectures/${lectureId}`);

    return createSuccessResponse(createdItems);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 更新测验题目
 *
 * @param id - 测验题目 ID
 * @param input - 更新的数据
 * @returns 更新后的测验题目信息
 */
export async function updateQuizItem(
  id: string,
  input: {
    question?: string;
    options?: string[];
    answer?: number;
  }
): Promise<ActionResult<QuizItem>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = quizItemSchemas.update.parse(input);

    // 查询测验题目及验证权限
    const [quizWithLecture] = await db
      .select({
        quiz: quizItems,
        lecture_owner_id: lectures.owner_id,
        lecture_id: quizItems.lecture_id,
      })
      .from(quizItems)
      .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
      .where(eq(quizItems.id, id))
      .limit(1);

    if (!quizWithLecture) {
      return createErrorResponse('测验题目不存在');
    }

    // 验证演讲所有权
    assertOwnership(
      quizWithLecture.lecture_owner_id,
      session.user.id,
      '测验题目'
    );

    // 更新测验题目
    const [updated] = await db
      .update(quizItems)
      .set(validated)
      .where(eq(quizItems.id, id))
      .returning();

    // 重验证演讲详情页
    revalidatePath(`/lectures/${quizWithLecture.lecture_id}`);

    return createSuccessResponse(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 删除测验题目
 *
 * @param id - 测验题目 ID
 * @returns 是否删除成功
 */
export async function deleteQuizItem(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询测验题目及其所属演讲，验证权限
    const [quizWithLecture] = await db
      .select({
        lecture_id: quizItems.lecture_id,
        lecture_owner_id: lectures.owner_id,
      })
      .from(quizItems)
      .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
      .where(eq(quizItems.id, id))
      .limit(1);

    if (!quizWithLecture) {
      return createErrorResponse('测验题目不存在');
    }

    // 验证演讲所有权
    assertOwnership(
      quizWithLecture.lecture_owner_id,
      session.user.id,
      '测验题目'
    );

    // 执行删除
    await db.delete(quizItems).where(eq(quizItems.id, id));

    // 重验证演讲详情页
    revalidatePath(`/lectures/${quizWithLecture.lecture_id}`);

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 清空测验题目
 *
 * @param lectureId - 演讲 ID
 * @returns 是否清空成功
 */

export async function clearQuizItems(
  lectureId: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 清空测验题目
    await db.delete(quizItems).where(eq(quizItems.lecture_id, lectureId));

    // 重验证演讲详情页
    revalidatePath(`/lectures/${lectureId}`);

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 推送测验题目给参与者
 *
 * @param lectureId - 演讲 ID
 * @param quizId - 测验题目 ID（可选，不传则随机选择未推送的题目）
 * @returns 推送结果
 */
export async function pushQuizItem(
  lectureId: string,
  quizId?: string
): Promise<
  ActionResult<{
    success: boolean;
    pushedCount: number;
    quiz: QuizItem;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({
        owner_id: lectures.owner_id,
        status: lectures.status,
      })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 验证演讲状态
    if (lecture.status !== 'in_progress') {
      return createErrorResponse('只能在进行中的演讲推送题目');
    }

    let quizToPush: QuizItem | null = null;

    if (quizId) {
      // 如果指定了题目ID，验证题目存在且属于该演讲
      const [quiz] = await db
        .select()
        .from(quizItems)
        .where(
          and(eq(quizItems.id, quizId), eq(quizItems.lecture_id, lectureId))
        )
        .limit(1);

      if (!quiz) {
        return createErrorResponse('测验题目不存在或不属于该演讲');
      }
      quizToPush = {
        ...quiz,
        ts: quiz.ts.toISOString(),
        created_at: quiz.created_at.toISOString(),
        pushed_at: quiz.pushed_at?.toISOString() || null,
      };
    } else {
      // 随机选择一个未推送的题目
      const [quiz] = await db
        .select()
        .from(quizItems)
        .where(
          and(
            eq(quizItems.lecture_id, lectureId),
            sql`${quizItems.pushed_at} is null`
          )
        )
        .orderBy(sql`RANDOM()`)
        .limit(1);

      if (!quiz) {
        return createErrorResponse('没有可推送的题目');
      }
      quizToPush = {
        ...quiz,
        ts: quiz.ts.toISOString(),
        created_at: quiz.created_at.toISOString(),
        pushed_at: quiz.pushed_at?.toISOString() || null,
      };
    }

    if (!quizToPush) {
      return createErrorResponse('无法获取题目信息');
    }

    // 更新题目的推送时间
    await db
      .update(quizItems)
      .set({ pushed_at: new Date() })
      .where(eq(quizItems.id, quizToPush.id));

    // 获取当前在线参与者数量
    const { getActiveParticipantCount } = await import(
      '@/app/api/sse/[lectureId]/route'
    );
    const pushedCount = await getActiveParticipantCount(lectureId);

    // 重验证相关页面
    revalidatePaths([`/lectures/${lectureId}`, `/participation/${lectureId}`]);

    // 触发SSE更新（通过重验证路径，让参与者的轮询获取新题目）

    return createSuccessResponse({
      success: true,
      pushedCount,
      quiz: quizToPush,
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取演讲已推送的题目列表
 *
 * @param lectureId - 演讲 ID
 * @returns 已推送的题目列表
 */
export async function getPushedQuizItems(
  lectureId: string
): Promise<
  ActionResult<
    Array<QuizItem & { _count: { attempts: number; correctAttempts: number } }>
  >
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 查询已推送的题目
    const data = await db
      .select({
        id: quizItems.id,
        lecture_id: quizItems.lecture_id,
        ts: quizItems.ts,
        question: quizItems.question,
        options: quizItems.options,
        answer: quizItems.answer,
        explanation: quizItems.explanation,
        created_at: quizItems.created_at,
        pushed_at: quizItems.pushed_at,
        _count: {
          attempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id})`,
          correctAttempts: sql<number>`(select count(*) from ${attempts} where ${attempts.quiz_id} = ${quizItems.id} and ${attempts.selected} = ${quizItems.answer})`,
        },
      })
      .from(quizItems)
      .where(
        and(
          eq(quizItems.lecture_id, lectureId),
          sql`${quizItems.pushed_at} is not null`
        )
      )
      .orderBy(desc(quizItems.pushed_at));

    return createSuccessResponse(
      data.map((item) => ({
        ...item,
        ts: item.ts.toISOString(),
        created_at: item.created_at.toISOString(),
        pushed_at: item.pushed_at?.toISOString() || null,
      }))
    );
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 基于演讲内容生成测验题目
 *
 * @param input - 生成参数
 * @param input.lectureId - 演讲 ID
 * @param input.count - 要生成的题目数量（默认 10，最多 10）
 * @returns 生成的题目列表
 */
export async function generateQuizItems(input: {
  lectureId: string;
  count?: number;
}): Promise<ActionResult<QuizItem[]>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, input.lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 获取演讲的材料和转录
    const [materialsData, transcriptsData] = await Promise.all([
      db
        .select()
        .from(materials)
        .where(eq(materials.lecture_id, input.lectureId)),
      db
        .select()
        .from(transcripts)
        .where(eq(transcripts.lecture_id, input.lectureId)),
    ]);

    // 构建上下文内容
    let context = '';

    // 添加材料内容
    if (materialsData.length > 0) {
      context += '【演讲材料内容】\n';
      for (const material of materialsData) {
        if (material.text_content && material.status === 'completed') {
          context += `\n--- ${material.file_name} ---\n`;
          context += material.text_content;
          context += '\n';
        }
      }
    }

    // 添加转录内容
    if (transcriptsData.length > 0) {
      context += '\n【演讲转录内容】\n';
      for (const transcript of transcriptsData) {
        if (transcript.text) {
          context += `\n${transcript.text}\n`;
        }
      }
    }

    if (!context.trim()) {
      return createErrorResponse(
        '没有足够的内容生成题目，请先上传材料或开始转录'
      );
    }

    // 生成题目
    const count = Math.min(input.count || 10, 50); // 最多生成 50 道题
    const result = await generateQuestions({
      model: defaultQuizModel,
      context,
      count,
      timeoutOptions: {
        timeout: 60_000, // 60 秒超时
        timeoutMessage: '生成题目超时，请重试',
      },
    });

    if (!result.success || result.quizzes.length === 0) {
      return createErrorResponse(result.error || '生成题目失败');
    }

    // 将生成的题目保存到数据库
    const createdQuizItems: QuizItem[] = [];

    for (const quiz of result.quizzes) {
      const [created] = await db
        .insert(quizItems)
        .values({
          lecture_id: input.lectureId,
          question: quiz.question,
          options: quiz.options,
          answer: quiz.answer,
          explanation: quiz.explanation,
          ts: new Date(),
        })
        .returning();

      createdQuizItems.push({
        ...created,
        ts: created.ts.toISOString(),
        created_at: created.created_at.toISOString(),
        pushed_at: created.pushed_at?.toISOString() || null,
        _count: {
          attempts: 0,
        },
      });
    }

    // 重验证演讲详情页
    revalidatePath(`/lectures/${input.lectureId}`);

    return createSuccessResponse(createdQuizItems);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取测验题目的答题统计
 *
 * @param quizId - 测验题目 ID
 * @returns 答题统计信息
 */
export async function getQuizStats(quizId: string): Promise<
  ActionResult<{
    totalAttempts: number;
    correctAttempts: number;
    correctRate: number;
    optionDistribution: Record<number, number>;
    avgResponseTime: number;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证测验题目所有权
    const [quizWithLecture] = await db
      .select({
        lecture_owner_id: lectures.owner_id,
        answer: quizItems.answer,
      })
      .from(quizItems)
      .innerJoin(lectures, eq(quizItems.lecture_id, lectures.id))
      .where(eq(quizItems.id, quizId))
      .limit(1);

    if (!quizWithLecture) {
      return createErrorResponse('测验题目不存在');
    }

    assertOwnership(
      quizWithLecture.lecture_owner_id,
      session.user.id,
      '测验题目'
    );

    // 查询答题记录
    const attemptData = await db
      .select({
        selected: attempts.selected,
        is_correct: attempts.is_correct,
        latency_ms: attempts.latency_ms,
      })
      .from(attempts)
      .where(eq(attempts.quiz_id, quizId));

    // 计算统计信息
    const stats = {
      totalAttempts: attemptData.length,
      correctAttempts: attemptData.filter((a) => a.is_correct).length,
      correctRate: 0,
      optionDistribution: {} as Record<number, number>,
      avgResponseTime: 0,
    };

    if (stats.totalAttempts > 0) {
      // 计算正确率
      stats.correctRate = Math.round(
        (stats.correctAttempts / stats.totalAttempts) * 100
      );

      // 计算选项分布
      for (const attempt of attemptData) {
        stats.optionDistribution[attempt.selected] =
          (stats.optionDistribution[attempt.selected] || 0) + 1;
      }

      // 计算平均响应时间
      const totalTime = attemptData.reduce(
        (sum, a) => sum + (a.latency_ms || 0),
        0
      );
      stats.avgResponseTime = Math.round(totalTime / stats.totalAttempts);
    }

    return createSuccessResponse(stats);
  } catch (error) {
    return handleActionError(error);
  }
}
