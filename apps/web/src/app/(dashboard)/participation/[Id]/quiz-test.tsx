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

  const handleAnswer = async (index: number) => {
    try {
      setIsSubmitting(true);
      setSelectedAnswer(index);

      const result = await submitQuizAnswer({
        lectureId,
        quizId: quiz.id,
        selected: index,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setShowResult(true);
      setTimeout(() => {
        onComplete();
      }, 3000);
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
