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
import { QuestionPanel } from '@/components/quiz/question-panel';
import { TimerBar } from '@/components/quiz/timer-bar';
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

// 状态指示组件
const StatusIndicator = ({
  quizStatus,
  isCorrect,
}: {
  quizStatus: QuizStatus;
  isCorrect: boolean;
}) => {
  const getStatusConfig = () => {
    switch (quizStatus) {
      case 'waiting':
        return {
          icon: <Clock className="h-5 w-5 text-primary" />,
          text: '等待演讲者发布题目...',
          className: 'text-primary',
        };
      case 'active':
        return {
          icon: <MessageCircle className="h-5 w-5 text-green-500" />,
          text: '请回答下面的问题',
          className: 'text-green-500',
        };
      case 'submitted':
        return {
          icon: <MessageCircle className="h-5 w-5 text-purple-500" />,
          text: isCorrect ? '回答正确！' : '回答错误，正确答案已显示',
          className: 'text-purple-500',
        };
      case 'expired':
        return {
          icon: <Clock className="h-5 w-5 text-destructive" />,
          text: '时间已到，正确答案已显示',
          className: 'text-destructive',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-2">
          {config.icon}
          <span className={`font-medium ${config.className}`}>
            {config.text}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// 等待状态占位符组件
const WaitingPlaceholder = () => (
  <Card className="mx-auto w-full max-w-2xl">
    <CardContent className="p-12 text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground text-lg">等待题目发布</h3>
          <p className="mt-1 text-muted-foreground">
            演讲者将在适当的时候发布互动问题
          </p>
        </div>
        <div className="animate-pulse">
          <div className="flex justify-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="animation-delay-75 h-2 w-2 rounded-full bg-primary" />
            <div className="animation-delay-150 h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// 统计信息组件
const StatsDisplay = ({
  quizStats,
}: {
  quizStats: { accuracy_rate: number; total_attempts: number };
}) => (
  <Card className="mx-auto w-full max-w-2xl">
    <CardHeader>
      <CardTitle className="text-lg">答题统计</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="font-bold text-2xl text-green-500">
            {Math.round(quizStats.accuracy_rate * 100)}%
          </div>
          <div className="text-muted-foreground text-sm">正确率</div>
        </div>
        <div>
          <div className="font-bold text-2xl text-primary">
            {quizStats.total_attempts}
          </div>
          <div className="text-muted-foreground text-sm">参与人数</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// 演讲不存在错误页面
const LectureNotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <h2 className="mb-2 font-semibold text-xl">演讲不存在</h2>
        <p className="mb-4 text-muted-foreground">请检查链接是否正确</p>
        <Button asChild>
          <Link href="/">返回首页</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

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
    return <LectureNotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
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
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-muted text-muted-foreground'
              }
            >
              {lecture.status === 'active' ? '进行中' : '已结束'}
            </Badge>
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
                  <div className="text-muted-foreground text-xs">演讲者</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="h-4 w-4" />
                {lecture.participants_count} 人参与
              </div>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="space-y-6">
          {/* 状态指示 */}
          <StatusIndicator isCorrect={isCorrect} quizStatus={quizStatus} />

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
          {quizStatus === 'waiting' && <WaitingPlaceholder />}

          {/* 统计信息 */}
          {quizStats &&
            (quizStatus === 'submitted' || quizStatus === 'expired') && (
              <StatsDisplay quizStats={quizStats} />
            )}
        </div>
      </div>
    </div>
  );
}
