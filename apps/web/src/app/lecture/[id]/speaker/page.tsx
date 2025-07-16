'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Pause,
  Play,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { StatsDisplay } from '@/components/quiz/stats-display';
import {
  getActiveLectureQuiz,
  getCurrentUser,
  getLectureById,
  getLectureQuizzes,
  getLectureStats,
  getQuizStats,
} from '@/lib/mock-data';

interface SpeakerViewProps {
  params: Promise<{ id: string }>;
}

export default function SpeakerView({ params }: SpeakerViewProps) {
  const [activeTab, setActiveTab] = useState('current');
  const [isQuizActive, setIsQuizActive] = useState(false);

  const resolvedParams = use(params) as { id: string };
  const currentUser = getCurrentUser();
  const lecture = getLectureById(resolvedParams.id);
  const activeQuiz = getActiveLectureQuiz(resolvedParams.id);
  const allQuizzes = getLectureQuizzes(resolvedParams.id);
  const lectureStats = getLectureStats(resolvedParams.id);
  const activeQuizStats = activeQuiz ? getQuizStats(activeQuiz.id) : null;

  const handleStartQuiz = () => {
    setIsQuizActive(true);
    // 模拟启动题目
    console.log('启动题目:', activeQuiz?.id);
  };

  const handleStopQuiz = () => {
    setIsQuizActive(false);
    // 模拟停止题目
    console.log('停止题目:', activeQuiz?.id);
  };

  if (!lecture) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="mb-2 font-semibold text-xl">讲座不存在</h2>
            <p className="mb-4 text-muted-foreground">请检查链接是否正确</p>
            <Button asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 检查是否是讲座的所有者
  if (lecture.owner_id !== currentUser.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="mb-2 font-semibold text-xl">无权限访问</h2>
            <p className="mb-4 text-muted-foreground">
              只有讲座创建者才能查看演讲者视图
            </p>
            <Button asChild>
              <Link href={`/lecture/${resolvedParams.id}`}>进入听众视图</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* 头部 */}
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-4">
            <Button asChild size="sm" variant="ghost">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </Link>
            </Button>
            <Badge
              className={
                lecture.status === 'active'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {lecture.status === 'active' ? '进行中' : '已结束'}
            </Badge>
            <Badge variant="outline">演讲者视图</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-foreground">
                {lecture.title}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {lecture.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                {lecture.participants_count} 人参与
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/lecture/${resolvedParams.id}`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  听众视图
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">当前题目</TabsTrigger>
            <TabsTrigger value="stats">统计概览</TabsTrigger>
            <TabsTrigger value="history">历史题目</TabsTrigger>
          </TabsList>

          {/* 当前题目 */}
          <TabsContent className="mt-6" value="current">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 题目控制 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    题目控制
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeQuiz ? (
                    <div className="space-y-4">
                      <div className="rounded-lg bg-primary/5 p-4">
                        <h3 className="mb-2 font-medium text-primary">
                          当前题目
                        </h3>
                        <p className="text-primary/80">{activeQuiz.question}</p>
                      </div>

                      <div className="space-y-2">
                        {activeQuiz.options.map((option, index) => (
                          <div
                            className={`rounded-lg border p-3 ${
                              index === activeQuiz.answer
                                ? 'border-green-500/20 bg-green-500/5'
                                : 'border-border bg-muted/50'
                            }`}
                            key={`${activeQuiz.id}-current-option-${index}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-sm">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="flex-1">{option}</span>
                              {index === activeQuiz.answer && (
                                <Badge className="bg-green-500/10 text-green-500">
                                  正确答案
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          className="flex-1"
                          disabled={isQuizActive}
                          onClick={handleStartQuiz}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {isQuizActive ? '题目进行中' : '开始答题'}
                        </Button>
                        <Button
                          className="flex-1"
                          disabled={!isQuizActive}
                          onClick={handleStopQuiz}
                          variant="outline"
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          停止答题
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">暂无活跃题目</p>
                      <Button className="mt-4" size="sm">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        发布新题目
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 实时统计 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    实时统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeQuizStats ? (
                    <div className="space-y-6">
                      {/* 基本统计 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="font-bold text-3xl text-green-500">
                            {Math.round(activeQuizStats.accuracy_rate * 100)}%
                          </div>
                          <div className="text-muted-foreground text-sm">
                            正确率
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-3xl text-primary">
                            {activeQuizStats.total_attempts}
                          </div>
                          <div className="text-muted-foreground text-sm">
                            参与人数
                          </div>
                        </div>
                      </div>

                      {/* 正确率进度条 */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>正确率</span>
                          <span>
                            {activeQuizStats.correct_attempts}/
                            {activeQuizStats.total_attempts}
                          </span>
                        </div>
                        <Progress
                          className="h-2"
                          value={Math.round(
                            activeQuizStats.accuracy_rate * 100
                          )}
                        />
                      </div>

                      {/* 选项分布 */}
                      <div className="space-y-3">
                        <h4 className="font-medium">选项分布</h4>
                        {activeQuizStats.option_distribution.map(
                          (count, index) => {
                            const percentage =
                              activeQuizStats.total_attempts > 0
                                ? Math.round(
                                    (count / activeQuizStats.total_attempts) *
                                      100
                                  )
                                : 0;

                            return (
                              <div
                                className="space-y-1"
                                key={`${activeQuizStats.quiz_id}-speaker-option-${index}`}
                              >
                                <div className="flex justify-between text-sm">
                                  <span>
                                    选项 {String.fromCharCode(65 + index)}
                                  </span>
                                  <span>
                                    {count}人 ({percentage}%)
                                  </span>
                                </div>
                                <Progress className="h-1" value={percentage} />
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">暂无统计数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 统计概览 */}
          <TabsContent className="mt-6" value="stats">
            <div className="space-y-6">
              {/* 总体统计 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-2xl">
                          {lecture.participants_count}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          参与人数
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-500/10 p-2">
                        <MessageCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <div className="font-bold text-2xl">
                          {allQuizzes.length}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          题目总数
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/10 p-2">
                        <Target className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <div className="font-bold text-2xl">
                          {lectureStats
                            ? Math.round(lectureStats.overall_accuracy * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-muted-foreground text-sm">
                          总体正确率
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-orange-500/10 p-2">
                        <TrendingUp className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-bold text-2xl">
                          {lectureStats
                            ? Math.round(lectureStats.engagement_rate * 100)
                            : 0}
                          %
                        </div>
                        <div className="text-muted-foreground text-sm">
                          参与率
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 详细统计 */}
              {activeQuizStats && <StatsDisplay stats={activeQuizStats} />}
            </div>
          </TabsContent>

          {/* 历史题目 */}
          <TabsContent className="mt-6" value="history">
            <Card>
              <CardHeader>
                <CardTitle>历史题目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allQuizzes.map((quiz, index) => {
                    const stats = getQuizStats(quiz.id);
                    return (
                      <div className="rounded-lg border p-4" key={quiz.id}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant="outline">题目 {index + 1}</Badge>
                              <Badge
                                className={
                                  quiz.is_active
                                    ? 'bg-green-500/10 text-green-500'
                                    : 'bg-muted text-muted-foreground'
                                }
                              >
                                {quiz.is_active ? '进行中' : '已结束'}
                              </Badge>
                            </div>
                            <h3 className="mb-2 font-medium">
                              {quiz.question}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              发布时间: {quiz.ts.toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <div className="text-right">
                            {stats && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground text-sm">
                                  正确率:{' '}
                                  <span className="font-medium">
                                    {Math.round(stats.accuracy_rate * 100)}%
                                  </span>
                                </div>
                                <div className="text-muted-foreground text-sm">
                                  参与:{' '}
                                  <span className="font-medium">
                                    {stats.total_attempts}人
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {allQuizzes.length === 0 && (
                    <div className="py-8 text-center">
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        还没有发布任何题目
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
