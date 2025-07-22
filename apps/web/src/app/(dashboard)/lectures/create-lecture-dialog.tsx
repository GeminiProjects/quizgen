'use client';

import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import { Textarea } from '@repo/ui/components/textarea';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createLecture } from '@/app/actions/lectures';
import { getPublicOrganizations } from '@/app/actions/organizations';
import { OrganizationSelector } from '@/components/organization-selector';
import type { Organization } from '@/types';

interface CreateLectureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * 创建演讲对话框
 * 支持创建新的演讲，可选择组织
 */
export default function CreateLectureDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateLectureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTime, setSelectedTime] = useState(
    new Date()
      .toTimeString()
      .slice(0, 5) // 默认当前时间，格式 HH:mm
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedOrgName, setSelectedOrgName] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    org_password: '',
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      org_password: '',
    });
    setSelectedDate(new Date());
    setSelectedTime(new Date().toTimeString().slice(0, 5));
    setSelectedOrgId('');
    setSelectedOrgName('');
  }, []);

  // 关闭对话框时重置表单
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  // 加载公开组织列表
  useEffect(() => {
    const loadOrganizations = async () => {
      const result = await getPublicOrganizations();
      if (result.success) {
        setOrganizations(result.data);
      }
    };
    loadOrganizations();
  }, []);

  // 验证表单
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('请输入演讲标题');
      return false;
    }
    if (!selectedDate) {
      toast.error('请选择开始日期');
      return false;
    }
    if (!selectedTime) {
      toast.error('请选择开始时间');
      return false;
    }
    if (selectedOrgId && !formData.org_password.trim()) {
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
      // 组合日期和时间
      const [hours, minutes] = selectedTime.split(':');
      if (!selectedDate) {
        return;
      }
      const startsAt = new Date(selectedDate);
      startsAt.setHours(
        Number.parseInt(hours, 10),
        Number.parseInt(minutes, 10),
        0,
        0
      );

      const _result = await createLecture({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        org_id: selectedOrgId || null,
        org_password: selectedOrgId ? formData.org_password.trim() : null,
        starts_at: startsAt.toISOString(),
      });

      toast.success('演讲创建成功');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建演讲失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
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

          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-picker">开始日期 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="w-[200px] justify-between font-normal"
                    id="date-picker"
                    variant="outline"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {selectedDate
                        ? selectedDate.toLocaleDateString('zh-CN')
                        : '选择日期'}
                    </span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    initialFocus
                    mode="single"
                    onSelect={setSelectedDate}
                    selected={selectedDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-picker">开始时间 *</Label>
              <Input
                className="w-[150px]"
                id="time-picker"
                onChange={(e) => setSelectedTime(e.target.value)}
                type="time"
                value={selectedTime}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>所属组织</Label>
            <OrganizationSelector
              onChange={(orgId: string) => {
                setSelectedOrgId(orgId);
                // 根据ID查找组织名称
                const org = organizations?.find(
                  (o: Organization) => o.id === orgId
                );
                setSelectedOrgName(org?.name || '');
                // 选择组织后清空密码
                setFormData((prev) => ({ ...prev, org_password: '' }));
              }}
              value={selectedOrgId}
            />
            {selectedOrgName && (
              <p className="text-muted-foreground text-sm">
                已选择: {selectedOrgName}
              </p>
            )}
            {!selectedOrgName && (
              <p className="text-muted-foreground text-sm">
                将演讲关联到组织，方便统一管理（可选）
              </p>
            )}
          </div>

          {selectedOrgId && (
            <div className="space-y-2">
              <Label htmlFor="org_password">组织密码 *</Label>
              <Input
                id="org_password"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    org_password: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="请输入组织密码"
                required
                type="password"
                value={formData.org_password}
              />
              <p className="text-muted-foreground text-sm">
                需要输入组织密码才能将演讲加入该组织
              </p>
            </div>
          )}

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
