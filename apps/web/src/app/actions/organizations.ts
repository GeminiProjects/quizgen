'use server';

import { and, count, db, desc, eq, ilike, organizations } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { organizationSchemas } from '@/lib/schemas';
import type { ActionResult, Organization, PaginatedResult } from '@/types';
import {
  buildConditions,
  createErrorResponse,
  createPaginatedResponse,
  createPaginationParams,
  createSuccessResponse,
  handleActionError,
  revalidatePaths,
} from './utils';

/**
 * 获取组织列表（支持分页和搜索）
 *
 * @param params - 查询参数
 * @param params.page - 页码（默认 1）
 * @param params.limit - 每页数量（默认 50）
 * @param params.search - 搜索关键词（可选）
 * @returns 分页的组织列表
 */
export async function getOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ActionResult<PaginatedResult<Organization>>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 处理分页参数
    const { page, limit, offset } = createPaginationParams(params);

    // 构建查询条件
    const baseCondition = eq(organizations.owner_id, session.user.id);
    const additionalConditions = [
      params?.search
        ? ilike(organizations.name, `%${params.search}%`)
        : undefined,
    ];

    const conditions = buildConditions(baseCondition, additionalConditions);
    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // 并行查询数据和总数
    const [data, total] = await Promise.all([
      // 查询组织数据
      db
        .select()
        .from(organizations)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(organizations.created_at),

      // 查询总数
      db
        .select({ count: count() })
        .from(organizations)
        .where(whereClause)
        .then((result) => result[0].count),
    ]);

    // 构建响应（createSuccessResponse 会自动序列化日期）
    return createSuccessResponse(
      createPaginatedResponse(data, total, page, limit)
    );
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 创建新组织
 *
 * @param input - 创建组织的输入数据
 * @param input.name - 组织名称
 * @param input.description - 组织描述（可选）
 * @param input.password - 组织密码（用于其他用户加入时验证）
 * @returns 创建的组织信息
 */
export async function createOrganization(input: {
  name: string;
  description?: string;
  password?: string;
}): Promise<ActionResult<Organization>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = organizationSchemas.create.parse(input);

    // 创建组织
    const [organization] = await db
      .insert(organizations)
      .values({
        ...validated,
        owner_id: session.user.id,
      })
      .returning();

    // 重验证组织列表
    revalidatePath('/organizations');

    return createSuccessResponse(organization);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 更新组织信息
 *
 * @param id - 组织 ID
 * @param input - 更新的数据
 * @param input.name - 组织名称
 * @param input.description - 组织描述
 * @param input.password - 组织密码
 * @returns 更新后的组织信息
 */
export async function updateOrganization(
  id: string,
  input: {
    name?: string;
    description?: string;
    password?: string;
  }
): Promise<ActionResult<Organization>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证输入数据
    const validated = organizationSchemas.update.parse(input);

    // 过滤掉 undefined 值
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(validated)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    // 如果没有要更新的内容
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('没有要更新的内容');
    }

    // 执行更新操作
    const [updated] = await db
      .update(organizations)
      .set(updateData)
      .where(
        and(
          eq(organizations.id, id),
          eq(organizations.owner_id, session.user.id)
        )
      )
      .returning();

    if (!updated) {
      return createErrorResponse('组织不存在或无权限');
    }

    // 重验证相关路径
    revalidatePaths(['/organizations', `/organizations/${id}`]);

    return createSuccessResponse(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取单个组织详情
 *
 * @param id - 组织 ID
 * @returns 组织详情，如果不存在或无权限则返回 null
 */
export async function getOrganization(
  id: string
): Promise<ActionResult<Organization | null>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询组织
    const [organization] = await db
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, id),
          eq(organizations.owner_id, session.user.id)
        )
      )
      .limit(1);

    if (!organization) {
      return createSuccessResponse(null);
    }

    return createSuccessResponse(organization);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 删除组织
 *
 * @param id - 组织 ID
 * @returns 是否删除成功
 */
export async function deleteOrganization(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 执行删除操作
    const deleted = await db
      .delete(organizations)
      .where(
        and(
          eq(organizations.id, id),
          eq(organizations.owner_id, session.user.id)
        )
      )
      .returning();

    if (!deleted.length) {
      return createErrorResponse('组织不存在或无权限');
    }

    // 重验证组织列表
    revalidatePath('/organizations');

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取公开的组织列表（不需要身份验证）
 * 用于用户浏览和加入组织
 *
 * @returns 所有组织的列表（包含密码字段用于前端验证）
 */
export async function getPublicOrganizations(): Promise<
  ActionResult<Organization[]>
> {
  try {
    // 查询所有组织
    const data = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        owner_id: organizations.owner_id,
        password: organizations.password,
        created_at: organizations.created_at,
        updated_at: organizations.updated_at,
      })
      .from(organizations)
      .orderBy(desc(organizations.created_at));

    // 返回数据（createSuccessResponse 会自动序列化日期）
    return createSuccessResponse(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 验证组织密码
 *
 * @param organizationId - 组织 ID
 * @param password - 待验证的密码
 * @returns 密码是否正确
 */
export async function validateOrganizationPassword(
  organizationId: string,
  password: string
): Promise<ActionResult<boolean>> {
  try {
    // 查询组织密码
    const [org] = await db
      .select({ password: organizations.password })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      return createErrorResponse('组织不存在');
    }

    // 验证密码
    const isValid = org.password === password;

    return createSuccessResponse(isValid);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取组织统计信息
 *
 * @param id - 组织 ID
 * @returns 组织的统计信息
 */
export async function getOrganizationStats(id: string): Promise<
  ActionResult<{
    totalLectures: number;
    activeLectures: number;
    totalParticipants: number;
  }>
> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证组织所有权
    const [organization] = await db
      .select({ owner_id: organizations.owner_id })
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!organization) {
      return createErrorResponse('组织不存在');
    }

    if (organization.owner_id !== session.user.id) {
      return createErrorResponse('无权限访问此组织');
    }

    // TODO: 实现统计查询
    // 这里需要联表查询 lectures 和 lecture_participants 表
    // 暂时返回模拟数据

    return createSuccessResponse({
      totalLectures: 0,
      activeLectures: 0,
      totalParticipants: 0,
    });
  } catch (error) {
    return handleActionError(error);
  }
}
