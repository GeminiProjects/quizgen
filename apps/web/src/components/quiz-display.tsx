'use client';

import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Progress } from '@repo/ui/components/progress';
import { cn } from '@repo/ui/lib/utils';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuizDisplayProps {
  question: string;
  options: string[];
  correctAnswer?: number;
  onAnswer?: (selectedIndex: number) => void;
  timeLimit?: number; // 秒
  showResult?: boolean;
  userAnswer?: number;
}

/**
 * 题目展示组件
 * 可复用于演讲者预览和听众答题
 */
export default function QuizDisplay({
  question,
  options,
  correctAnswer,
  onAnswer,
  timeLimit = 30,
  showResult = false,
  userAnswer,
}: QuizDisplayProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isExpired, setIsExpired] = useState(false);

  // 倒计时逻辑
  useEffect(() => {
    if (showResult || isExpired) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showResult, isExpired]);

  /**
   * 处理选项点击
   */
  const handleOptionClick = (index: number) => {
    if (showResult || isExpired || selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(index);
    onAnswer?.(index);
  };

  /**
   * 获取选项样式
   */
  const getOptionClassName = (index: number) => {
    const baseClass =
      'relative flex items-center gap-3 rounded-lg border p-4 transition-all cursor-pointer hover:bg-muted/50';

    if (!(showResult || isExpired)) {
      return selectedAnswer === index
        ? `${baseClass} border-primary bg-primary/10`
        : baseClass;
    }

    // 显示结果时的样式
    const isCorrect = index === correctAnswer;
    const isUserAnswer = index === (userAnswer ?? selectedAnswer);

    if (isCorrect) {
      return `${baseClass} border-success bg-success/10`;
    }
    if (isUserAnswer && !isCorrect) {
      return `${baseClass} border-destructive bg-destructive/10`;
    }
    return `${baseClass} opacity-60`;
  };

  /**
   * 获取选项图标
   */
  const getOptionIcon = (index: number) => {
    if (!showResult) {
      return null;
    }

    const isCorrect = index === correctAnswer;
    const isUserAnswer = index === (userAnswer ?? selectedAnswer);

    if (isCorrect) {
      return <CheckCircle className="h-5 w-5 text-success" />;
    }
    if (isUserAnswer && !isCorrect) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return null;
  };

  /**
   * 计算倒计时进度
   */
  const timeProgress = (timeRemaining / timeLimit) * 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{question}</h3>
          {!showResult && (
            <Badge
              className={timeRemaining <= 5 ? 'bg-destructive' : ''}
              variant={timeRemaining <= 5 ? 'destructive' : 'secondary'}
            >
              <Clock className="mr-1 h-3 w-3" />
              {timeRemaining}s
            </Badge>
          )}
        </div>
        {!(showResult || isExpired) && (
          <Progress className="mt-2" value={timeProgress} />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((option, index) => (
          <button
            className={cn(getOptionClassName(index), 'w-full')}
            disabled={showResult || isExpired || selectedAnswer !== null}
            key={index}
            onClick={() => handleOptionClick(index)}
            type="button"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium">
              {String.fromCharCode(65 + index)}
            </div>
            <span className="flex-1 text-left">{option}</span>
            {getOptionIcon(index)}
          </button>
        ))}

        {/* 时间到提示 */}
        {isExpired && !showResult && (
          <div className="mt-4 rounded-lg bg-warning/10 p-3 text-center">
            <p className="text-sm text-warning">时间到！请等待结果...</p>
          </div>
        )}

        {/* 结果反馈 */}
        {showResult && (
          <div className="mt-4">
            {(userAnswer ?? selectedAnswer) === correctAnswer ? (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">回答正确！</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">回答错误</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
