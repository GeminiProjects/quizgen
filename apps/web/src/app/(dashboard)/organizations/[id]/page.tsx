import { and, count, db, desc, eq, lectures, organizations } from '@repo/db';
import { Skeleton } from '@repo/ui/components/skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import OrganizationDetailContent from './content';

export const metadata = {
  title: '组织详情',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 获取组织详情数据
 */
async function getOrganizationData(organizationId: string, userId: string) {
  // 获取组织信息
  const organizationResult = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.owner_id, userId)
      )
    )
    .limit(1);

  const organization = organizationResult[0];

  if (!organization) {
    return null;
  }

  // 获取最近的演讲
  const recentLectures = await db
    .select()
    .from(lectures)
    .where(eq(lectures.org_id, organizationId))
    .orderBy(desc(lectures.created_at))
    .limit(10);

  // 获取统计数据
  const stats = await db
    .select({
      totalLectures: count(lectures.id),
    })
    .from(lectures)
    .where(eq(lectures.org_id, organizationId));

  return {
    organization: {
      ...organization,
      created_at: organization.created_at.toISOString(),
      updated_at: organization.updated_at.toISOString(),
      lectures: recentLectures.map((lecture) => ({
        ...lecture,
        created_at: lecture.created_at.toISOString(),
        updated_at: lecture.updated_at.toISOString(),
        starts_at: lecture.starts_at.toISOString(),
        ends_at: lecture.ends_at?.toISOString() || null,
      })),
    },
    stats: stats[0] || { totalLectures: 0 },
  };
}

/**
 * 组织详情页面
 */
export default async function OrganizationDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();

  const data = await getOrganizationData(resolvedParams.id, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OrganizationDetailContent
        organization={data.organization}
        stats={data.stats}
      />
    </Suspense>
  );
}

/**
 * 加载骨架屏
 */
function LoadingSkeleton() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton className="h-32" key={i} />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}
