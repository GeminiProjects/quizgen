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
import { updateOrganization } from '@/app/actions/organizations';
import type { Organization } from '@/types';

/**
 * 组织更新表单验证
 */
const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, '组织名称不能为空')
    .max(100, '组织名称不能超过100个字符'),
  description: z.string().max(500, '组织描述不能超过500个字符').optional(),
});

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      await updateOrganization(organization.id, {
        name: formData.name,
        description: formData.description || undefined,
      });

      toast.success('组织信息更新成功');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑组织信息</DialogTitle>
          <DialogDescription>
            更新组织的基本信息。密码无法修改，请妥善保管。
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">组织名称</Label>
            <Input
              autoComplete="off"
              disabled={loading}
              id="name"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
                setFormData({ ...formData, description: e.target.value })
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
                disabled
                id="password"
                readOnly
                type="text"
                value={organization.password}
              />
              <Button
                className="shrink-0"
                disabled
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                不可修改
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              密码创建后无法修改，请妥善保管
            </p>
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
