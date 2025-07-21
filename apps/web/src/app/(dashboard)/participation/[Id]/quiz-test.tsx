'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import QuizDisplay from '@/components/quiz-display';

interface QuizItem {
  id: string;
  question: string;
  options: string[];
  // 观众端不返回答案
}

export default function AudienceQuizTest() {
  const params = useParams();
  const lectureId = params?.id as string;
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [open, setOpen] = useState(false);

  // 拉取 quiz-items
  const fetchQuizzes = () => {
    if (!lectureId) {
      return;
    }
    setLoading(true);
    fetch(`/api/quiz-items?lecture_id=${lectureId}&page=1&limit=10`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('获取题目失败');
        }
        const data = await res.json();
        setQuizzes(data.data.data || []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleStart = () => {
    setOpen(true);
    fetchQuizzes();
  };

  const handleAnswer = () => {
    setTimeout(() => setShowResult(true), 500);
  };

  return (
    <>
      <div className="my-6 flex justify-center">
        <Button onClick={handleStart} size="lg">
          参加测验
        </Button>
      </div>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>测验答题</DialogTitle>
            <DialogClose asChild>
              <Button className="absolute top-2 right-2" variant="ghost">
                关闭
              </Button>
            </DialogClose>
          </DialogHeader>
          {loading ? (
            <div>题目加载中...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : quizzes.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <span className="text-muted-foreground text-sm">
                  第 {current + 1} 题 / 共 {quizzes.length} 题
                </span>
              </div>
              <QuizDisplay
                onAnswer={handleAnswer}
                options={quizzes[current].options}
                question={quizzes[current].question}
                showResult={showResult}
              />
              <div className="flex justify-center gap-3">
                <Button
                  disabled={current === 0}
                  onClick={() => {
                    setCurrent((c) => c - 1);
                    setShowResult(false);
                  }}
                  variant="outline"
                >
                  上一题
                </Button>
                {current < quizzes.length - 1 ? (
                  <Button
                    onClick={() => {
                      setCurrent((c) => c + 1);
                      setShowResult(false);
                    }}
                  >
                    下一题
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div>暂无测验题目</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
