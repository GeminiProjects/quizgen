'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { ScrollArea } from '@repo/ui/components/scroll-area';
import { cn } from '@repo/ui/lib/utils';
import { Building2, Check, Lock, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { usePublicOrganizations } from '@/hooks/use-public-organizations';

interface OrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 高级组织选择器组件
 * 显示所有公开组织的详细信息，支持搜索和选择
 */
export function OrganizationSelector({
  value,
  onChange,
  disabled,
  className,
}: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // 获取公开组织列表
  const { organizations, isLoading } = usePublicOrganizations({
    search,
    limit: 50, // 一次加载更多以减少分页
  });

  // 查找当前选中的组织
  const selectedOrg = organizations.find((org) => org.id === value);

  return (
    <>
      <Button
        className={cn('w-full justify-start', className)}
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
        variant="outline"
      >
        {selectedOrg ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{selectedOrg.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>选择组织（可选）</span>
          </div>
        )}
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>选择组织</DialogTitle>
            <DialogDescription>
              选择一个组织来关联您的演讲。只显示设置了密码的公开组织。
            </DialogDescription>
          </DialogHeader>

          <Command className="rounded-lg border shadow-md">
            <CommandInput
              onValueChange={setSearch}
              placeholder="搜索组织名称或描述..."
              value={search}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>加载中...</CommandEmpty>
              ) : organizations.length === 0 ? (
                <CommandEmpty>没有找到组织</CommandEmpty>
              ) : (
                <ScrollArea className="h-[400px]">
                  <CommandGroup>
                    {organizations.map((org) => (
                      <CommandItem
                        className="cursor-pointer p-3"
                        key={org.id}
                        onSelect={() => {
                          onChange(org.id);
                          setOpen(false);
                        }}
                        value={org.id}
                      >
                        <div className="flex w-full items-start gap-4">
                          {/* 创建者头像 */}
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarImage
                              alt={org.owner.name || org.owner.email}
                              src={org.owner.image || undefined}
                            />
                            <AvatarFallback className="text-lg">
                              {(org.owner.name || org.owner.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* 组织信息 */}
                          <div className="min-w-0 flex-1 space-y-2">
                            {/* 组织名称和选中标记 */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base leading-tight">
                                  {org.name}
                                </h4>
                                {/* 组织描述 */}
                                {org.description && (
                                  <p className="mt-1 line-clamp-2 text-muted-foreground text-sm leading-relaxed">
                                    {org.description}
                                  </p>
                                )}
                              </div>
                              {value === org.id && (
                                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                              )}
                            </div>

                            {/* 底部信息 */}
                            <div className="flex items-center justify-between gap-2">
                              {/* 创建者信息 */}
                              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Users className="h-3.5 w-3.5" />
                                <span className="font-medium">
                                  {org.owner.name || 'Anonymous'}
                                </span>
                                <span className="text-xs">
                                  {org.owner.email.slice(0, 22)}
                                </span>
                              </div>

                              {/* 需要密码标签 */}
                              <Badge
                                className="gap-1 text-xs"
                                variant="outline"
                              >
                                <Lock className="h-3 w-3" />
                                需要密码
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
