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
import { Textarea } from '@repo/ui/components/textarea';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateLecture } from '@/app/actions/lectures';

interface EditLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  lecture: {
    id: string;
    title: string;
    description: string | null;
    starts_at: string | Date;
  };
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
        starts_at: new Date(formData.starts_at).toISOString(),
      });

      toast.success('演讲信息更新成功');
      onSuccess();
      onOpenChange(false);
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
          <DialogTitle>编辑演讲</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">演讲标题</Label>
            <Input
              autoFocus
              disabled={loading}
              id="title"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="输入演讲标题"
              value={formData.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">演讲描述（可选）</Label>
            <Textarea
              disabled={loading}
              id="description"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="输入演讲描述"
              rows={3}
              value={formData.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="starts_at">开始时间</Label>
            <div className="relative">
              <Calendar className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                disabled={loading}
                id="starts_at"
                onChange={(e) =>
                  setFormData({ ...formData, starts_at: e.target.value })
                }
                type="datetime-local"
                value={formData.starts_at}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={loading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={loading} type="submit">
              保存更改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
