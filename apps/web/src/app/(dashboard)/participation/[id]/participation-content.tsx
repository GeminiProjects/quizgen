'use client';

import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { cn } from '@repo/ui/lib/utils';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileQuestion,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { AttemptRecord } from '@/app/actions/participation';
import { CommentSection } from '@/components/comment-section';
import type { LectureStatus, QuizItem } from '@/types';
import { QuizAnswerCard } from '../components/quiz-answer-card';
import { RealtimeQuizListener } from '../components/realtime-quiz-listener';

interface ParticipationContentProps {
  lectureId: string;
  lectureStatus: LectureStatus;
  answerHistory: AttemptRecord[];
}

export function ParticipationContent({
  lectureId,
  lectureStatus,
  answerHistory,
}: ParticipationContentProps) {
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [activeTab, setActiveTab] = useState('quiz');

  const handleNewQuiz = (quiz: QuizItem) => {
    // 如果当前有题目，先清除再设置新题目，避免动画覆盖
    if (activeQuiz) {
      setActiveQuiz(null);
      // 短暂延迟后设置新题目，确保动画过渡流畅
      setTimeout(() => {
        setActiveQuiz(quiz);
        setActiveTab('quiz'); // 自动切换到答题标签
      }, 100);
    } else {
      setActiveQuiz(quiz);
      setActiveTab('quiz'); // 自动切换到答题标签
    }
  };

  const handleAnswered = () => {
    // 答题完成后不再自动清除，等待下一题或手动切换标签
    // 这样可以让用户查看答案解析
  };

  const isLectureActive = lectureStatus === 'in_progress';

  return (
    <>
      {isLectureActive && (
        <RealtimeQuizListener lectureId={lectureId} onNewQuiz={handleNewQuiz} />
      )}

      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger className="relative" value="quiz">
            答题
            {activeQuiz && (
              <span className="-top-1 -right-1 absolute flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            历史记录
            {answerHistory.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {answerHistory.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="mr-2 h-4 w-4" />
            讨论区
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="quiz">
          {isLectureActive ? (
            activeQuiz ? (
              <QuizAnswerCard onAnswered={handleAnswered} quiz={activeQuiz} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-muted">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">等待新题目</h3>
                  <p className="mt-2 text-muted-foreground text-sm">
                    演讲者推送题目后会自动显示在这里
                  </p>
                  <p className="mt-4 text-muted-foreground text-xs">
                    正在实时监听中...
                  </p>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">
                  演讲未开始或已结束
                </h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {lectureStatus === 'ended'
                    ? '本场演讲已结束，感谢您的参与！'
                    : '请等待演讲开始'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="history">
          {answerHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">暂无答题记录</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  您还没有回答过任何题目
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {answerHistory.map((attempt, index) => (
                <Card key={`${attempt.quiz_id}-${attempt.user_id}-${index}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <CardTitle className="text-base">
                          {attempt.quiz.question}
                          {attempt.selected === -1 && (
                            <Badge
                              className="ml-2 bg-warning/10 text-warning"
                              variant="secondary"
                            >
                              未选择
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                      {attempt.is_correct ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                      ) : attempt.selected === -1 ? (
                        <Clock className="h-5 w-5 shrink-0 text-warning" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-2">
                      {attempt.quiz.options.map((option, optionIndex) => (
                        <div
                          className={cn(
                            'flex items-start gap-2 rounded p-2 text-sm',
                            optionIndex === attempt.quiz.answer &&
                              'bg-success/10 text-success',
                            optionIndex === attempt.selected &&
                              optionIndex !== attempt.quiz.answer &&
                              'bg-destructive/10 text-destructive',
                            attempt.selected === -1 && 'opacity-60'
                          )}
                          key={optionIndex}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                            {optionIndex + 1}
                          </span>
                          <span className="flex-1">{option}</span>
                          {optionIndex === attempt.quiz.answer && (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          )}
                          {optionIndex === attempt.selected &&
                            optionIndex !== attempt.quiz.answer && (
                              <XCircle className="h-4 w-4 shrink-0" />
                            )}
                        </div>
                      ))}
                    </div>

                    {attempt.quiz.explanation && (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="mb-1 font-medium">解析</p>
                        <p className="text-muted-foreground">
                          {attempt.quiz.explanation}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>
                        回答时间：
                        {new Date(attempt.created_at).toLocaleString('zh-CN')}
                      </span>
                      {attempt.latency_ms && (
                        <span>
                          耗时：{(attempt.latency_ms / 1000).toFixed(1)}秒
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="comments">
          <CommentSection isSpeaker={false} lectureId={lectureId} />
        </TabsContent>
      </Tabs>
    </>
  );
}
