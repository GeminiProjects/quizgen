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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteOrganization } from '@/app/actions/organizations';

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  onSuccess?: () => void;
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
  const router = useRouter();
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
      await deleteOrganization(organizationId);

      toast.success('组织已删除');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/organizations');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 关闭对话框时重置状态
   */
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setConfirmText('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            删除组织
          </DialogTitle>
          <DialogDescription>
            此操作不可撤销。删除组织会同时删除所有相关的演讲数据。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm">
              请输入组织名称 <strong>{organizationName}</strong> 以确认删除
            </Label>
            <Input
              autoComplete="off"
              disabled={loading}
              id="confirm"
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="输入组织名称"
              value={confirmText}
            />
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">
              <strong>警告：</strong>
              删除组织将同时删除所有关联的演讲、测验题目、参与记录等数据。
            </p>
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
