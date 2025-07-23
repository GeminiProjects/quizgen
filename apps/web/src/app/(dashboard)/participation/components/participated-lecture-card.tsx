'use client';

import { Button } from '@repo/ui/components/button';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import { cn } from '@repo/ui/lib/utils';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type { Participant } from '@/app/actions/participation';
import type { Lecture } from '@/types';

interface ParticipatedLectureCardProps {
  participant: Participant;
  lecture: Lecture;
  stats: {
    totalQuizzes: number;
    answeredQuizzes: number;
    correctAnswers: number;
  };
}

export function ParticipatedLectureCard({
  participant,
  lecture,
  stats,
}: ParticipatedLectureCardProps) {
  const completionRate =
    stats.totalQuizzes > 0
      ? Math.round((stats.answeredQuizzes / stats.totalQuizzes) * 100)
      : 0;

  const correctRate =
    stats.answeredQuizzes > 0
      ? Math.round((stats.correctAnswers / stats.answeredQuizzes) * 100)
      : 0;

  const statusConfig = {
    not_started: {
      label: '未开始',
      className: 'bg-muted/10 text-muted-foreground',
      icon: Clock,
    },
    in_progress: {
      label: '进行中',
      className: 'bg-success/10 text-success',
      icon: BarChart3,
    },
    paused: {
      label: '暂停中',
      className: 'bg-warning/10 text-warning',
      icon: Clock,
    },
    ended: {
      label: '已结束',
      className: 'bg-muted/10 text-muted-foreground',
      icon: CheckCircle2,
    },
  };

  const status = statusConfig[lecture.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg transition-colors group-hover:text-primary">
              {lecture.title}
            </h3>
            {lecture.organization?.name && (
              <p className="text-muted-foreground text-sm">
                {lecture.organization.name}
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-xs',
              status.className
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </div>
        </div>

        {lecture.description && (
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {lecture.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>加入时间</span>
            </div>
            <p className="font-medium">
              {new Date(participant.joined_at).toLocaleDateString('zh-CN')}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>参与身份</span>
            </div>
            <p className="font-medium">参与者</p>
          </div>
        </div>

        {stats.totalQuizzes > 0 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">答题进度</span>
                <span className="font-medium">
                  {stats.answeredQuizzes}/{stats.totalQuizzes}
                </span>
              </div>
              <Progress className="h-2" value={completionRate} />
            </div>

            {stats.answeredQuizzes > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>正确率</span>
                </div>
                <span
                  className={cn(
                    'font-medium',
                    correctRate >= 80
                      ? 'text-success'
                      : correctRate >= 60
                        ? 'text-warning'
                        : 'text-destructive'
                  )}
                >
                  {correctRate}%
                </span>
              </div>
            )}
          </div>
        )}

        {stats.totalQuizzes === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <FileQuestion className="h-4 w-4" />
            <span>暂无测验题目</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button asChild className="flex-1" size="sm">
            <Link href={`/participation/${lecture.id}`}>
              {lecture.status === 'in_progress' ? '继续参与' : '查看详情'}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
