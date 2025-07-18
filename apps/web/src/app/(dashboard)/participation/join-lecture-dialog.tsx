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
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface JoinLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 处理演讲码输入
   * 自动格式化为 XXXX-XXXX 格式
   */
  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // 限制最多8个字符
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    // 在第4个字符后添加连字符
    if (value.length > 4) {
      value = `${value.slice(0, 4)}-${value.slice(4)}`;
    }

    setJoinCode(value);
  };

  /**
   * 提交加入演讲
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证演讲码格式
    const cleanCode = joinCode.replace(/-/g, '');
    if (cleanCode.length !== 8) {
      toast.error('请输入完整的演讲码');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/lectures/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ join_code: joinCode }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '加入失败');
      }

      toast.success(result.message || '成功加入演讲');

      // 清空输入
      setJoinCode('');

      // 关闭对话框
      onOpenChange(false);

      // 回调成功
      onSuccess?.();

      // 跳转到演讲页面
      router.push(`/lectures/${result.data.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加入失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              加入演讲
            </DialogTitle>
            <DialogDescription>
              输入演讲码加入演讲，参与实时测验
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">演讲码</Label>
              <Input
                autoFocus
                className="text-center font-mono text-2xl tracking-widest"
                disabled={isLoading}
                id="join-code"
                maxLength={9}
                onChange={handleJoinCodeChange}
                placeholder="XXXX-XXXX"
                value={joinCode}
              />
              <p className="text-muted-foreground text-xs">
                请向演讲者索取8位演讲码
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={isLoading || joinCode.length < 9} type="submit">
              {isLoading ? '加入中...' : '加入演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
