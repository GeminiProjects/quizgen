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
import { useState } from 'react';
import { toast } from 'sonner';
import { useOrganizationActions } from '@/hooks/use-organizations';
import type { Organization } from '@/types/organization';

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (organization: Organization) => void;
}

/**
 * 创建组织对话框
 * 支持创建新的组织
 */
export default function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    password: '',
  });
  const { createOrganization } = useOrganizationActions();

  // 生成随机密码
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 18; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  // 表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入组织名称');
      return;
    }

    if (!formData.password.trim()) {
      toast.error('请输入组织密码');
      return;
    }

    if (formData.password.length < 4) {
      toast.error('密码至少需要4个字符');
      return;
    }

    setLoading(true);

    try {
      const result = await createOrganization({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        password: formData.password.trim(),
      });

      toast.success('组织创建成功');
      onSuccess(result.data);
      // 重置表单
      setFormData({
        name: '',
        description: '',
        password: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建组织失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新组织</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">组织名称 *</Label>
            <Input
              id="name"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入组织名称"
              required
              value={formData.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">组织描述</Label>
            <Textarea
              id="description"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="请输入组织描述（可选）"
              rows={3}
              value={formData.description}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">组织密码 *</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                id="password"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    password: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="请输入组织密码"
                required
                value={formData.password}
              />
              <Button
                className="whitespace-nowrap"
                onClick={generatePassword}
                type="button"
                variant="outline"
              >
                随机生成
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              演讲者创建演讲时需要输入此密码才能加入组织
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
              {loading ? '创建中...' : '创建组织'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
