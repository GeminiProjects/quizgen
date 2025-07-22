'use client';

import { Badge } from '@repo/ui/components/badge';
import { Card, CardContent } from '@repo/ui/components/card';
import { cn } from '@repo/ui/lib/utils';
import { CheckCircle, Circle, MessageSquare, Users } from 'lucide-react';
import type { QuizItem } from '@/types';

interface QuizItemCardProps {
  quizItem: QuizItem;
  onClick?: () => void;
  className?: string;
}

export function QuizItemCard({
  quizItem,
  onClick,
  className,
}: QuizItemCardProps) {
  const correctRate = quizItem.correctRate ?? 0;
  const attempts = quizItem._count?.attempts ?? 0;

  const hasStats = attempts > 0;

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* 题目内容 */}
        <div className="mb-3">
          <p className="line-clamp-2 font-medium text-sm">
            {quizItem.question}
          </p>
        </div>

        {/* 选项展示 */}
        <div className="mb-3 grid grid-cols-2 gap-1.5">
          {quizItem.options.map((option, index) => {
            const isCorrect = index === quizItem.answer;
            return (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                  isCorrect
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground'
                )}
                key={index}
              >
                {isCorrect ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
                <span className="truncate">{option}</span>
              </div>
            );
          })}
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{attempts} 次答题</span>
            </div>
            {quizItem.explanation && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>含解析</span>
              </div>
            )}
          </div>

          {hasStats && (
            <Badge
              className={cn(
                'text-xs',
                correctRate >= 0.7
                  ? 'bg-success/10 text-success'
                  : correctRate >= 0.4
                    ? 'bg-warning/10 text-warning'
                    : 'bg-destructive/10 text-destructive'
              )}
              variant="secondary"
            >
              {(correctRate * 100).toFixed(0)}% 正确率
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
