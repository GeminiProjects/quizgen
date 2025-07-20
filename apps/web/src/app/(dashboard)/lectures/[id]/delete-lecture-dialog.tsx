'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteLecture } from '@/app/actions/lectures';

interface DeleteLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  lectureId: string;
  lectureTitle: string;
}

/**
 * 删除演讲确认对话框
 * 确保用户了解删除操作的后果
 */
export default function DeleteLectureDialog({
  open,
  onOpenChange,
  onSuccess,
  lectureId,
  lectureTitle,
}: DeleteLectureDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /**
   * 处理删除操作
   */
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteLecture(lectureId);
      toast.success('演讲已删除');

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/lectures');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确定要删除演讲吗？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                您即将删除演讲「
                <span className="font-medium text-foreground">
                  {lectureTitle}
                </span>
                」。
              </p>

              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="mb-2 font-medium text-foreground text-sm">
                  此操作将永久删除：
                </p>
                <ul className="space-y-1 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                    演讲的所有基本信息
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                    所有参与者记录
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                    所有测验题目和答题记录
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                    所有转录内容和材料
                  </li>
                </ul>
              </div>

              <p className="font-semibold text-amber-800 text-sm dark:text-amber-200">
                此操作无法撤销！
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? '删除中...' : '确认删除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
