'use server';

import { db, desc, eq, materials } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';

export async function getMaterials(lectureId: string) {
  await requireAuth();

  const data = await db
    .select()
    .from(materials)
    .where(eq(materials.lecture_id, lectureId))
    .orderBy(desc(materials.created_at));

  return data.map((material) => ({
    ...material,
    created_at: material.created_at.toISOString(),
    updated_at: material.updated_at.toISOString(),
  }));
}

export async function deleteMaterial(id: string) {
  try {
    await requireAuth();

    // 验证材料所有权
    const [material] = await db
      .select({ lecture_id: materials.lecture_id })
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);

    if (!material) {
      return { success: false, error: '材料不存在' };
    }

    // TODO: 验证用户是否是演讲的所有者

    await db.delete(materials).where(eq(materials.id, id));

    revalidatePath(`/lectures/${material.lecture_id}`);
    return { success: true };
  } catch (error) {
    console.error('删除材料失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败',
    };
  }
}
