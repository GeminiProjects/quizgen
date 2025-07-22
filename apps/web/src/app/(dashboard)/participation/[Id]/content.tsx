'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Hash,
  MessageSquare,
  Timer,
  User,
  Users,
} from 'lucide-react';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { StatsCard } from '@/components/stats-card';
import { lectureStatusConfig, type ParticipatedLecture } from '@/types';
import ExitLectureDialog from './exit-lecture';
import QuizTestTab from './quiz-test-tab';

interface LectureContentProps {
  lecture: ParticipatedLecture;
}

export default function LectureContent({ lecture }: LectureContentProps) {
  const router = useRouter();
  const [showExit, setShowExit] = useState(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // 计算参与相关的统计数据
  const participationStats = {
    totalQuizzes: lecture.quizzes?.length || 0,
    attemptedQuizzes: lecture.quizzes?.filter((q) => q.attempted).length || 0,
    correctAnswers:
      lecture.quizzes?.filter((q) => q.my_attempt?.is_correct).length || 0,
    accuracy: lecture.quizzes?.filter((q) => q.attempted).length
      ? Math.round(
          (lecture.quizzes.filter((q) => q.my_attempt?.is_correct).length /
            lecture.quizzes.filter((q) => q.attempted).length) *
            100
        )
      : 0,
  };

  const breadcrumbItems = [
    { href: '/participation', label: '参与演讲' },
    { label: lecture.title },
  ];

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <BreadcrumbNav items={breadcrumbItems} />

      {/* 页面头部 */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-3xl">{lecture.title}</h1>
            <Badge
              className={lectureStatusConfig[lecture.status]?.className}
              variant={lectureStatusConfig[lecture.status]?.variant}
            >
              {lectureStatusConfig[lecture.status]?.label}
            </Badge>
          </div>
          {lecture.description && (
            <p className="text-lg text-muted-foreground">
              {lecture.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              演讲者：{lecture.owner_name || '未知'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              开始时间：{formatDate(lecture.starts_at)}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
          <Button onClick={() => setShowExit(true)} variant="outline">
            退出演讲
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          description="测验题目总数"
          icon={MessageSquare}
          title="题目数"
          value={participationStats.totalQuizzes}
        />
        <StatsCard
          description="已答题数"
          icon={Hash}
          title="已答题"
          value={`${participationStats.attemptedQuizzes}/${participationStats.totalQuizzes}`}
        />
        <StatsCard
          description="正确答题数"
          icon={CheckCircle}
          title="正确数"
          value={participationStats.correctAnswers}
        />
        <StatsCard
          description="答题正确率"
          icon={Timer}
          title="正确率"
          value={`${participationStats.accuracy}%`}
        />
      </div>

      {/* 演讲信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>演讲信息</CardTitle>
          <CardDescription>查看演讲的基本信息和参与状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">演讲者</span>
              </div>
              <p className="text-muted-foreground">
                {lecture.owner_name || '未知'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">开始时间</span>
              </div>
              <p className="text-muted-foreground">
                {formatDate(lecture.starts_at)}
              </p>
            </div>
            {lecture.ends_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">结束时间</span>
                </div>
                <p className="text-muted-foreground">
                  {formatDate(lecture.ends_at)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">测验数量</span>
              </div>
              <p className="text-muted-foreground">
                {participationStats.totalQuizzes} 个测验
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能标签页 */}
      <Card>
        <CardHeader>
          <CardTitle>参与详情</CardTitle>
          <CardDescription>查看和管理您的参与活动</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="quiz">
            <TabsList className="mb-4">
              <TabsTrigger value="quiz">测验参与</TabsTrigger>
              <TabsTrigger value="progress">参与进度</TabsTrigger>
              <TabsTrigger value="analytics">参与分析</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz">
              <QuizTestTab
                lecture={{
                  id: lecture.id,
                  status: lecture.status,
                  quizzes: lecture.quizzes || [],
                }}
              />
            </TabsContent>

            <TabsContent value="progress">
              <div className="py-8 text-center text-muted-foreground">
                参与进度功能开发中...
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="py-8 text-center text-muted-foreground">
                参与分析功能开发中...
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 退出演讲对话框 */}
      <ExitLectureDialog
        lectureId={lecture.id}
        onOpenChange={setShowExit}
        open={showExit}
      />
    </div>
  );
}
