'use client';

import type { Lecture } from '@repo/db';
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
import { Textarea } from '@repo/ui/components/textarea';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useLectureActions } from '@/hooks/use-lectures';

interface EditLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lecture: Lecture;
}

/**
 * 编辑演讲对话框
 * 支持编辑演讲的基本信息
 */
export default function EditLectureDialog({
  open,
  onOpenChange,
  onSuccess,
  lecture,
}: EditLectureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: lecture.title,
    description: lecture.description || '',
    starts_at: new Date(lecture.starts_at).toISOString().slice(0, 16),
  });
  const { updateLecture } = useLectureActions();

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('请输入演讲标题');
      return;
    }

    if (!formData.starts_at) {
      toast.error('请选择开始时间');
      return;
    }

    setLoading(true);

    try {
      await updateLecture(lecture.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        starts_at: formData.starts_at,
      });

      toast.success('演讲更新成功');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新演讲失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑演讲信息</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">演讲标题 *</Label>
            <Input
              id="title"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="请输入演讲标题"
              required
              value={formData.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">演讲描述</Label>
            <Textarea
              id="description"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="请输入演讲描述（可选）"
              rows={3}
              value={formData.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="starts_at">开始时间 *</Label>
            <div className="relative">
              <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                disabled={lecture.status !== 'not_started'}
                id="starts_at"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    starts_at: e.target.value,
                  }))
                }
                required
                type="datetime-local"
                value={formData.starts_at}
              />
            </div>
            {lecture.status !== 'not_started' && (
              <p className="text-muted-foreground text-sm">
                演讲已开始，无法修改开始时间
              </p>
            )}
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
              {loading ? '更新中...' : '更新演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
