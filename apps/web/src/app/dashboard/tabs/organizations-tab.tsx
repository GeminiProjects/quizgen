'use client';

import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  ArrowRight,
  Building2,
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Presentation,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useOrganizations } from '@/hooks/use-organizations';
import OrganizationStatsCard from '../components/organization-stats-card';
import CreateOrganizationDialog from '../dialogs/create-organization-dialog';

/**
 * 组织管理标签页
 * 显示用户创建的组织列表，支持创建、搜索、排序和查看组织详情
 */
export default function OrganizationsTab() {
  const { organizations, isLoading, error, mutate } = useOrganizations();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'lectures'>(
    'created_at'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 页面获得焦点时刷新数据，避免从其他页面返回后看到过期数据
  useEffect(() => {
    const handleFocus = () => {
      // 仅在页面可见时刷新
      if (document.visibilityState === 'visible') {
        mutate();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [mutate]);

  // 错误处理
  if (error) {
    toast.error('获取组织列表失败');
  }

  /**
   * 过滤和排序组织列表
   */
  const filteredAndSortedOrganizations = useMemo(() => {
    // 确保 organizations 不为空
    if (!organizations) {
      return [];
    }

    let filtered = organizations;

    // 搜索过滤
    if (searchQuery) {
      filtered = organizations.filter(
        (org) =>
          org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          org.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'created_at':
          compareValue =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'lectures':
          // TODO: 需要 API 支持返回演讲数量
          compareValue = 0;
          break;
        default:
          compareValue = 0;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [organizations, searchQuery, sortBy, sortOrder]);

  /**
   * 切换密码显示状态
   */
  const togglePasswordVisibility = (orgId: string) => {
    setShowPasswords((prev) => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  // 创建组织成功后的回调
  const handleOrganizationCreated = () => {
    // 刷新组织列表
    mutate();
    setShowCreateDialog(false);
    toast.success('组织创建成功');
  };

  /**
   * 复制密码到剪贴板
   */
  const copyPassword = async (password: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(password);
      toast.success('密码已复制');
    } catch (_error) {
      toast.error('复制失败');
    }
  };

  /**
   * 切换排序顺序
   */
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl text-warning">我的组织</h2>
          <p className="text-muted-foreground">
            管理您创建的组织，查看组织内演讲活动
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          创建组织
        </Button>
      </div>

      {/* 组织统计 */}
      {organizations && organizations.length > 0 && (
        <OrganizationStatsCard organizations={organizations} />
      )}

      {/* 搜索和排序控件 */}
      {organizations && organizations.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索组织名称或描述..."
              value={searchQuery}
            />
          </div>
          <div className="flex gap-2">
            <Select
              onValueChange={(value) =>
                setSortBy(value as 'name' | 'created_at' | 'lectures')
              }
              value={sortBy}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">创建时间</SelectItem>
                <SelectItem value="name">名称</SelectItem>
                <SelectItem value="lectures">演讲数量</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={toggleSortOrder} size="icon" variant="outline">
              {sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* 组织列表 */}
      {filteredAndSortedOrganizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">
              {searchQuery ? '没有找到匹配的组织' : '还没有创建任何组织'}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {searchQuery
                ? '尝试使用其他关键词搜索'
                : '创建您的第一个组织，开始管理系列演讲活动！'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                创建组织
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedOrganizations.map((org) => (
            <Card
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
              key={org.id}
            >
              <Link
                className="absolute inset-0 z-10"
                href={`/organization/${org.id}`}
              >
                <span className="sr-only">查看{org.name}详情</span>
              </Link>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="truncate">{org.name}</span>
                      <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                      {org.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* 统计信息 */}
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Presentation className="h-3.5 w-3.5" />
                    <span>演讲管理</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(org.created_at).toLocaleDateString('zh-CN', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* 组织密码 */}
                <div className="relative z-20 flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <Input
                      className="h-8 pr-20 font-mono text-xs"
                      onClick={(e) => e.stopPropagation()}
                      readOnly
                      type={showPasswords[org.id] ? 'text' : 'password'}
                      value={org.password}
                    />
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePasswordVisibility(org.id);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      {showPasswords[org.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      className="h-6 w-6 p-0"
                      onClick={(e) => copyPassword(org.password, e)}
                      size="sm"
                      variant="ghost"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 创建组织对话框 */}
      <CreateOrganizationDialog
        onOpenChange={setShowCreateDialog}
        onSuccess={handleOrganizationCreated}
        open={showCreateDialog}
      />
    </div>
  );
}
