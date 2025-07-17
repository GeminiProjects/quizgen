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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { mutate } from 'swr';

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  onSuccess: () => void;
}

/**
 * 删除组织确认对话框
 */
export default function DeleteOrganizationDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  onSuccess,
}: DeleteOrganizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  /**
   * 处理删除操作
   */
  const handleDelete = async () => {
    if (confirmText !== organizationName) {
      toast.error('请输入正确的组织名称');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '删除失败');
      }

      toast.success('组织已删除');

      // 清除组织列表的 SWR 缓存
      await mutate('/api/organizations');

      onSuccess();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error(
        error instanceof Error ? error.message : '删除失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * 重置对话框状态
   */
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>删除组织</DialogTitle>
              <DialogDescription>此操作不可撤销，请谨慎操作</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
            <p className="text-sm">删除组织后：</p>
            <ul className="mt-2 space-y-1 text-muted-foreground text-sm">
              <li>• 组织信息将被永久删除</li>
              <li>• 相关演讲将保留，但不再属于任何组织</li>
              <li>• 演讲者将无法再使用组织密码创建演讲</li>
              <li>• 此操作无法撤销</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              请输入组织名称{' '}
              <span className="font-mono font-semibold">
                {organizationName}
              </span>{' '}
              以确认删除
            </Label>
            <Input
              disabled={loading}
              id="confirm"
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="输入组织名称"
              value={confirmText}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={loading}
            onClick={() => handleOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={loading || confirmText !== organizationName}
            onClick={handleDelete}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            删除组织
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
