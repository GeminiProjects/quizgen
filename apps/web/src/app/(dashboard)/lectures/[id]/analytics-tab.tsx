'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  BarChart3,
  CheckCircle,
  MessageSquare,
  Percent,
  Users,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getQuizAnalytics } from '@/app/actions/quiz-analytics';

interface QuizAnalytics {
  quizId: string;
  question: string;
  totalAttempts: number;
  correctAttempts: number;
  correctRate: number;
  options: string[];
  optionStats: {
    option: number;
    text: string;
    count: number;
    percentage: number;
    isCorrect: boolean;
  }[];
  avgResponseTime: number;
  pushedAt: string | null;
}

interface AnalyticsTabProps {
  lectureId: string;
}

export default function AnalyticsTab({ lectureId }: AnalyticsTabProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<QuizAnalytics[]>([]);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const result = await getQuizAnalytics(lectureId);
        if (result.success && result.data) {
          setAnalytics(result.data);
        } else {
          toast.error('加载数据分析失败');
        }
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error('加载数据分析失败');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [lectureId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton className="h-64 w-full" key={i} />
        ))}
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="mb-2 font-medium text-lg">暂无数据</p>
        <p className="text-muted-foreground text-sm">
          还没有生成和推送任何测验题目
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">总题目数</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{analytics.length}</p>
            <p className="text-muted-foreground text-xs">
              已推送 {analytics.filter((a) => a.pushedAt).length} 道
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">总答题次数</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {analytics.reduce((sum, a) => sum + a.totalAttempts, 0)}
            </p>
            <p className="text-muted-foreground text-xs">
              平均每题{' '}
              {(
                analytics.reduce((sum, a) => sum + a.totalAttempts, 0) /
                analytics.length
              ).toFixed(1)}{' '}
              人次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">平均正确率</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {(
                (analytics.reduce((sum, a) => sum + a.correctRate, 0) /
                  analytics.length) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-muted-foreground text-xs">
              所有题目的平均正确率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 题目详细分析 */}
      <div className="space-y-4">
        {analytics.map((quiz, index) => (
          <Card key={quiz.quizId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">题目 {index + 1}</CardTitle>
                  <CardDescription className="text-base">
                    {quiz.question}
                  </CardDescription>
                </div>
                {quiz.pushedAt && (
                  <div className="text-right">
                    <p className="text-muted-foreground text-sm">
                      推送时间：
                      {new Date(quiz.pushedAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 总体统计 */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">答题人数</p>
                  <p className="font-semibold text-2xl">{quiz.totalAttempts}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">正确率</p>
                  <div className="flex items-baseline gap-2">
                    <p className="font-semibold text-2xl">
                      {(quiz.correctRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      ({quiz.correctAttempts}/{quiz.totalAttempts})
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">平均答题时间</p>
                  <p className="font-semibold text-2xl">
                    {quiz.avgResponseTime.toFixed(1)}s
                  </p>
                </div>
              </div>

              {/* 选项分布 */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">选项分布</h4>
                {quiz.optionStats.map((stat) => (
                  <div className="space-y-2" key={stat.option}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-muted font-medium text-xs">
                          {String.fromCharCode(65 + stat.option)}
                        </span>
                        <span className="text-muted-foreground">
                          {stat.text}
                        </span>
                        {stat.isCorrect && (
                          <CheckCircle className="h-4 w-4 text-success" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {stat.percentage.toFixed(1)}%
                        </span>
                        <span className="text-muted-foreground">
                          ({stat.count}人)
                        </span>
                      </div>
                    </div>
                    <Progress
                      className="h-2"
                      indicatorClassName={
                        stat.isCorrect ? 'bg-success' : undefined
                      }
                      value={stat.percentage}
                    />
                  </div>
                ))}
              </div>

              {/* 正确率指示器 */}
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {quiz.correctRate >= 0.7 ? (
                    <CheckCircle className="h-6 w-6 text-success" />
                  ) : quiz.correctRate >= 0.4 ? (
                    <Percent className="h-6 w-6 text-warning" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {quiz.correctRate >= 0.7
                      ? '掌握良好'
                      : quiz.correctRate >= 0.4
                        ? '基本掌握'
                        : '需要加强'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {quiz.correctRate >= 0.7
                      ? '大部分听众理解了这个知识点'
                      : quiz.correctRate >= 0.4
                        ? '部分听众需要更多讲解'
                        : '建议重点讲解这个知识点'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
