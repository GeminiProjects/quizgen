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
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Play,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

interface QuizTestTabProps {
  lectureId: string;
}

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  ts: string;
  created_at: string;
  status?: 'pending' | 'completed' | 'failed';
}

// 获取测验数据
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * 参与测验标签页组件
 * 显示可参与的测验列表
 */
export default function QuizTestTab({ lectureId }: QuizTestTabProps) {
  const { data, error: fetchError } = useSWR(
    `/api/lectures/${lectureId}/quiz-items`,
    fetcher
  );

  const quizzes: QuizItem[] = data?.success ? data.data : [];
  const [loading, setLoading] = useState<string | null>(null);

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 格式化相对时间
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取测验状态图标
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': {
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      }
      case 'failed': {
        return <XCircle className="h-4 w-4 text-red-500" />;
      }
      default: {
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      }
    }
  };

  // 获取测验状态标签
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800" variant="default">
            已完成
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">已失败</Badge>;
      default:
        return <Badge variant="secondary">待参与</Badge>;
    }
  };

  // 处理参与测验
  const handleParticipate = (quizId: string) => {
    setLoading(quizId);
    try {
      // 这里可以添加参与测验的逻辑
      // 比如记录参与状态、跳转到答题页面等
      toast.success('正在进入测验...');
      // 可以跳转到具体的答题页面
      // router.push(`/participation/quiz/${quizId}`);
    } catch (err) {
      toast.error('参与测验失败，请重试');
    } finally {
      setLoading(null);
    }
  };

  if (fetchError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">加载测验失败，请刷新重试</p>
        </div>
      </div>
    );
  }

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">暂无测验</h3>
          <p className="text-muted-foreground">当前演讲还没有发布测验题目</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 测验统计 */}
      <Card>
        <CardHeader>
          <CardTitle>测验概览</CardTitle>
          <CardDescription>当前演讲的测验参与情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="font-bold text-2xl">{quizzes.length}</div>
              <div className="text-muted-foreground text-sm">总测验数</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-green-600">
                {quizzes.filter((q) => q.status === 'completed').length}
              </div>
              <div className="text-muted-foreground text-sm">已完成</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-blue-600">
                {quizzes.filter((q) => !q.status).length}
              </div>
              <div className="text-muted-foreground text-sm">待参与</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测验列表 */}
      <div className="space-y-3">
        {quizzes.map((quiz) => (
          <Card className="transition-all hover:shadow-md" key={quiz.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getStatusIcon(quiz.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 font-medium text-base">
                        {quiz.question}
                      </h4>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusBadge(quiz.status)}
                        <span className="text-muted-foreground text-xs">
                          {quiz.options.length} 个选项
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground text-xs">
                    <span>发布时间：{formatTime(quiz.ts)}</span>
                    <span>创建时间：{formatRelativeTime(quiz.created_at)}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {quiz.status === 'completed' ? (
                    <Button disabled size="sm" variant="outline">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      已完成
                    </Button>
                  ) : quiz.status === 'failed' ? (
                    <Button
                      disabled={loading === quiz.id}
                      onClick={() => handleParticipate(quiz.id)}
                      size="sm"
                      variant="outline"
                    >
                      {loading === quiz.id ? (
                        '加载中...'
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          重新参与
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      disabled={loading === quiz.id}
                      onClick={() => handleParticipate(quiz.id)}
                      size="sm"
                    >
                      {loading === quiz.id ? (
                        '加载中...'
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          参与测验
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 参与提示 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600" />
            <div className="space-y-1">
              <p className="font-medium text-blue-900 text-sm">参与提示</p>
              <p className="text-blue-700 text-sm">
                点击"参与测验"按钮开始答题。每个测验都有时间限制，请合理安排答题时间。
                完成测验后可以查看正确答案和解释。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
