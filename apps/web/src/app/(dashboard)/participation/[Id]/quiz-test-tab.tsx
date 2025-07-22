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
import { Progress } from '@repo/ui/components/progress';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Play,
  Plus,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { LectureStatus, ParticipatedQuizItem } from '@/types';
import QuizTest from './quiz-test';

// 示例小学选择题
const sampleQuestions = [
  {
    question: '小明有 5 个苹果，小红有 3 个苹果，他们一共有多少个苹果？',
    options: ['6个', '7个', '8个', '9个'],
    answer: 2,
  },
  {
    question: '下列哪个是单数？',
    options: ['2', '4', '5', '8'],
    answer: 2,
  },
  {
    question: '一周有几天？',
    options: ['5天', '6天', '7天', '8天'],
    answer: 2,
  },
  {
    question: '下面哪个季节最热？',
    options: ['春天', '夏天', '秋天', '冬天'],
    answer: 1,
  },
  {
    question: '1 + 1 = ?',
    options: ['1', '2', '3', '4'],
    answer: 1,
  },
];

interface QuizTestTabProps {
  lecture: {
    id: string;
    status: LectureStatus;
    quizzes: ParticipatedQuizItem[];
  };
}

export default function QuizTestTab({ lecture }: QuizTestTabProps) {
  const [selectedQuiz, setSelectedQuiz] = useState<ParticipatedQuizItem | null>(
    null
  );
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [localQuizzes, setLocalQuizzes] = useState<ParticipatedQuizItem[]>(
    lecture.quizzes || []
  );

  // 生成随机题目
  const generateRandomQuizzes = () => {
    // 随机选择3个题目
    const selectedQuestions = [...sampleQuestions]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const newQuizzes: ParticipatedQuizItem[] = selectedQuestions.map(
      (q, index) => ({
        id: `local-${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        answer: q.answer,
        ts: new Date().toISOString(),
        created_at: new Date().toISOString(),
        attempted: false,
      })
    );

    setLocalQuizzes((prev) => [...prev, ...newQuizzes]);
  };

  // 使用本地状态而不是直接使用 lecture.quizzes
  const unattemptedQuizzes = localQuizzes.filter((q) => !q.attempted);
  const attemptedQuizzes = localQuizzes.filter((q) => q.attempted);
  const correctQuizzes = attemptedQuizzes.filter(
    (q) => q.my_attempt?.is_correct
  );

  const progress =
    localQuizzes.length > 0
      ? (attemptedQuizzes.length / localQuizzes.length) * 100
      : 0;

  const handleStartQuiz = (quiz: ParticipatedQuizItem) => {
    setSelectedQuiz(quiz);
    setShowQuizDialog(true);
  };

  const handleQuizComplete = () => {
    setShowQuizDialog(false);
    setSelectedQuiz(null);
  };

  if (!localQuizzes.length) {
    return (
      <div className="py-12 text-center">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-lg">暂无测验题目</h3>
        <p className="mb-6 text-muted-foreground">演讲者还未发布任何测验题目</p>
        <Button onClick={generateRandomQuizzes} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          生成示例题目
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 答题进度 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">答题进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">完成进度</span>
            <span className="font-medium">
              {attemptedQuizzes.length} / {localQuizzes.length} 题
            </span>
          </div>
          <Progress className="h-2" value={progress} />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-semibold text-2xl">
                {unattemptedQuizzes.length}
              </div>
              <div className="text-muted-foreground text-xs">未答题</div>
            </div>
            <div>
              <div className="font-semibold text-2xl text-green-600">
                {correctQuizzes.length}
              </div>
              <div className="text-muted-foreground text-xs">答对</div>
            </div>
            <div>
              <div className="font-semibold text-2xl text-red-600">
                {attemptedQuizzes.length - correctQuizzes.length}
              </div>
              <div className="text-muted-foreground text-xs">答错</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 生成更多题目按钮 */}
      {localQuizzes.length > 0 && (
        <div className="flex justify-center">
          <Button
            className="w-full max-w-md"
            onClick={generateRandomQuizzes}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            生成更多题目
          </Button>
        </div>
      )}

      {/* 参加测验按钮 */}
      {unattemptedQuizzes.length > 0 && (
        <div className="flex justify-center">
          <Button
            className="w-full max-w-md"
            disabled={lecture.status === 'ended'}
            onClick={() => handleStartQuiz(unattemptedQuizzes[0])}
            size="lg"
          >
            <Play className="mr-2 h-4 w-4" />
            开始答题
          </Button>
        </div>
      )}

      {/* 未答题目 */}
      {unattemptedQuizzes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">待答题目</h3>
            <Badge variant="secondary">{unattemptedQuizzes.length} 题</Badge>
          </div>
          <div className="grid gap-3">
            {unattemptedQuizzes.map((quiz) => (
              <Card
                className="transition-colors hover:bg-muted/50"
                key={quiz.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="line-clamp-2 text-base">
                        {quiz.question}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {new Date(quiz.created_at).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      disabled={lecture.status === 'ended'}
                      onClick={() => handleStartQuiz(quiz)}
                      size="sm"
                    >
                      <Play className="mr-1 h-3 w-3" />
                      开始答题
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 已答题目 */}
      {attemptedQuizzes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">答题记录</h3>
            <Badge variant="secondary">{attemptedQuizzes.length} 题</Badge>
          </div>
          <div className="grid gap-3">
            {attemptedQuizzes.map((quiz) => (
              <Card
                className="transition-colors hover:bg-muted/50"
                key={quiz.id}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="line-clamp-2 text-base">
                        {quiz.question}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(quiz.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          你的答案：
                          {['A', 'B', 'C', 'D'][quiz.my_attempt?.selected || 0]}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {quiz.my_attempt?.is_correct ? (
                        <Badge
                          className="bg-green-500/10 text-green-600"
                          variant="secondary"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          正确
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-red-500/10 text-red-600"
                          variant="secondary"
                        >
                          <XCircle className="mr-1 h-3 w-3" />
                          错误
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {quiz.my_attempt && (
                  <CardContent className="pt-0">
                    <div className="grid gap-2 text-sm">
                      {quiz.options.map((option, index) => (
                        <div
                          className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                            index === quiz.my_attempt?.selected
                              ? quiz.my_attempt.is_correct
                                ? 'bg-green-500/10 text-green-700'
                                : 'bg-red-500/10 text-red-700'
                              : 'text-muted-foreground'
                          }`}
                          key={`quiz-option-${quiz.id}-${index}`}
                        >
                          <span className="font-medium">
                            {['A', 'B', 'C', 'D'][index]}.
                          </span>
                          <span>{option}</span>
                          {index === quiz.my_attempt?.selected && (
                            <span className="ml-auto text-xs">
                              {quiz.my_attempt.is_correct ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 测验对话框 */}
      {selectedQuiz && (
        <QuizTest
          lectureId={lecture.id}
          onComplete={handleQuizComplete}
          onOpenChange={setShowQuizDialog}
          open={showQuizDialog}
          quiz={selectedQuiz}
        />
      )}
    </div>
  );
}
