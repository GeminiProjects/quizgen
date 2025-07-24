import { Button } from '@repo/ui/components/button';
import { Card, CardContent } from '@repo/ui/components/card';
import { ArrowLeft, Clock, FileQuestion, Trophy, Users } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getAnswerHistory,
  getParticipationDetail,
} from '@/app/actions/participation';
import { ParticipationContent } from './participation-content';

export default async function ParticipationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detailResult, historyResult] = await Promise.all([
    getParticipationDetail(id),
    getAnswerHistory(id),
  ]);

  if (!detailResult.success) {
    notFound();
  }

  const { participant, lecture } = detailResult.data;
  const answerHistory = historyResult.success ? historyResult.data : [];

  // 计算统计数据
  const correctCount = answerHistory.filter((a) => a.is_correct).length;
  const correctRate =
    answerHistory.length > 0
      ? Math.round((correctCount / answerHistory.length) * 100)
      : 0;

  const statusConfig = {
    not_started: {
      label: '未开始',
      className: 'bg-muted/10 text-muted-foreground',
    },
    in_progress: {
      label: '进行中',
      className: 'bg-success/10 text-success',
    },
    paused: {
      label: '暂停中',
      className: 'bg-warning/10 text-warning',
    },
    ended: {
      label: '已结束',
      className: 'bg-muted/10 text-muted-foreground',
    },
  };

  const status = statusConfig[lecture.status as keyof typeof statusConfig];

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center gap-4">
        <Button asChild size="icon" variant="ghost">
          <Link href="/participation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-2xl tracking-tight">{lecture.title}</h1>
          <p className="text-muted-foreground">
            {lecture.organization?.name || '个人演讲'}
          </p>
        </div>
        <div
          className={`rounded-full px-3 py-1.5 font-medium text-sm ${status.className}`}
        >
          {status.label}
        </div>
      </div>

      {lecture.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              {lecture.description}
            </p>
          </CardContent>
        </Card>
      )}

      <ParticipationContent
        answerHistory={answerHistory}
        lectureId={lecture.id}
        lectureStatus={lecture.status}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">参与身份</p>
              <p className="font-medium">参与者</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">加入时间</p>
              <p className="font-medium">
                {new Date(participant.joined_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <FileQuestion className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">已答题目</p>
              <p className="font-medium">{answerHistory.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">正确率</p>
              <p className="font-medium">{correctRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
