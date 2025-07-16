'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ArrowLeft, Clock, MessageCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { QuestionPanel } from '@/components/quiz/QuestionPanel';
import { TimerBar } from '@/components/quiz/TimerBar';
import {
  getActiveLectureQuiz,
  getCurrentUser,
  getLectureById,
  getQuizStats,
} from '@/lib/mock-data';
import type { QuizStatus } from '@/types';

interface AudienceViewProps {
  params: Promise<{ id: string }>;
}

export default function AudienceView({ params }: AudienceViewProps) {
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('waiting');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);

  const resolvedParams = use(params) as { id: string };
  const currentUser = getCurrentUser();
  const lecture = getLectureById(resolvedParams.id);
  const activeQuiz = getActiveLectureQuiz(resolvedParams.id);
  const quizStats = activeQuiz ? getQuizStats(activeQuiz.id) : null;

  useEffect(() => {
    if (activeQuiz) {
      setQuizStatus('active');
      setTimeLeft(activeQuiz.time_limit);
    } else {
      setQuizStatus('waiting');
    }
  }, [activeQuiz]);

  const handleSubmitAnswer = (answer: number) => {
    if (!activeQuiz) {
      return;
    }

    setSelectedAnswer(answer);
    setIsCorrect(answer === activeQuiz.answer);
    setQuizStatus('submitted');

    // 模拟提交答案到服务器
    console.log('提交答案:', {
      quizId: activeQuiz.id,
      answer,
      userId: currentUser.id,
    });
  };

  const handleTimeUp = () => {
    if (quizStatus === 'active') {
      setQuizStatus('expired');
    }
  };

  if (!lecture) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="mb-2 font-semibold text-xl">讲座不存在</h2>
            <p className="mb-4 text-gray-600">请检查链接是否正确</p>
            <Button asChild>
              <Link href="/">返回首页</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-6">
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
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }
            >
              {lecture.status === 'active' ? '进行中' : '已结束'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-gray-900">
                {lecture.title}
              </h1>
              <p className="mt-1 text-gray-600">{lecture.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    alt={lecture.owner.display_name}
                    src={lecture.owner.avatar_url}
                  />
                  <AvatarFallback>
                    {lecture.owner.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {lecture.owner.display_name}
                  </div>
                  <div className="text-gray-500 text-xs">演讲者</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <Users className="h-4 w-4" />
                {lecture.participants_count} 人参与
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="space-y-6">
          {/* 状态指示 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-2">
                {quizStatus === 'waiting' && (
                  <>
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-600">
                      等待演讲者发布题目...
                    </span>
                  </>
                )}
                {quizStatus === 'active' && (
                  <>
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">
                      请回答下面的问题
                    </span>
                  </>
                )}
                {quizStatus === 'submitted' && (
                  <>
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-600">
                      {isCorrect ? '回答正确！' : '回答错误，正确答案已显示'}
                    </span>
                  </>
                )}
                {quizStatus === 'expired' && (
                  <>
                    <Clock className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-600">
                      时间已到，正确答案已显示
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 计时器 */}
          {quizStatus === 'active' && activeQuiz && (
            <TimerBar
              isActive={true}
              onTimeUp={handleTimeUp}
              totalTime={activeQuiz.time_limit}
            />
          )}

          {/* 题目面板 */}
          {activeQuiz && (
            <QuestionPanel
              isCorrect={isCorrect}
              onSubmitAnswer={handleSubmitAnswer}
              quiz={activeQuiz}
              showResult={
                quizStatus === 'submitted' || quizStatus === 'expired'
              }
              timeLeft={timeLeft}
              userAnswer={selectedAnswer ?? undefined}
            />
          )}

          {/* 等待状态的占位符 */}
          {quizStatus === 'waiting' && (
            <Card className="mx-auto w-full max-w-2xl">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-lg">
                      等待题目发布
                    </h3>
                    <p className="mt-1 text-gray-600">
                      演讲者将在适当的时候发布互动问题
                    </p>
                  </div>
                  <div className="animate-pulse">
                    <div className="flex justify-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <div className="animation-delay-75 h-2 w-2 rounded-full bg-blue-600" />
                      <div className="animation-delay-150 h-2 w-2 rounded-full bg-blue-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 统计信息 */}
          {quizStats &&
            (quizStatus === 'submitted' || quizStatus === 'expired') && (
              <Card className="mx-auto w-full max-w-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">答题统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="font-bold text-2xl text-green-600">
                        {Math.round(quizStats.accuracy_rate * 100)}%
                      </div>
                      <div className="text-gray-600 text-sm">正确率</div>
                    </div>
                    <div>
                      <div className="font-bold text-2xl text-blue-600">
                        {quizStats.total_attempts}
                      </div>
                      <div className="text-gray-600 text-sm">参与人数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
