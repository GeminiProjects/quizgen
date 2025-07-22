'use server';

import { and, db, desc, eq, lectures, materials } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import type { ActionResult, Material } from '@/types';
import {
  assertOwnership,
  createErrorResponse,
  createSuccessResponse,
  handleActionError,
} from './utils';

/**
 * 获取演讲的所有材料
 *
 * @param lectureId - 演讲 ID
 * @returns 材料列表
 */
export async function getMaterials(
  lectureId: string
): Promise<ActionResult<Material[]>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证用户是否有权限访问该演讲的材料
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    // 验证所有权
    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 查询材料列表
    const data = await db
      .select()
      .from(materials)
      .where(eq(materials.lecture_id, lectureId))
      .orderBy(desc(materials.created_at));

    // 序列化日期并返回
    return createSuccessResponse(data);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取单个材料详情
 *
 * @param id - 材料 ID
 * @returns 材料详情
 */
export async function getMaterial(
  id: string
): Promise<ActionResult<Material | null>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询材料及其所属演讲
    const [material] = await db
      .select({
        material: materials,
        lecture_owner_id: lectures.owner_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(eq(materials.id, id))
      .limit(1);

    if (!material) {
      return createSuccessResponse(null);
    }

    // 验证权限
    assertOwnership(material.lecture_owner_id, session.user.id, '演讲材料');

    return createSuccessResponse(material.material);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 创建材料
 *
 * @param input - 创建材料的输入数据
 * @param input.lecture_id - 演讲 ID
 * @param input.name - 材料名称
 * @param input.type - 材料类型
 * @param input.url - 材料 URL
 * @param input.size - 材料大小（字节）
 * @returns 创建的材料信息
 */
export async function createMaterial(input: {
  lecture_id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
}): Promise<ActionResult<Material>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 验证演讲所有权
    const [lecture] = await db
      .select({ owner_id: lectures.owner_id })
      .from(lectures)
      .where(eq(lectures.id, input.lecture_id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在');
    }

    assertOwnership(lecture.owner_id, session.user.id, '演讲');

    // 创建材料
    const [material] = await db
      .insert(materials)
      .values({
        lecture_id: input.lecture_id,
        file_name: input.name,
        file_type: input.type,
        text_content: input.url,
        created_by: session.user.id,
      })
      .returning();

    // 重验证演讲详情页
    revalidatePath(`/lectures/${input.lecture_id}`);

    return createSuccessResponse(material);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 更新材料信息
 *
 * @param id - 材料 ID
 * @param input - 更新的数据
 * @param input.name - 材料名称
 * @returns 更新后的材料信息
 */
export async function updateMaterial(
  id: string,
  input: {
    name?: string;
  }
): Promise<ActionResult<Material>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询材料及验证权限
    const [materialWithLecture] = await db
      .select({
        material: materials,
        lecture_owner_id: lectures.owner_id,
        lecture_id: materials.lecture_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(eq(materials.id, id))
      .limit(1);

    if (!materialWithLecture) {
      return createErrorResponse('材料不存在');
    }

    // 验证演讲所有权
    assertOwnership(
      materialWithLecture.lecture_owner_id,
      session.user.id,
      '演讲材料'
    );

    // 更新材料
    const [updated] = await db
      .update(materials)
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where(eq(materials.id, id))
      .returning();

    // 重验证演讲详情页
    revalidatePath(`/lectures/${materialWithLecture.lecture_id}`);

    return createSuccessResponse(updated);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 删除材料
 *
 * @param id - 材料 ID
 * @returns 是否删除成功
 */
export async function deleteMaterial(
  id: string
): Promise<ActionResult<boolean>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    // 查询材料及其所属演讲，验证权限
    const [materialWithLecture] = await db
      .select({
        lecture_id: materials.lecture_id,
        lecture_owner_id: lectures.owner_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(eq(materials.id, id))
      .limit(1);

    if (!materialWithLecture) {
      return createErrorResponse('材料不存在');
    }

    // 验证演讲所有权
    assertOwnership(
      materialWithLecture.lecture_owner_id,
      session.user.id,
      '演讲材料'
    );

    // 执行删除
    await db.delete(materials).where(eq(materials.id, id));

    // 重验证演讲详情页
    revalidatePath(`/lectures/${materialWithLecture.lecture_id}`);

    return createSuccessResponse(true);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 批量删除材料
 *
 * @param ids - 材料 ID 列表
 * @returns 删除的数量
 */
export async function deleteMaterials(
  ids: string[]
): Promise<ActionResult<number>> {
  try {
    // 验证用户身份
    const session = await requireAuth();

    if (ids.length === 0) {
      return createSuccessResponse(0);
    }

    // 查询所有材料及其演讲信息
    const materialsWithLectures = await db
      .select({
        material_id: materials.id,
        lecture_id: materials.lecture_id,
        lecture_owner_id: lectures.owner_id,
      })
      .from(materials)
      .innerJoin(lectures, eq(materials.lecture_id, lectures.id))
      .where(
        and(
          eq(materials.id, ids[0]) // Drizzle ORM 的 in 操作需要特殊处理
          // TODO: 使用 inArray 函数处理多个 ID
        )
      );

    // 验证所有材料的权限
    const lectureIds = new Set<string>();
    for (const item of materialsWithLectures) {
      assertOwnership(item.lecture_owner_id, session.user.id, '演讲材料');
      lectureIds.add(item.lecture_id);
    }

    // 执行批量删除
    // TODO: 实现批量删除逻辑
    const deletedCount = 0;

    // 重验证相关演讲页面
    for (const lectureId of lectureIds) {
      revalidatePath(`/lectures/${lectureId}`);
    }

    return createSuccessResponse(deletedCount);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 获取材料统计信息
 *
 * @param lectureId - 演讲 ID
 * @returns 材料统计信息
 */
export async function getMaterialStats(lectureId: string): Promise<
  ActionResult<{
    totalCount: number;
    totalSize: number;
    typeDistribution: Record<string, number>;
  }>
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

    // 查询材料统计
    const materialsData = await db
      .select({
        type: materials.file_type,
      })
      .from(materials)
      .where(eq(materials.lecture_id, lectureId));

    // 计算统计信息
    const stats = {
      totalCount: materialsData.length,
      totalSize: 0, // 现在不再存储文件大小
      typeDistribution: {} as Record<string, number>,
    };

    // 统计类型分布
    for (const material of materialsData) {
      stats.typeDistribution[material.type] =
        (stats.typeDistribution[material.type] || 0) + 1;
    }

    return createSuccessResponse(stats);
  } catch (error) {
    return handleActionError(error);
  }
}
