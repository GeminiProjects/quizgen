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
import { Textarea } from '@repo/ui/components/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

/**
 * 组织更新表单验证
 */
const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, '组织名称不能为空')
    .max(100, '组织名称不能超过100个字符'),
  description: z.string().max(500, '组织描述不能超过500个字符').optional(),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(50, '密码不能超过50个字符'),
});

interface Organization {
  id: string;
  name: string;
  description: string | null;
  password: string;
}

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization;
  onSuccess: () => void;
}

/**
 * 编辑组织对话框
 */
export default function EditOrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || '',
    password: organization.password,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * 生成随机密码
   */
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 18; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password }));
  };

  /**
   * 验证表单数据
   */
  const validateFormData = () => {
    try {
      updateOrganizationSchema.parse(formData);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        }
        setErrors(newErrors);
      }
      return false;
    }
  };

  /**
   * 更新组织信息
   */
  const updateOrganization = async () => {
    const response = await fetch(`/api/organizations/${organization.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '更新失败');
    }

    return result;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateFormData()) {
      return;
    }

    setLoading(true);

    try {
      await updateOrganization();
      toast.success('组织信息已更新');
      onSuccess();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(
        error instanceof Error ? error.message : '更新失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>编辑组织信息</DialogTitle>
            <DialogDescription>修改组织的基本信息和访问密码</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">组织名称</Label>
              <Input
                disabled={loading}
                id="name"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="输入组织名称"
                value={formData.name}
              />
              {errors.name && (
                <p className="text-destructive text-sm">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">组织描述（可选）</Label>
              <Textarea
                disabled={loading}
                id="description"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="输入组织描述"
                rows={3}
                value={formData.description}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">组织密码</Label>
              <div className="flex gap-2">
                <Input
                  className="font-mono"
                  disabled={loading}
                  id="password"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="输入组织密码"
                  value={formData.password}
                />
                <Button
                  disabled={loading}
                  onClick={generatePassword}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                演讲者需要此密码才能在该组织下创建演讲
              </p>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password}</p>
              )}
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
