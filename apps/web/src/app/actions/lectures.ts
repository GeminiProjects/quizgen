'use server';

import {
  and,
  count,
  db,
  eq,
  generateLectureCode,
  ilike,
  lectureParticipants,
  lectures,
  materials,
  or,
  organizations,
  quizItems,
  sql,
  transcripts,
} from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { lectureSchemas } from '@/lib/schemas';
import type { ActionResult, Lecture, PaginatedResult } from '@/types';
import {
  buildConditions,
  createErrorResponse,
  createPaginatedResponse,
  createPaginationParams,
  createSuccessResponse,
  generateUniqueId,
  handleActionError,
  parseOptionalDate,
  revalidatePaths,
} from './utils';

/**
 * 获取演讲列表（支持分页、筛选、搜索）
 *
 * @param params - 查询参数
 * @param params.page - 页码（默认 1）
 * @param params.limit - 每页数量（默认 50）
 * @param params.org_id - 组织 ID（可选）
 * @param params.status - 演讲状态（可选）
 * @param params.search - 搜索关键词（可选）
 * @returns 分页的演讲列表
 */
export async function getLectures(params?: {
  page?: number;
  limit?: number;
  org_id?: string;
  status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
  search?: string;
}): Promise<ActionResult<PaginatedResult<Lecture>>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 处理分页参数
    const { page, limit, offset } = createPaginationParams(params);

    // 构建查询条件
    const baseCondition = eq(lectures.owner_id, session.user.id);
    const additionalConditions = [
      params?.org_id ? eq(lectures.org_id, params.org_id) : undefined,
      params?.status ? eq(lectures.status, params.status) : undefined,
      params?.search
        ? or(
            ilike(lectures.title, `%${params.search}%`),
            ilike(lectures.description, `%${params.search}%`)
          )
        : undefined,
    ];

    const conditions = buildConditions(baseCondition, additionalConditions);
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // 并行查询数据和总数
    const [rawData, total] = await Promise.all([
      // 查询演讲数据及相关统计
      db
        .select({
          id: lectures.id,
          title: lectures.title,
          description: lectures.description,
          owner_id: lectures.owner_id,
          org_id: lectures.org_id,
          join_code: lectures.join_code,
          status: lectures.status,
          starts_at: lectures.starts_at,
          ends_at: lectures.ends_at,
          created_at: lectures.created_at,
          updated_at: lectures.updated_at,
          _count: {
            quiz_items: sql<number>`(select count(*) from ${quizItems} where ${quizItems.lecture_id} = ${lectures.id})`,
            participants: sql<number>`(select count(distinct user_id) from ${lectureParticipants} where ${lectureParticipants.lecture_id} = ${lectures.id})`,
            materials: sql<number>`(select count(*) from ${materials} where ${materials.lecture_id} = ${lectures.id})`,
            transcripts: sql<number>`(select count(*) from ${transcripts} where ${transcripts.lecture_id} = ${lectures.id})`,
          },
        })
        .from(lectures)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(lectures.starts_at),

      // 查询总数
      db
        .select({ count: count() })
        .from(lectures)
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    return createSuccessResponse(
      createPaginatedResponse(rawData, total, page, limit)
    );
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 创建新演讲
 *
 * @param input - 创建演讲的输入数据
 * @param input.title - 演讲标题
 * @param input.description - 演讲描述（可选）
 * @param input.org_id - 组织 ID（可选）
 * @param input.org_password - 组织密码（加入组织时需要）
 * @param input.starts_at - 开始时间
 * @returns 创建的演讲信息
 */
export async function createLecture(input: {
  title: string;
  description?: string | null;
  org_id?: string | null;
  org_password?: string | null;
  starts_at: string;
}): Promise<ActionResult<Lecture>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = lectureSchemas.create.parse(input);

    // 如果指定了组织，验证组织密码
    if (validated.org_id && validated.org_password) {
      const [org] = await db
        .select({ password: organizations.password })
        .from(organizations)
        .where(eq(organizations.id, validated.org_id))
        .limit(1);

      if (!org) {
        return createErrorResponse('组织不存在');
      }

      if (org.password !== validated.org_password) {
        return createErrorResponse('组织密码错误');
      }
    }

    // 生成唯一的演讲加入码
    const joinCode = await generateUniqueId(
      '演讲码',
      generateLectureCode,
      async (code) => {
        const [existing] = await db
          .select({ id: lectures.id })
          .from(lectures)
          .where(eq(lectures.join_code, code))
          .limit(1);
        return !existing;
      }
    );

    // 创建演讲
    const [lecture] = await db
      .insert(lectures)
      .values({
        title: validated.title,
        description: validated.description,
        owner_id: session.user.id,
        org_id: validated.org_id || null,
        join_code: joinCode,
        starts_at: new Date(validated.starts_at),
        status: 'not_started',
      })
      .returning();

    // 重验证相关路径
    revalidatePath('/lectures');

    return createSuccessResponse(lecture);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 更新演讲信息
 *
 * @param id - 演讲 ID
 * @param input - 更新的数据
 * @param input.title - 演讲标题
 * @param input.description - 演讲描述
 * @param input.status - 演讲状态
 * @param input.starts_at - 开始时间
 * @param input.ends_at - 结束时间
 * @returns 更新后的演讲信息
 */
export async function updateLecture(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
    starts_at?: string;
    ends_at?: string;
  }
): Promise<ActionResult<Lecture>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = lectureSchemas.update.parse(input);

    // 构建更新数据，处理日期字段
    const updateData: Record<string, unknown> = {
      ...validated,
      starts_at: parseOptionalDate(validated.starts_at),
      ends_at: parseOptionalDate(validated.ends_at),
    };

    // 过滤掉 undefined 值
    for (const key of Object.keys(updateData)) {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    }

    // 执行更新操作
    const [updated] = await db
      .update(lectures)
      .set(updateData)
      .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
      .returning();

    if (!updated) {
      return createErrorResponse('演讲不存在或无权限');
    }

    // 重验证相关路径
    revalidatePaths(['/lectures', `/lectures/${id}`]);

    return createSuccessResponse(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取单个演讲详情
 *
 * @param id - 演讲 ID
 * @returns 演讲详情，如果不存在或无权限则返回 null
 */
export async function getLecture(
  id: string
): Promise<ActionResult<Lecture | null>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询演讲
    const [lecture] = await db
      .select()
      .from(lectures)
      .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
      .limit(1);

    if (!lecture) {
      return createSuccessResponse(null);
    }

    return createSuccessResponse(lecture);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 删除演讲
 *
 * @param id - 演讲 ID
 * @returns 是否删除成功
 */
export async function deleteLecture(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 执行删除操作
    const deleted = await db
      .delete(lectures)
      .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
      .returning();

    if (!deleted.length) {
      return createErrorResponse('演讲不存在或无权限');
    }

    // 重验证演讲列表
    revalidatePath('/lectures');

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 开始演讲
 *
 * @param id - 演讲 ID
 * @returns 更新后的演讲信息
 */
export async function startLecture(id: string): Promise<ActionResult<Lecture>> {
  return await updateLecture(id, { status: 'in_progress' });
}

/**
 * 暂停演讲
 *
 * @param id - 演讲 ID
 * @returns 更新后的演讲信息
 */
export async function pauseLecture(id: string): Promise<ActionResult<Lecture>> {
  return await updateLecture(id, { status: 'paused' });
}

/**
 * 结束演讲
 *
 * @param id - 演讲 ID
 * @returns 更新后的演讲信息
 */
export async function endLecture(id: string): Promise<ActionResult<Lecture>> {
  return await updateLecture(id, {
    status: 'ended',
    ends_at: new Date().toISOString(),
  });
}

/**
 * 获取演讲详情及测验题目（供参与者使用）
 *
 * @param id - 演讲 ID
 * @returns 演讲详情和测验题目列表
 */
export async function getLectureWithQuizzes(id: string): Promise<
  ActionResult<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    starts_at: string;
    ends_at: string | null;
    owner_name: string;
    quizzes: Array<{
      id: string;
      lecture_id: string;
      ts: string;
      question: string;
      options: string[];
      answer: number;
      created_at: string;
    }>;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证用户是否参与了该演讲
    const [participant] = await db
      .select()
      .from(lectureParticipants)
      .where(
        and(
          eq(lectureParticipants.lecture_id, id),
          eq(lectureParticipants.user_id, session.user.id)
        )
      )
      .limit(1);

    if (!participant) {
      return createErrorResponse('您未参与此演讲');
    }

    // 获取演讲详情
    const [lecture] = await db
      .select({
        id: lectures.id,
        title: lectures.title,
        description: lectures.description,
        status: lectures.status,
        starts_at: lectures.starts_at,
        ends_at: lectures.ends_at,
        owner_name: sql<string>`(select name from auth_user where id = ${lectures.owner_id})`,
      })
      .from(lectures)
      .where(eq(lectures.id, id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    // 获取测验题目
    const quizzes = await db
      .select()
      .from(quizItems)
      .where(eq(quizItems.lecture_id, id))
      .orderBy(quizItems.created_at);

    // 序列化数据并返回
    return createSuccessResponse({
      ...lecture,
      quizzes,
    });
  } catch (error) {
    return handleActionError(error);
  }
}
