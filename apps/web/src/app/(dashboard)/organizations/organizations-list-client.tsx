'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { ArrowRight, Building2, Calendar, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrganizations } from '@/app/actions/organizations';
import type { FilterGroup } from '@/components/ui/list-filters';
import { ListFilters } from '@/components/ui/list-filters';
import { ListSearch } from '@/components/ui/list-search';
import { ListSort, type SortOption } from '@/components/ui/list-sort';
import { useListPreferences } from '@/hooks/use-local-storage';
import type { Organization } from '@/types';
import OrganizationPasswordField from './password-field';
import OrganizationStatsCard from './stats';

const filterGroups: FilterGroup[] = [
  {
    id: 'size',
    label: '组织规模',
    options: [
      { value: 'small', label: '小型 (1-10人)' },
      { value: 'medium', label: '中型 (11-50人)' },
      { value: 'large', label: '大型 (50人以上)' },
    ],
    multiple: false,
  },
  {
    id: 'time',
    label: '创建时间',
    options: [
      { value: 'today', label: '今天' },
      { value: 'week', label: '本周' },
      { value: 'month', label: '本月' },
      { value: 'year', label: '今年' },
    ],
    multiple: false,
  },
];

const sortOptions: SortOption[] = [
  { field: 'created_at', label: '创建时间' },
  { field: 'name', label: '组织名称' },
  { field: 'lectures', label: '演讲数量' },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return '今天';
  }
  if (diffInHours < 48) {
    return '昨天';
  }
  if (diffInHours < 168) {
    return `${Math.floor(diffInHours / 24)}天前`;
  }

  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
  });
}

export function OrganizationsListClient() {
  const { preferences, updatePreferences } =
    useListPreferences('organizations');
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载所有数据（只在初始加载时获取）
  const loadOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrganizations({});
      if (result.success && result.data) {
        setAllOrganizations(result.data.data);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  // 客户端过滤和排序
  const filteredAndSortedOrganizations = useMemo(() => {
    let filtered = [...allOrganizations];

    // 搜索过滤（搜索组织名称和描述）
    if (preferences.search) {
      const searchLower = preferences.search.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(searchLower) ||
          org.description?.toLowerCase().includes(searchLower)
      );
    }

    // 规模筛选
    if (preferences.filters?.size) {
      filtered = filtered.filter((org) => {
        const memberCount = org._count?.lectures || 0;
        switch (preferences.filters?.size) {
          case 'small':
            return memberCount <= 10;
          case 'medium':
            return memberCount > 10 && memberCount <= 50;
          case 'large':
            return memberCount > 50;
          default:
            return true;
        }
      });
    }

    // 时间筛选
    if (preferences.filters?.time) {
      filtered = filtered.filter((org) => {
        const createdAt = new Date(org.created_at);
        const now = new Date();
        const diffDays =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

        switch (preferences.filters?.time) {
          case 'today':
            return diffDays <= 1;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'year':
            return diffDays <= 365;
          default:
            return true;
        }
      });
    }

    // 排序
    if (preferences.sort) {
      filtered.sort((a, b) => {
        const sort = preferences.sort;
        if (!sort) {
          return 0;
        }
        const { field, direction } = sort;
        let aValue: number | string;
        let bValue: number | string;

        switch (field) {
          case 'lectures':
            aValue = a._count?.lectures || 0;
            bValue = b._count?.lectures || 0;
            break;
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue);
        const bStr = String(bValue);
        return direction === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [allOrganizations, preferences]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (
    allOrganizations.length === 0 &&
    !preferences.search &&
    !preferences.filters?.size &&
    !preferences.filters?.time
  ) {
    return null; // 由父组件处理空状态
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 统计卡片 */}
      <OrganizationStatsCard organizations={allOrganizations} />

      {/* 搜索、筛选、排序工具栏 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ListSearch
          className="flex-1"
          onChange={(search) => updatePreferences({ search })}
          placeholder="搜索组织名称或描述..."
          value={preferences.search || ''}
        />
        <div className="flex gap-2">
          <ListFilters
            groups={filterGroups}
            onChange={(filters) => updatePreferences({ filters })}
            values={preferences.filters || {}}
          />
          <ListSort
            onChange={(sort) => updatePreferences({ sort })}
            options={sortOptions}
            value={preferences.sort}
          />
        </div>
      </div>

      {/* 组织列表 */}
      {filteredAndSortedOrganizations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">没有找到匹配的组织</p>
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
                href={`/organizations/${org.id}`}
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
                      {org.description || '暂时没有描述。'}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{org._count?.lectures || 0} 演讲</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(org.created_at)}</span>
                  </div>
                </div>

                <OrganizationPasswordField
                  orgId={org.id}
                  password={org.password}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 加载骨架屏组件
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...new Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 搜索栏骨架 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Skeleton className="h-10 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* 列表骨架 */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[...new Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="mb-2 h-5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
