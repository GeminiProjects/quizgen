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
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { exitLecture } from '@/app/actions/participation';

interface ExitLectureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lectureId: string;
}

/**
 * 退出演讲对话框组件
 */
export default function ExitLectureDialog({
  open,
  onOpenChange,
  lectureId,
}: ExitLectureProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleExit = () => {
    startTransition(async () => {
      try {
        await exitLecture(lectureId);
        toast.success('成功退出演讲');
        onOpenChange(false);
        router.push('/participation');
      } catch (error) {
        toast.error((error as Error)?.message || '退出演讲失败');
      }
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>退出演讲</DialogTitle>
          <DialogDescription>
            退出后您将不再收到该演讲的测验推送，但仍可查看历史答题记录。
          </DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground">
          确定要退出当前演讲吗？此操作无法撤销。
        </p>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={isPending}
            onClick={handleExit}
            variant="destructive"
          >
            {isPending ? '正在退出...' : '确认退出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
