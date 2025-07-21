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
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface JoinLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (lecture: Record<string, unknown>) => void;
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
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // 重置表单
  const resetForm = useCallback(() => {
    setJoinCode('');
  }, []);

  // 关闭对话框时重置表单
  // 只要关闭就重置
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // 表单校验
  const validateForm = () => {
    if (!joinCode.trim()) {
      toast.error('请输入演讲码');
      return false;
    }
    return true;
  };

  // 提交加入
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lectures/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: joinCode.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || '加入演讲失败');
        return;
      }
      toast.success(data.message || '成功加入演讲');
      onSuccess(data.data);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error)?.message || '加入演讲失败');
    } finally {
      setLoading(false);
    }
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
              id="join_code"
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="请输入演讲码"
              required
              value={joinCode}
            />
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
