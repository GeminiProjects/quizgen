'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Label } from '@repo/ui/components/label';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/radio-group';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { submitQuizAttempt } from '@/app/actions/participation';

interface QuizTestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz: {
    id: string;
    question: string;
    options: string[];
  };
  lectureId: string;
  onComplete: () => void;
}

export default function QuizTest({
  open,
  onOpenChange,
  quiz,
  lectureId: _lectureId,
  onComplete,
}: QuizTestProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<{
    is_correct: boolean;
    correct_answer: number;
  } | null>(null);

  // 记录开始时间
  useEffect(() => {
    if (open) {
      setStartTime(Date.now());
      setSelected('');
      setResult(null);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!selected) {
      toast.error('请选择一个答案');
      return;
    }

    const selectedIndex = Number.parseInt(selected, 10);
    const latencyMs = Date.now() - startTime;

    startTransition(async () => {
      try {
        const response = await submitQuizAttempt({
          quiz_id: quiz.id,
          selected: selectedIndex,
          latency_ms: latencyMs,
        });

        setResult(response);

        if (response.is_correct) {
          toast.success('回答正确！');
        } else {
          toast.error(
            `回答错误，正确答案是 ${['A', 'B', 'C', 'D'][response.correct_answer]}`
          );
        }

        // 延迟关闭对话框，让用户看到结果
        setTimeout(() => {
          onComplete();
          router.refresh();
        }, 2000);
      } catch (error) {
        toast.error((error as Error)?.message || '提交答案失败');
      }
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>测验答题</DialogTitle>
          <DialogDescription>
            请仔细阅读题目，选择你认为正确的答案
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 题目 */}
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{quiz.question}</h3>
          </div>

          {/* 选项 */}
          <RadioGroup
            className="space-y-3"
            disabled={isPending || !!result}
            onValueChange={setSelected}
            value={selected}
          >
            {quiz.options.map((option, index) => (
              <div
                className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors ${
                  result
                    ? index === result.correct_answer
                      ? 'border-green-500 bg-green-50'
                      : selected === index.toString() && !result.is_correct
                        ? 'border-red-500 bg-red-50'
                        : ''
                    : selected === index.toString()
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                }`}
                key={`option-${quiz.id}-${index}`}
              >
                <RadioGroupItem
                  id={`option-${index}`}
                  value={index.toString()}
                />
                <Label
                  className="flex-1 cursor-pointer text-base"
                  htmlFor={`option-${index}`}
                >
                  <span className="mr-2 font-medium">
                    {['A', 'B', 'C', 'D'][index]}.
                  </span>
                  {option}
                </Label>
                {result && index === result.correct_answer && (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                {result &&
                  selected === index.toString() &&
                  !result.is_correct && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
              </div>
            ))}
          </RadioGroup>

          {/* 结果提示 */}
          {result && (
            <div
              className={`rounded-lg p-4 text-center ${
                result.is_correct
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {result.is_correct ? (
                <p className="font-medium">🎉 回答正确！</p>
              ) : (
                <p className="font-medium">
                  😅 回答错误，正确答案是{' '}
                  {['A', 'B', 'C', 'D'][result.correct_answer]}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={isPending || !selected || !!result}
            onClick={handleSubmit}
          >
            {isPending ? '提交中...' : result ? '已提交' : '提交答案'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
