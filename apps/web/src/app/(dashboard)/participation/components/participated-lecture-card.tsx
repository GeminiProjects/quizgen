'use client';

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
  CheckCircle2,
  FileQuestion,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import type { Participant } from '@/app/actions/participation';
import type { Lecture } from '@/types';
import { lectureStatusConfig } from '@/types';

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
  const correctRate =
    stats.answeredQuizzes > 0
      ? Math.round((stats.correctAnswers / stats.answeredQuizzes) * 100)
      : 0;

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

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
      key={participant.id}
    >
      <Link
        className="absolute inset-0 z-10"
        href={`/participation/${lecture.id}`}
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
              {lecture.organization?.name || lecture.description || '暂无描述'}
            </CardDescription>
          </div>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileQuestion className="h-3.5 w-3.5" />
            <span>{stats.answeredQuizzes} 已答</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatRelativeTime(participant.joined_at)}</span>
          </div>
        </div>

        {stats.answeredQuizzes > 0 && (
          <div className="mb-3 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-muted-foreground">正确率</span>
              </div>
              <span className="font-semibold text-sm">{correctRate}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
