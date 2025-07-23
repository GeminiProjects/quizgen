'use client';

import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Activity, FileQuestion, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ParticipatedLectureData } from '@/app/actions/participation';
import { getParticipatedLectures } from '@/app/actions/participation';
import { StatsCard } from '@/components/stats-card';
import type { FilterGroup } from '@/components/ui/list-filters';
import { ListFilters } from '@/components/ui/list-filters';
import { ListSearch } from '@/components/ui/list-search';
import { ListSort, type SortOption } from '@/components/ui/list-sort';
import { useListPreferences } from '@/hooks/use-local-storage';
import { ParticipatedLectureCard } from './components/participated-lecture-card';

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
  {
    id: 'completion',
    label: '答题进度',
    options: [
      { value: 'completed', label: '已完成' },
      { value: 'in_progress', label: '进行中' },
      { value: 'not_started', label: '未开始' },
    ],
    multiple: false,
  },
  {
    id: 'performance',
    label: '答题表现',
    options: [
      { value: 'excellent', label: '优秀 (≥80%)' },
      { value: 'good', label: '良好 (60-79%)' },
      { value: 'needs_improvement', label: '待提高 (<60%)' },
    ],
    multiple: false,
  },
];

const sortOptions: SortOption[] = [
  { field: 'joined_at', label: '加入时间' },
  { field: 'title', label: '演讲标题' },
  { field: 'correct_rate', label: '正确率' },
  { field: 'progress', label: '答题进度' },
];

export function ParticipationListClient() {
  const { preferences, updatePreferences } =
    useListPreferences('participation');
  const [allParticipatedLectures, setAllParticipatedLectures] = useState<
    ParticipatedLectureData[]
  >([]);
  const [loading, setLoading] = useState(true);

  // 加载所有数据
  const loadParticipatedLectures = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getParticipatedLectures();
      if (result.success && result.data) {
        setAllParticipatedLectures(result.data);
      }
    } catch (error) {
      console.error('Failed to load participated lectures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipatedLectures();
  }, [loadParticipatedLectures]);

  // 客户端过滤和排序
  const filteredAndSortedLectures = useMemo(() => {
    let filtered = [...allParticipatedLectures];

    // 搜索过滤（搜索演讲标题、描述和组织名称）
    if (preferences.search) {
      const searchLower = preferences.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.lecture.title.toLowerCase().includes(searchLower) ||
          item.lecture.description?.toLowerCase().includes(searchLower) ||
          item.lecture.organization?.name.toLowerCase().includes(searchLower)
      );
    }

    // 状态过滤
    if (preferences.filters?.status) {
      filtered = filtered.filter(
        (item) => item.lecture.status === preferences.filters?.status
      );
    }

    // 答题进度过滤
    if (preferences.filters?.completion) {
      filtered = filtered.filter((item) => {
        const completionRate =
          item.stats.totalQuizzes > 0
            ? (item.stats.answeredQuizzes / item.stats.totalQuizzes) * 100
            : 0;

        switch (preferences.filters?.completion) {
          case 'completed':
            return completionRate === 100;
          case 'in_progress':
            return completionRate > 0 && completionRate < 100;
          case 'not_started':
            return completionRate === 0;
          default:
            return true;
        }
      });
    }

    // 答题表现过滤
    if (preferences.filters?.performance) {
      filtered = filtered.filter((item) => {
        if (item.stats.answeredQuizzes === 0) {
          return false;
        }

        const correctRate =
          (item.stats.correctAnswers / item.stats.answeredQuizzes) * 100;

        switch (preferences.filters?.performance) {
          case 'excellent':
            return correctRate >= 80;
          case 'good':
            return correctRate >= 60 && correctRate < 80;
          case 'needs_improvement':
            return correctRate < 60;
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
          case 'joined_at':
            aValue = new Date(a.participant.joined_at).getTime();
            bValue = new Date(b.participant.joined_at).getTime();
            break;
          case 'title':
            aValue = a.lecture.title.toLowerCase();
            bValue = b.lecture.title.toLowerCase();
            break;
          case 'correct_rate':
            aValue =
              a.stats.answeredQuizzes > 0
                ? a.stats.correctAnswers / a.stats.answeredQuizzes
                : 0;
            bValue =
              b.stats.answeredQuizzes > 0
                ? b.stats.correctAnswers / b.stats.answeredQuizzes
                : 0;
            break;
          case 'progress':
            aValue =
              a.stats.totalQuizzes > 0
                ? a.stats.answeredQuizzes / a.stats.totalQuizzes
                : 0;
            bValue =
              b.stats.totalQuizzes > 0
                ? b.stats.answeredQuizzes / b.stats.totalQuizzes
                : 0;
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
  }, [allParticipatedLectures, preferences]);

  // 计算总体统计
  const totalStats = useMemo(() => {
    return allParticipatedLectures.reduce(
      (acc, item) => ({
        totalQuizzes: acc.totalQuizzes + item.stats.totalQuizzes,
        answeredQuizzes: acc.answeredQuizzes + item.stats.answeredQuizzes,
        correctAnswers: acc.correctAnswers + item.stats.correctAnswers,
      }),
      { totalQuizzes: 0, answeredQuizzes: 0, correctAnswers: 0 }
    );
  }, [allParticipatedLectures]);

  const overallCorrectRate =
    totalStats.answeredQuizzes > 0
      ? Math.round(
          (totalStats.correctAnswers / totalStats.answeredQuizzes) * 100
        )
      : 0;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 统计卡片 */}
      {allParticipatedLectures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            description="累计参与"
            icon={Activity}
            title="参与演讲"
            value={allParticipatedLectures.length}
          />

          <StatsCard
            description={`共 ${totalStats.totalQuizzes} 题`}
            icon={FileQuestion}
            title="已答题目"
            value={totalStats.answeredQuizzes}
          />

          <StatsCard
            description={
              totalStats.answeredQuizzes > 0
                ? `答对 ${totalStats.correctAnswers} 题`
                : '暂无答题'
            }
            icon={TrendingUp}
            title="整体正确率"
            value={`${overallCorrectRate}%`}
          />

          <StatsCard
            description="平均表现"
            icon={Activity}
            title="参与度"
            value={
              totalStats.totalQuizzes > 0
                ? `${Math.round((totalStats.answeredQuizzes / totalStats.totalQuizzes) * 100)}%`
                : '0%'
            }
          />
        </div>
      )}

      {/* 搜索、筛选、排序工具栏 */}
      {allParticipatedLectures.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <ListSearch
            className="flex-1"
            onChange={(search) => updatePreferences({ search })}
            placeholder="搜索演讲标题、描述或组织..."
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
      )}

      {/* 参与演讲列表 */}
      {filteredAndSortedLectures.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedLectures.map((item) => (
            <ParticipatedLectureCard
              key={item.participant.id}
              lecture={item.lecture}
              participant={item.participant}
              stats={item.stats}
            />
          ))}
        </div>
      ) : allParticipatedLectures.length > 0 ? (
        <div className="text-center text-muted-foreground">
          没有找到匹配的演讲
        </div>
      ) : null}
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
