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
import { useState } from 'react';
import { toast } from 'sonner';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  join_code: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
}

interface JoinLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (lecture: Lecture) => void;
}

/**
 * 加入演讲对话框
 * 通过演讲码加入演讲
 */
export default function JoinLectureDialog({
  open,
  onOpenChange,
  onSuccess,
}: JoinLectureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!joinCode.trim()) {
      toast.error('请输入演讲码');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lectures/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          join_code: joinCode.trim().toUpperCase(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('成功加入演讲');
        onSuccess(result.data);
        // 重置表单
        setJoinCode('');
      } else {
        toast.error(result.message || '加入演讲失败');
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>加入演讲</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="join_code">演讲码 *</Label>
            <Input
              className="text-center font-mono text-lg"
              id="join_code"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="请输入演讲码（如：ABC123）"
              required
              value={joinCode}
            />
            <p className="text-muted-foreground text-sm">
              请向演讲者获取演讲码，通常由6位字母和数字组成
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={loading} type="submit">
              {loading ? '加入中...' : '加入演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
