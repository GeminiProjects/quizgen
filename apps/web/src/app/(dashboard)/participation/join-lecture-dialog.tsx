'use client';

import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { joinLectureByCode } from '@/app/actions/participation';

interface JoinLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * 加入演讲对话框
 * 用户输入演讲码即可加入
 */
export default function JoinLectureDialog({
  open,
  onOpenChange,
  onSuccess,
}: JoinLectureDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joinCode, setJoinCode] = useState('');

  // 重置表单
  const resetForm = useCallback(() => {
    setJoinCode('');
  }, []);

  // 关闭对话框时重置表单
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // 提交加入
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toast.error('请输入演讲码');
      return;
    }

    startTransition(async () => {
      try {
        const result = await joinLectureByCode({ join_code: joinCode.trim() });

        if (result.already_joined) {
          toast.info('您已经加入过这个演讲了');
        } else {
          toast.success('成功加入演讲');
        }

        onSuccess();
        onOpenChange(false);

        // 跳转到演讲详情页
        router.push(`/participation/${result.id}`);
      } catch (error) {
        toast.error((error as Error)?.message || '加入演讲失败');
      }
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>加入演讲</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="join_code">演讲码 *</Label>
            <Input
              autoFocus
              disabled={isPending}
              id="join_code"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="请输入演讲码"
              required
              value={joinCode}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? '加入中...' : '加入演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
