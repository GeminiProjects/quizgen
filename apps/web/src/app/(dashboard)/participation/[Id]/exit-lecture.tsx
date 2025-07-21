'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExitLectureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExit: () => void;
  lectureId: string;
}

/**
 * 退出演讲对话框组件
 */
export default function ExitLectureDialog({
  open,
  onOpenChange,
  onExit,
  lectureId,
}: ExitLectureProps) {
  const [loading, setLoading] = useState(false);

  const handleExit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/participation/${lectureId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('成功退出演讲');
        onExit();
        onOpenChange(false);
      } else {
        toast.error(result.message || '退出演讲失败');
      }
    } catch (error) {
      console.error('Failed to exit lecture:', error);
      toast.error('网络请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>退出演讲</DialogTitle>
        </DialogHeader>
        <p>确定要退出当前演讲吗？</p>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            取消
          </Button>
          <Button disabled={loading} onClick={handleExit} variant="destructive">
            {loading ? '正在退出...' : '确认退出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
