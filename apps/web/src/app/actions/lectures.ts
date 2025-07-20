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

export async function getLectures(params?: {
  page?: number;
  limit?: number;
  org_id?: string;
  status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
  search?: string;
}) {
  const session = await requireAuth();

  const { page = 1, limit = 50, org_id, status, search } = params || {};

  const conditions = [eq(lectures.owner_id, session.user.id)];

  if (org_id) {
    conditions.push(eq(lectures.org_id, org_id));
  }
  if (status) {
    conditions.push(eq(lectures.status, status));
  }
  if (search) {
    const searchCondition = or(
      ilike(lectures.title, `%${search}%`),
      ilike(lectures.description, `%${search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rawData, total] = await Promise.all([
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
      .offset((page - 1) * limit)
      .orderBy(lectures.starts_at),

    db
      .select({ count: count() })
      .from(lectures)
      .where(whereClause)
      .then((result) => result[0].count),
  ]);

  const data = rawData.map((lecture) => ({
    ...lecture,
    starts_at: lecture.starts_at.toISOString(),
    ends_at: lecture.ends_at?.toISOString() || null,
    created_at: lecture.created_at.toISOString(),
    updated_at: lecture.updated_at.toISOString(),
  }));

  return { data, total };
}

export async function createLecture(input: {
  title: string;
  description?: string | null;
  org_id?: string | null;
  org_password?: string | null;
  starts_at: string;
}) {
  const session = await requireAuth();

  const validated = lectureSchemas.create.parse(input);

  // 验证组织密码
  if (validated.org_id && validated.org_password) {
    const [org] = await db
      .select({ password: organizations.password })
      .from(organizations)
      .where(eq(organizations.id, validated.org_id))
      .limit(1);

    if (!org) {
      throw new Error('组织不存在');
    }
    if (org.password !== validated.org_password) {
      throw new Error('组织密码错误');
    }
  }

  // 生成唯一加入码
  let joinCode = '';
  for (let i = 0; i < 10; i++) {
    joinCode = generateLectureCode();
    const [existing] = await db
      .select({ id: lectures.id })
      .from(lectures)
      .where(eq(lectures.join_code, joinCode))
      .limit(1);

    if (!existing) {
      break;
    }
    if (i === 9) {
      throw new Error('生成演讲码失败，请重试');
    }
  }

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

  revalidatePath('/lectures');
  return lecture;
}

export async function updateLecture(
  id: string,
  input: {
    title?: string;
    description?: string | null;
    status?: 'not_started' | 'in_progress' | 'paused' | 'ended';
    starts_at?: string;
    ends_at?: string;
  }
) {
  const session = await requireAuth();

  const validated = lectureSchemas.update.parse(input);

  const updateData: Record<string, unknown> = { ...validated };
  if (validated.starts_at) {
    updateData.starts_at = new Date(validated.starts_at);
  }
  if (validated.ends_at) {
    updateData.ends_at = new Date(validated.ends_at);
  }

  const [updated] = await db
    .update(lectures)
    .set(updateData)
    .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
    .returning();

  if (!updated) {
    throw new Error('演讲不存在或无权限');
  }

  revalidatePath('/lectures');
  revalidatePath(`/lectures/${id}`);
  return updated;
}

export async function getLecture(id: string) {
  const session = await requireAuth();

  const [lecture] = await db
    .select()
    .from(lectures)
    .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
    .limit(1);

  if (!lecture) {
    return null;
  }

  return {
    ...lecture,
    starts_at: lecture.starts_at.toISOString(),
    ends_at: lecture.ends_at?.toISOString() || null,
    created_at: lecture.created_at.toISOString(),
    updated_at: lecture.updated_at.toISOString(),
  };
}

export async function deleteLecture(id: string) {
  const session = await requireAuth();

  const deleted = await db
    .delete(lectures)
    .where(and(eq(lectures.id, id), eq(lectures.owner_id, session.user.id)))
    .returning();

  if (!deleted.length) {
    throw new Error('演讲不存在或无权限');
  }

  revalidatePath('/lectures');
  return true;
}

export async function startLecture(id: string) {
  return await updateLecture(id, { status: 'in_progress' });
}

export async function pauseLecture(id: string) {
  return await updateLecture(id, { status: 'paused' });
}

export async function endLecture(id: string) {
  return await updateLecture(id, {
    status: 'ended',
    ends_at: new Date().toISOString(),
  });
}
