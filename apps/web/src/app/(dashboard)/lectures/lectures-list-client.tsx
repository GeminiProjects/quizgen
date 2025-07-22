'use client';

import { Badge } from '@repo/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  ArrowRight,
  Calendar,
  Pause,
  Play,
  Presentation,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLectures } from '@/app/actions/lectures';
import type { FilterGroup } from '@/components/ui/list-filters';
import { ListFilters } from '@/components/ui/list-filters';
import { ListSearch } from '@/components/ui/list-search';
import { ListSort, type SortOption } from '@/components/ui/list-sort';
import { useListPreferences } from '@/hooks/use-local-storage';
import type { Lecture } from '@/types';
import { lectureStatusConfig } from '@/types';
import JoinCodeField from './join-code-field';
import LectureStatsCard from './stats';

const filterGroups: FilterGroup[] = [
  {
    id: 'status',
    label: '演讲状态',
    options: [
      { value: 'in_progress', label: '进行中' },
      { value: 'not_started', label: '未开始' },
      { value: 'paused', label: '已暂停' },
      { value: 'ended', label: '已结束' },
    ],
    multiple: false,
  },
];

const sortOptions: SortOption[] = [
  { field: 'created_at', label: '创建时间' },
  { field: 'updated_at', label: '更新时间' },
  { field: 'participants', label: '参与人数' },
  { field: 'title', label: '标题' },
];

function formatRelativeTime(dateStr: string) {
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

export function LecturesListClient() {
  const { preferences, updatePreferences } = useListPreferences('lectures');
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载所有数据（只在初始加载时获取）
  const loadLectures = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLectures({});
      if (result.success && result.data) {
        setAllLectures(result.data.data);
      }
    } catch (error) {
      console.error('Failed to load lectures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLectures();
  }, [loadLectures]);

  // 客户端过滤和排序
  const filteredAndSortedLectures = useMemo(() => {
    let filtered = [...allLectures];

    // 搜索过滤（搜索标题和描述）
    if (preferences.search) {
      const searchLower = preferences.search.toLowerCase();
      filtered = filtered.filter(
        (lecture) =>
          lecture.title.toLowerCase().includes(searchLower) ||
          lecture.description?.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (preferences.filters?.status) {
      filtered = filtered.filter(
        (lecture) => lecture.status === preferences.filters?.status
      );
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
          case 'participants':
            aValue = a._count?.participants || 0;
            bValue = b._count?.participants || 0;
            break;
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'created_at':
          case 'updated_at':
            aValue = new Date(a[field as keyof Lecture] as string).getTime();
            bValue = new Date(b[field as keyof Lecture] as string).getTime();
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
  }, [allLectures, preferences]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (
    allLectures.length === 0 &&
    !preferences.search &&
    !preferences.filters?.status
  ) {
    return null; // 由父组件处理空状态
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 统计卡片 */}
      <LectureStatsCard lectures={allLectures} />

      {/* 搜索、筛选、排序工具栏 */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ListSearch
          className="flex-1"
          onChange={(search) => updatePreferences({ search })}
          placeholder="搜索演讲标题或描述..."
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

      {/* 演讲列表 */}
      {filteredAndSortedLectures.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Presentation className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">没有找到匹配的演讲</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedLectures.map((lecture) => (
            <Card
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
              key={lecture.id}
            >
              <Link
                className="absolute inset-0 z-10"
                href={`/lectures/${lecture.id}`}
              >
                <span className="sr-only">查看{lecture.title}详情</span>
              </Link>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="truncate">{lecture.title}</span>
                      <Badge
                        className={
                          lectureStatusConfig[lecture.status].className
                        }
                        variant={lectureStatusConfig[lecture.status].variant}
                      >
                        {lectureStatusConfig[lecture.status].label}
                      </Badge>
                      <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                      {lecture.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {lecture.status === 'in_progress' ? (
                      <Play className="h-4 w-4" />
                    ) : lecture.status === 'paused' ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Presentation className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{lecture._count?.participants || 0} 参与者</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatRelativeTime(lecture.created_at)}</span>
                  </div>
                </div>

                <JoinCodeField
                  joinCode={lecture.join_code}
                  lectureId={lecture.id}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
