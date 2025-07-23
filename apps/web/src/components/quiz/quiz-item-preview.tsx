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
import { CheckCircle2, Loader2, Send, Trash2 } from 'lucide-react';
import type { LectureStatus, QuizItem } from '@/types';

interface QuizItemPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizItem: QuizItem | null;
  onDelete?: (id: string) => Promise<void>;
  isDeleting?: boolean;
  onPush?: (id: string) => Promise<void>;
  isPushing?: boolean;
  lectureStatus?: LectureStatus;
}

export function QuizItemPreviewDialog({
  open,
  onOpenChange,
  quizItem,
  onDelete,
  isDeleting,
  onPush,
  isPushing,
  lectureStatus,
}: QuizItemPreviewDialogProps) {
  if (!quizItem) {
    return null;
  }

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(quizItem.id);
      onOpenChange(false);
    }
  };

  const handlePush = async () => {
    if (onPush) {
      await onPush(quizItem.id);
    }
  };

  const canPush = lectureStatus === 'in_progress' && onPush;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>题目预览</DialogTitle>
          <DialogDescription>查看题目详情和答案解析</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 问题 */}
          <div>
            <h3 className="mb-2 font-semibold text-lg">{quizItem.question}</h3>
          </div>

          {/* 选项 */}
          <div className="space-y-3">
            {quizItem.options.map((option, index) => {
              const isCorrect = index === quizItem.answer;
              return (
                <div
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/20'
                      : 'border-border'
                  }`}
                  key={index}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      isCorrect
                        ? 'border-green-500 text-green-600 dark:border-green-700 dark:text-green-400'
                        : 'border-muted-foreground/50 text-muted-foreground'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{option}</p>
                  </div>
                  {isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 解释 */}
          {quizItem.explanation && (
            <div className="rounded-lg bg-info/10 p-4">
              <h4 className="mb-2 flex items-center gap-2 font-medium text-sm">
                <CheckCircle2 className="h-4 w-4 text-info" />
                答案解析
              </h4>
              <p className="text-sm leading-relaxed">{quizItem.explanation}</p>
            </div>
          )}

          {/* 统计信息 */}
          {quizItem._count && quizItem._count.attempts > 0 && (
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="mb-2 font-medium text-sm">答题统计</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">答题次数：</span>
                  <span className="font-medium">
                    {quizItem._count.attempts}
                  </span>
                </div>
                {quizItem.correctRate !== undefined && (
                  <div>
                    <span className="text-muted-foreground">正确率：</span>
                    <span className="font-medium">
                      {(quizItem.correctRate * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full justify-between gap-2">
            <div className="flex gap-2">
              {onDelete && (
                <Button
                  disabled={isDeleting}
                  onClick={handleDelete}
                  variant="destructive"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      删除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除题目
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {canPush && (
                <Button
                  disabled={isPushing}
                  onClick={handlePush}
                  variant="default"
                >
                  {isPushing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      推送中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      推送题目
                    </>
                  )}
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)} variant="outline">
                关闭
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
