import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  ArrowRight,
  Calendar,
  Pause,
  Play,
  Presentation,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getLectures } from '@/app/actions/lectures';
import { lectureStatusConfig } from '@/types';
import JoinCodeField from './join-code-field';
import LecturesPageContent from './page-content';
import LectureStatsCard from './stats';

function LecturesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return '今天';
  }
  if (diffInHours < 48) {
    return '昨天';
  }
  if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

async function LecturesList() {
  const { data: lectures } = await getLectures();

  if (lectures.length === 0) {
    return <LecturesPageContent hasLectures={false} />;
  }

  return (
    <>
      <LectureStatsCard lectures={lectures} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lectures.map((lecture) => (
          <Card
            className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
            key={lecture.id}
          >
            <Link
              className="absolute inset-0 z-10"
              href={`/lectures/${lecture.id}`}
            >
              <span className="sr-only">查看{lecture.title}详情</span>
            </Link>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="truncate">{lecture.title}</span>
                    <Badge
                      className={lectureStatusConfig[lecture.status].className}
                      variant={lectureStatusConfig[lecture.status].variant}
                    >
                      {lectureStatusConfig[lecture.status].label}
                    </Badge>
                    <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                    {lecture.description || '暂无描述'}
                  </CardDescription>
                </div>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {lecture.status === 'in_progress' ? (
                    <Play className="h-4 w-4" />
                  ) : lecture.status === 'paused' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Presentation className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{lecture._count?.participants || 0} 参与者</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatRelativeTime(lecture.created_at)}</span>
                </div>
              </div>

              <JoinCodeField
                joinCode={lecture.join_code}
                lectureId={lecture.id}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function LecturesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-info">我的演讲</h1>
          <p className="text-muted-foreground">管理您创建的演讲会话</p>
        </div>
        <LecturesPageContent hasLectures={true} />
      </div>

      <Suspense fallback={<LecturesSkeleton />}>
        <LecturesList />
      </Suspense>
    </div>
  );
}
