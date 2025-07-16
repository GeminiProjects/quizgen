'use client';

import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { QuizItem } from '@/types';

interface QuestionPanelProps {
  quiz: QuizItem;
  onSubmitAnswer: (selectedOption: number) => void;
  userAnswer?: number;
  isCorrect?: boolean;
  showResult?: boolean;
  timeLeft?: number;
}

export const QuestionPanel = ({
  quiz,
  onSubmitAnswer,
  userAnswer,
  isCorrect,
  showResult = false,
  timeLeft = 30,
}: QuestionPanelProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedOption !== null && !isSubmitted) {
      setIsSubmitted(true);
      onSubmitAnswer(selectedOption);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      return selectedOption === index
        ? 'bg-blue-50 border-blue-500 text-blue-700'
        : 'bg-white border-gray-200 hover:border-gray-300';
    }

    // 显示结果时的样式
    if (index === quiz.answer) {
      return 'bg-green-50 border-green-500 text-green-700';
    }

    if (userAnswer === index && userAnswer !== quiz.answer) {
      return 'bg-red-50 border-red-500 text-red-700';
    }

    return 'bg-gray-50 border-gray-200 text-gray-500';
  };

  const getOptionIcon = (index: number) => {
    if (!showResult) {
      return null;
    }

    if (index === quiz.answer) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }

    if (userAnswer === index && userAnswer !== quiz.answer) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }

    return null;
  };

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-800 text-xl">
            {quiz.question}
          </CardTitle>
          {!showResult && (
            <Badge className="flex items-center gap-1" variant="secondary">
              <Clock className="h-4 w-4" />
              {timeLeft}s
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {quiz.options.map((option, index) => (
          <Button
            className={`h-auto min-h-[60px] w-full justify-start p-4 text-left transition-colors ${getOptionStyle(index)}`}
            disabled={showResult || isSubmitted}
            key={`${quiz.id}-option-${index}`}
            onClick={() =>
              !(showResult || isSubmitted) && setSelectedOption(index)
            }
            variant="outline"
          >
            <div className="flex w-full items-center">
              <span className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 font-medium text-sm">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 text-left">{option}</span>
              {getOptionIcon(index)}
            </div>
          </Button>
        ))}

        {!(showResult || isSubmitted) && (
          <div className="pt-4">
            <Button
              className="w-full"
              disabled={selectedOption === null}
              onClick={handleSubmit}
            >
              提交答案
            </Button>
          </div>
        )}

        {showResult && (
          <div className="pt-4">
            <div className="flex items-center justify-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-green-700 text-lg">
                    回答正确！
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-medium text-lg text-red-700">
                    回答错误
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
