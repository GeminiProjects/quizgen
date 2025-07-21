'use server';

import { and, count, db, desc, eq, ilike, organizations } from '@repo/db';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { organizationSchemas } from '@/lib/schemas';
import type { Organization } from '@/types';

export async function getOrganizations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const session = await requireAuth();

  const { page = 1, limit = 50, search } = params || {};

  const conditions = [eq(organizations.owner_id, session.user.id)];
  if (search) {
    conditions.push(ilike(organizations.name, `%${search}%`));
  }

  const whereClause =
    conditions.length > 1 ? and(...conditions) : conditions[0];

  const [data, total] = await Promise.all([
    db
      .select()
      .from(organizations)
      .where(whereClause)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(organizations.created_at),

    db
      .select({ count: count() })
      .from(organizations)
      .where(whereClause)
      .then((result) => result[0].count),
  ]);

  return {
    data: data.map((org) => ({
      ...org,
      created_at: org.created_at.toISOString(),
      updated_at: org.updated_at.toISOString(),
    })),
    total,
  };
}

export async function createOrganization(input: {
  name: string;
  description?: string;
  password?: string;
}) {
  const session = await requireAuth();

  const validated = organizationSchemas.create.parse(input);

  const [organization] = await db
    .insert(organizations)
    .values({
      ...validated,
      owner_id: session.user.id,
    })
    .returning();

  revalidatePath('/organizations');
  return organization;
}

export async function updateOrganization(
  id: string,
  input: { name?: string; description?: string }
) {
  const session = await requireAuth();

  const validated = organizationSchemas.update.parse(input);

  const [updated] = await db
    .update(organizations)
    .set(validated)
    .where(
      and(eq(organizations.id, id), eq(organizations.owner_id, session.user.id))
    )
    .returning();

  if (!updated) {
    throw new Error('组织不存在或无权限');
  }

  revalidatePath('/organizations');
  revalidatePath(`/organizations/${id}`);
  return updated;
}

export async function getOrganization(id: string) {
  const session = await requireAuth();

  const [organization] = await db
    .select()
    .from(organizations)
    .where(
      and(eq(organizations.id, id), eq(organizations.owner_id, session.user.id))
    )
    .limit(1);

  if (!organization) {
    return null;
  }

  return {
    ...organization,
    created_at: organization.created_at.toISOString(),
    updated_at: organization.updated_at.toISOString(),
  };
}

export async function deleteOrganization(id: string) {
  const session = await requireAuth();

  const deleted = await db
    .delete(organizations)
    .where(
      and(eq(organizations.id, id), eq(organizations.owner_id, session.user.id))
    )
    .returning();

  if (!deleted.length) {
    throw new Error('组织不存在或无权限');
  }

  revalidatePath('/organizations');
  return true;
}

export async function getPublicOrganizations(): Promise<Organization[]> {
  try {
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

    return data.map((org) => ({
      ...org,
      created_at: org.created_at.toISOString(),
      updated_at: org.updated_at.toISOString(),
      password: org.password,
    }));
  } catch (error) {
    console.error('获取公开组织失败:', error);
    return [];
  }
}
