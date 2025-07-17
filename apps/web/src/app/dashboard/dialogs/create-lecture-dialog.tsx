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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Textarea } from '@repo/ui/components/textarea';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Lecture {
  id: string;
  title: string;
  description: string | null;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  join_code: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  org_id: string | null;
}

interface Organization {
  id: string;
  name: string;
  description: string | null;
  password: string;
}

interface CreateLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (lecture: Lecture) => void;
}

/**
 * 创建演讲对话框
 * 支持创建个人演讲或组织演讲
 */
export default function CreateLectureDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateLectureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    org_id: '',
    org_password: '',
    starts_at: '',
  });

  // 获取用户创建的组织列表
  const fetchOrganizations = useCallback(async () => {
    try {
      const response = await fetch('/api/organizations');
      const result = await response.json();

      if (result.success) {
        setOrganizations(result.data.data);
      }
    } catch {
      console.error('获取组织列表失败');
    }
  }, []);

  // 对话框打开时获取组织列表
  useEffect(() => {
    if (open) {
      fetchOrganizations();
      // 设置默认的开始时间为当前时间
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData((prev) => ({
        ...prev,
        starts_at: now.toISOString().slice(0, 16),
      }));
    }
  }, [open, fetchOrganizations]);

  // 验证表单数据
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('请输入演讲标题');
      return false;
    }

    if (!formData.starts_at) {
      toast.error('请选择开始时间');
      return false;
    }

    // 如果选择了组织，必须输入组织密码
    if (formData.org_id && !formData.org_password.trim()) {
      toast.error('请输入组织密码');
      return false;
    }

    return true;
  };

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/lectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          org_id: formData.org_id || null,
          org_password: formData.org_password.trim() || null,
          starts_at: formData.starts_at,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('演讲创建成功');
        onSuccess(result.data);
        // 重置表单
        setFormData({
          title: '',
          description: '',
          org_id: '',
          org_password: '',
          starts_at: '',
        });
      } else {
        toast.error(result.message || '创建演讲失败');
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog modal={false} onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新演讲</DialogTitle>
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
            <Label htmlFor="org_id">所属组织（可选）</Label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, org_id: value }))
              }
              value={formData.org_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择组织（个人演讲可跳过）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">个人演讲</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.org_id && (
            <div className="space-y-2">
              <Label htmlFor="org_password">组织密码 *</Label>
              <Input
                id="org_password"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    org_password: e.target.value,
                  }))
                }
                placeholder="请输入组织密码"
                required
                type="password"
                value={formData.org_password}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="starts_at">开始时间 *</Label>
            <Input
              id="starts_at"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, starts_at: e.target.value }))
              }
              required
              type="datetime-local"
              value={formData.starts_at}
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
              {loading ? '创建中...' : '创建演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
