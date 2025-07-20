'use client';

import { Badge } from '@repo/ui/components/badge';
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
  Calendar,
  Copy,
  Eye,
  EyeOff,
  Pause,
  Play,
  Plus,
  Presentation,
  Search,
  SortAsc,
  SortDesc,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import CreateLectureDialog from '@/app/(dashboard)/lectures/create-lecture-dialog';
import LectureStatsCard from '@/app/(dashboard)/lectures/stats';
import { PageTransition } from '@/components/page-transition';
import { useLectures } from '@/hooks/use-lectures';
import { lectureStatusConfig } from '@/types/lecture';

/**
 * 演讲管理标签页
 * 显示用户创建的演讲列表，支持创建、搜索、排序和查看演讲详情
 */
export default function LecturesContent() {
  const { lectures, isLoading, isValidating, error, mutate } = useLectures();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinCodes, setShowJoinCodes] = useState<Record<string, boolean>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'status'>(
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
    toast.error('获取演讲列表失败');
  }

  /**
   * 过滤和排序演讲列表
   */
  const filteredAndSortedLectures = useMemo(() => {
    // 确保 lectures 不为空
    if (!lectures) {
      return [];
    }

    let filtered = lectures;

    // 搜索过滤
    if (searchQuery) {
      filtered = lectures.filter(
        (lecture) =>
          lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lecture.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'title':
          compareValue = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'created_at':
          compareValue =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'status': {
          // 按状态优先级排序: in_progress > paused > not_started > ended
          const statusOrder = {
            in_progress: 0,
            paused: 1,
            not_started: 2,
            ended: 3,
          };
          compareValue = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        default:
          compareValue = 0;
          break;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [lectures, searchQuery, sortBy, sortOrder]);

  /**
   * 切换加入码显示状态
   */
  const toggleJoinCodeVisibility = (lectureId: string) => {
    setShowJoinCodes((prev) => ({ ...prev, [lectureId]: !prev[lectureId] }));
  };

  /**
   * 复制加入码到剪贴板
   */
  const copyJoinCode = async (joinCode: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success('加入码已复制');
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

  /**
   * 格式化相对时间
   */
  const formatRelativeTime = (dateStr: string) => {
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
    <PageTransition>
      <div className="space-y-6">
        {/* 页面头部 - 标题和操作按钮在同一行 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-2xl">我的演讲</h1>
            <p className="text-muted-foreground">管理您创建的演讲会话</p>
          </div>
          <Button
            disabled={isValidating}
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            创建演讲
          </Button>
        </div>

        {/* 演讲统计 */}
        {lectures && lectures.length > 0 && (
          <LectureStatsCard lectures={lectures} />
        )}

        {/* 搜索和排序控件 */}
        {lectures && lectures.length > 0 && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索演讲标题或描述..."
                value={searchQuery}
              />
            </div>
            <div className="flex gap-2">
              <Select
                onValueChange={(value) =>
                  setSortBy(value as 'title' | 'created_at' | 'status')
                }
                value={sortBy}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">创建时间</SelectItem>
                  <SelectItem value="title">标题</SelectItem>
                  <SelectItem value="status">状态</SelectItem>
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

        {/* 演讲列表 */}
        {filteredAndSortedLectures.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Presentation className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">
                {searchQuery ? '没有找到匹配的演讲' : '还没有创建任何演讲'}
              </h3>
              <p className="mb-4 text-center text-muted-foreground">
                {searchQuery
                  ? '尝试使用其他关键词搜索'
                  : '创建您的第一场演讲，开始智能测验之旅！'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建演讲
                </Button>
              )}
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
                  {/* 统计信息 */}
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

                  {/* 加入码 */}
                  <div className="relative z-20 flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <Input
                        className="h-8 pr-20 font-mono text-xs"
                        onClick={(e) => e.stopPropagation()}
                        readOnly
                        type={showJoinCodes[lecture.id] ? 'text' : 'password'}
                        value={lecture.join_code}
                      />
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1">
                      <Button
                        className="h-6 w-6 p-0"
                        disabled={isValidating}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleJoinCodeVisibility(lecture.id);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        {showJoinCodes[lecture.id] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        className="h-6 w-6 p-0"
                        disabled={isValidating}
                        onClick={(e) => copyJoinCode(lecture.join_code, e)}
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

        {/* 创建演讲对话框 */}
        <CreateLectureDialog
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            mutate();
            setShowCreateDialog(false);
          }}
          open={showCreateDialog}
        />
      </div>
    </PageTransition>
  );
}
