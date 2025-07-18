import {
  and,
  count,
  db,
  desc,
  eq,
  lectureParticipants,
  lectures,
  quizItems,
} from '@repo/db';
import { Skeleton } from '@repo/ui/components/skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getServerSideSession } from '@/lib/auth';
import LectureDetailContent from './content';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 获取演讲详情数据
 */
async function getLectureData(lectureId: string, userId: string) {
  // 获取演讲信息
  const lectureResult = await db
    .select()
    .from(lectures)
    .where(and(eq(lectures.id, lectureId), eq(lectures.owner_id, userId)))
    .limit(1);

  const lecture = lectureResult[0];

  if (!lecture) {
    return null;
  }

  // 获取最近的测验题目
  const recentQuizItems = await db
    .select()
    .from(quizItems)
    .where(eq(quizItems.lecture_id, lectureId))
    .orderBy(desc(quizItems.created_at))
    .limit(10);

  // 获取统计数据
  const [participantStats, quizStats] = await Promise.all([
    db
      .select({
        totalParticipants: count(lectureParticipants.id),
      })
      .from(lectureParticipants)
      .where(eq(lectureParticipants.lecture_id, lectureId)),
    db
      .select({
        totalQuizItems: count(quizItems.id),
      })
      .from(quizItems)
      .where(eq(quizItems.lecture_id, lectureId)),
  ]);

  return {
    lecture: {
      ...lecture,
      quizItems: recentQuizItems,
    },
    stats: {
      totalParticipants: participantStats[0]?.totalParticipants || 0,
      totalQuizItems: quizStats[0]?.totalQuizItems || 0,
    },
  };
}

/**
 * 演讲详情页面
 */
export default async function LectureDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await getServerSideSession();

  if (!session?.user?.id) {
    notFound();
  }

  const data = await getLectureData(resolvedParams.id, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LectureDetailContent lecture={data.lecture} stats={data.stats} />
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
