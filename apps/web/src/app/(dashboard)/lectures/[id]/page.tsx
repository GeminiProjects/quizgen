import {
  and,
  attempts,
  count,
  db,
  desc,
  eq,
  lectureParticipants,
  lectures,
  materials,
  quizItems,
  transcripts,
} from '@repo/db';
import { Skeleton } from '@repo/ui/components/skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import LectureDetailContent from './content';

export const metadata = {
  title: '演讲详情',
};

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
  const [
    participantStats,
    quizStats,
    transcriptStats,
    materialStats,
    contextStats,
    responseTimeStats,
  ] = await Promise.all([
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
    db
      .select({
        totalTranscripts: count(transcripts.id),
      })
      .from(transcripts)
      .where(eq(transcripts.lecture_id, lectureId)),
    db
      .select({
        totalMaterials: count(materials.id),
      })
      .from(materials)
      .where(eq(materials.lecture_id, lectureId)),
    // 获取上下文大小（材料文本 + 转录文本的字符数）
    Promise.all([
      db.select().from(materials).where(eq(materials.lecture_id, lectureId)),
      db
        .select()
        .from(transcripts)
        .where(eq(transcripts.lecture_id, lectureId)),
    ]).then(([materialsList, transcriptsList]) => {
      const materialTextLength = materialsList.reduce(
        (sum, m) => sum + (m.text_content?.length || 0),
        0
      );
      const transcriptTextLength = transcriptsList.reduce(
        (sum, t) => sum + (t.text?.length || 0),
        0
      );
      return {
        totalLength: materialTextLength + transcriptTextLength,
      };
    }),
    // 获取平均答题时间
    db
      .select()
      .from(attempts)
      .innerJoin(quizItems, eq(attempts.quiz_id, quizItems.id))
      .where(eq(quizItems.lecture_id, lectureId))
      .then((attemptsList) => {
        if (attemptsList.length === 0) {
          return { avgLatency: 0, totalAttempts: 0 };
        }
        const totalLatency = attemptsList.reduce(
          (sum, a) => sum + (a.attempts.latency_ms || 0),
          0
        );
        return {
          avgLatency: totalLatency,
          totalAttempts: attemptsList.length,
        };
      }),
  ]);

  return {
    lecture: {
      ...lecture,
      created_at: lecture.created_at.toISOString(),
      updated_at: lecture.updated_at.toISOString(),
      starts_at: lecture.starts_at.toISOString(),
      ends_at: lecture.ends_at?.toISOString() || null,
      quizItems: recentQuizItems.map((item) => ({
        ...item,
        created_at: item.created_at.toISOString(),
        ts: item.ts.toISOString(),
        pushed_at: item.pushed_at?.toISOString() || null,
      })),
    },
    stats: {
      totalParticipants: participantStats[0]?.totalParticipants || 0,
      totalQuizItems: quizStats[0]?.totalQuizItems || 0,
      totalTranscripts: transcriptStats[0]?.totalTranscripts || 0,
      totalMaterials: materialStats[0]?.totalMaterials || 0,
      contextSize: contextStats.totalLength || 0,
      avgResponseTime:
        responseTimeStats.totalAttempts && responseTimeStats.avgLatency
          ? responseTimeStats.avgLatency /
            responseTimeStats.totalAttempts /
            1000
          : 0,
    },
  };
}

/**
 * 演讲详情页面
 */
export default async function LectureDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const session = await requireAuth();

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
