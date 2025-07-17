'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/components/command';
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
import { cn } from '@repo/ui/lib/utils';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  type CreateLectureData,
  type Lecture,
  useLectureActions,
} from '@/hooks/use-lectures';
import { useOrganizations } from '@/hooks/use-organizations';

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
  const { organizations, isLoading: orgsLoading } = useOrganizations();
  const { createLecture } = useLectureActions();
  const [formData, setFormData] = useState<CreateLectureData>({
    title: '',
    description: '',
    org_id: null,
    org_password: null,
    starts_at: '',
  });
  const [orgPassword, setOrgPassword] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('10:30:00');

  // 对话框打开时设置默认时间
  useEffect(() => {
    if (open) {
      // 设置默认的开始时间为明天当前时间
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow);
      const hours = tomorrow.getHours().toString().padStart(2, '0');
      const minutes = tomorrow.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}:00`);

      // 设置默认的 starts_at
      const isoString = tomorrow.toISOString();
      setFormData((prev) => ({
        ...prev,
        starts_at: isoString,
      }));
    } else {
      // 对话框关闭时重置表单
      setFormData({
        title: '',
        description: '',
        org_id: null,
        org_password: null,
        starts_at: '',
      });
      setOrgPassword('');
    }
  }, [open]);

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
    if (formData.org_id && !orgPassword.trim()) {
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
      // 准备提交的数据
      const submitData: CreateLectureData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        org_id: formData.org_id,
        org_password: formData.org_id ? orgPassword.trim() : null,
        starts_at: formData.starts_at,
      };

      const result = await createLecture(submitData);

      if (result.success) {
        toast.success('演讲创建成功');
        onSuccess(result.data);
        onOpenChange(false);
      }
    } catch (error) {
      // 错误已经在 hook 中处理，这里显示错误消息
      const errorMessage =
        error instanceof Error ? error.message : '创建演讲失败';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
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
              value={formData.description || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_id">所属组织（可选）</Label>
            <Popover onOpenChange={setOrgPickerOpen} open={orgPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="w-full justify-between font-normal"
                  id="org_id"
                  variant="outline"
                >
                  {formData.org_id ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedOrg = organizations.find(
                          (org) => org.id === formData.org_id
                        );
                        return selectedOrg?.owner ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={selectedOrg.owner.avatar_url || ''}
                              />
                              <AvatarFallback>
                                {selectedOrg.owner.email
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedOrg.name}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    '选择组织（个人演讲可跳过）'
                  )}
                  <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索组织..." />
                  <CommandList>
                    <CommandEmpty>没有找到组织</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setFormData((prev) => ({ ...prev, org_id: null }));
                          setOrgPassword('');
                          setOrgPickerOpen(false);
                        }}
                        value="personal"
                      >
                        <CheckIcon
                          className={cn(
                            'mr-2 h-4 w-4',
                            formData.org_id ? 'opacity-0' : 'opacity-100'
                          )}
                        />
                        个人演讲
                      </CommandItem>
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          onSelect={() => {
                            setFormData((prev) => ({
                              ...prev,
                              org_id: org.id,
                            }));
                            setOrgPickerOpen(false);
                          }}
                          value={`${org.name} ${org.owner?.email || ''}`}
                        >
                          <CheckIcon
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.org_id === org.id
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-1 items-center gap-2">
                            {org.owner && (
                              <>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage
                                    src={org.owner.avatar_url || ''}
                                  />
                                  <AvatarFallback>
                                    {org.owner.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-1 flex-col">
                                  <div className="font-medium">{org.name}</div>
                                  <div className="truncate text-muted-foreground text-xs">
                                    {org.owner.email}
                                  </div>
                                  {org.description && (
                                    <div className="mt-0.5 truncate text-muted-foreground text-xs">
                                      {org.description}
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {formData.org_id && (
            <div className="space-y-2">
              <Label htmlFor="org_password">组织密码 *</Label>
              <Input
                id="org_password"
                onChange={(e) => setOrgPassword(e.target.value)}
                placeholder="请输入组织密码"
                required
                type="password"
                value={orgPassword}
              />
            </div>
          )}

          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-picker">日期 *</Label>
              <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    className="w-32 justify-between font-normal"
                    id="date-picker"
                    variant="outline"
                  >
                    {date ? date.toLocaleDateString() : '选择日期'}
                    <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto overflow-hidden p-0"
                >
                  <Calendar
                    mode="single"
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      if (selectedDate && time) {
                        const [hours, minutes] = time.split(':');
                        selectedDate.setHours(
                          Number.parseInt(hours, 10),
                          Number.parseInt(minutes, 10),
                          0
                        );
                        const isoString = selectedDate.toISOString();
                        setFormData((prev) => ({
                          ...prev,
                          starts_at: isoString,
                        }));
                      }
                      setDatePickerOpen(false);
                    }}
                    selected={date}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="time-picker">时间 *</Label>
              <Input
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                id="time-picker"
                onChange={(e) => {
                  const newTime = `${e.target.value}:00`;
                  setTime(newTime);
                  if (date) {
                    const [hours, minutes] = newTime.split(':');
                    const newDate = new Date(date);
                    newDate.setHours(
                      Number.parseInt(hours, 10),
                      Number.parseInt(minutes, 10),
                      0
                    );
                    const isoString = newDate.toISOString();
                    setFormData((prev) => ({
                      ...prev,
                      starts_at: isoString,
                    }));
                  }
                }}
                step="60"
                type="time"
                value={time.slice(0, 5)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button disabled={loading || orgsLoading} type="submit">
              {loading ? '创建中...' : '创建演讲'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
