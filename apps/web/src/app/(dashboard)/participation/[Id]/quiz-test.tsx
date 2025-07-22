'use client';

import { Dialog, DialogContent } from '@repo/ui/components/dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { submitQuizAnswer } from '@/app/actions/participation';
import QuizDisplay from '@/components/quiz-display';
import type { ParticipatedQuizItem } from '@/types';

interface QuizTestProps {
  quiz: ParticipatedQuizItem;
  lectureId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function QuizTest({
  quiz,
  lectureId,
  open,
  onOpenChange,
  onComplete,
}: QuizTestProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>(
    undefined
  );

  // 处理本地题目答案
  const handleLocalQuiz = (index: number) => {
    const isCorrect = index === quiz.answer;
    quiz.attempted = true;
    quiz.my_attempt = {
      quiz_id: quiz.id,
      selected: index,
      is_correct: isCorrect,
    };
    setShowResult(true);
    toast[isCorrect ? 'success' : 'error'](
      isCorrect ? '回答正确！' : '回答错误'
    );
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // 处理服务器题目答案
  const handleServerQuiz = async (index: number) => {
    const result = await submitQuizAnswer({
      lectureId,
      quizId: quiz.id,
      selected: index,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    setShowResult(true);
    toast[result.data.is_correct ? 'success' : 'error'](
      result.data.is_correct ? '回答正确！' : '回答错误'
    );
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const handleAnswer = async (index: number) => {
    try {
      setIsSubmitting(true);
      setSelectedAnswer(index);

      // 根据题目类型选择处理方式
      if (quiz.id.startsWith('local-')) {
        handleLocalQuiz(index);
      } else {
        await handleServerQuiz(index);
      }
    } catch (error) {
      toast.error('提交答案失败');
      console.error('[QuizTest] 提交答案失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <QuizDisplay
          correctAnswer={showResult ? quiz.answer : undefined}
          onAnswer={handleAnswer}
          options={quiz.options}
          question={quiz.question}
          showResult={showResult}
          timeLimit={30}
          userAnswer={selectedAnswer}
        />
      </DialogContent>
    </Dialog>
  );
}
