'use client';

import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { submitAnswer } from '@/app/actions/participation';
import type { QuizItem } from '@/types';

interface QuizAnswerCardProps {
  quiz: QuizItem;
  onAnswered?: () => void;
}

export function QuizAnswerCard({ quiz, onAnswered }: QuizAnswerCardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctAnswer: number;
    explanation?: string;
  } | null>(null);
  const [startTime] = useState(Date.now());

  const handleSubmit = useCallback(async () => {
    if (selectedOption === null || isSubmitting || result) {
      return;
    }

    setIsSubmitting(true);
    const latencyMs = Date.now() - startTime;

    try {
      const response = await submitAnswer({
        quizId: quiz.id,
        selected: selectedOption,
        latencyMs,
      });

      if (!response.success) {
        toast.error(response.error);
        return;
      }

      setResult(response.data);

      if (response.data.isCorrect) {
        toast.success('回答正确！');
      } else {
        toast.error('回答错误，再接再厉！');
      }

      onAnswered?.();
    } catch (error) {
      toast.error('提交失败，请重试');
      console.error('提交答案失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOption, isSubmitting, result, quiz.id, startTime, onAnswered]);

  // 支持键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (result) {
        return;
      } // 已答题不响应

      const key = e.key;
      if (key >= '1' && key <= '4') {
        const optionIndex = Number.parseInt(key, 10) - 1;
        if (optionIndex < quiz.options.length) {
          setSelectedOption(optionIndex);
        }
      } else if (key === 'Enter' && selectedOption !== null) {
        handleSubmit();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [quiz.options.length, selectedOption, result, handleSubmit]);

  const getOptionClassName = (index: number) => {
    if (!result) {
      return cn(
        'relative w-full cursor-pointer rounded-lg border p-4 text-left transition-all',
        selectedOption === index
          ? 'border-primary bg-primary/5'
          : 'border-muted hover:border-primary/50'
      );
    }

    // 已答题状态
    const isCorrect = index === result.correctAnswer;
    const isSelected = index === selectedOption;

    return cn(
      'relative w-full rounded-lg border p-4 text-left transition-all',
      isCorrect && 'border-success bg-success/5',
      !isCorrect && isSelected && 'border-destructive bg-destructive/5',
      !(isCorrect || isSelected) && 'border-muted opacity-60'
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{quiz.question}</CardTitle>
          {!result && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>答题中</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {quiz.options.map((option, index) => (
            <button
              className={getOptionClassName(index)}
              key={index}
              onClick={() => !result && setSelectedOption(index)}
              type="button"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-xs">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm">{option}</span>
                {result && index === result.correctAnswer && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                )}
                {result && index === selectedOption && !result.isCorrect && (
                  <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                )}
              </div>
            </button>
          ))}
        </div>

        {result?.explanation && (
          <div className="space-y-1 rounded-lg bg-muted/50 p-4">
            <p className="font-medium text-sm">解析</p>
            <p className="text-muted-foreground text-sm">
              {result.explanation}
            </p>
          </div>
        )}

        {!result && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              按数字键 1-4 快速选择，按 Enter 提交
            </p>
            <Button
              disabled={selectedOption === null || isSubmitting}
              onClick={handleSubmit}
              size="sm"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              提交答案
            </Button>
          </div>
        )}

        {result && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 py-2 font-medium text-sm',
              result.isCorrect ? 'text-success' : 'text-destructive'
            )}
          >
            {result.isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>回答正确！</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                <span>回答错误，正确答案是选项 {result.correctAnswer + 1}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
