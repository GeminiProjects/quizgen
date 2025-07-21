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
import { Skeleton } from '@repo/ui/components/skeleton';
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  LogIn,
  MessageSquare,
  Play,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { type Lecture, lectureStatusConfig } from '@/types';
import JoinLectureDialog from './join-lecture-dialog';

// 定义参与演讲类型，兼容 API 返回的 owner_name、joined_at 字段
interface Participation extends Lecture {
  owner_name?: string;
  joined_at?: string;
}

// 获取参与演讲数据
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ParticipationPage() {
  const { data, error, isValidating, mutate } = useSWR(
    '/api/participation',
    fetcher
  );
  const participations: Participation[] = data?.success ? data.data : [];
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 页面获得焦点时刷新数据
  useEffect(() => {
    const handleFocus = () => {
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
  useEffect(() => {
    if (error) {
      toast.error('获取参与记录失败');
    }
  }, [error]);

  // 过滤演讲列表
  const filteredParticipations =
    participations?.filter(
      (p) =>
        (p.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase() || '').includes(
          searchQuery.toLowerCase()
        ) ||
        (p.owner_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ) || [];

  // 格式化相对时间
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

  // 骨架屏
  if (isValidating && !participations) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="mb-2 h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="mb-1 h-5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="mb-3 h-4 w-32" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl">参加演讲</h1>
          <p className="text-muted-foreground">查看您参与的演讲和测评</p>
        </div>
        <Button onClick={() => setShowJoinDialog(true)}>
          <LogIn className="mr-2 h-4 w-4" />
          加入演讲
        </Button>
      </div>
      {participations && participations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">参与演讲</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{participations.length}</div>
              <p className="text-muted-foreground text-xs">累计参与的演讲数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">进行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {
                  participations.filter((p) => p.status === 'in_progress')
                    .length
                }
              </div>
              <p className="text-muted-foreground text-xs">正在进行的演讲</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-sm">测验题目</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                {participations.reduce(
                  (sum, p) => sum + (p._count?.quiz_items || 0),
                  0
                )}
              </div>
              <p className="text-muted-foreground text-xs">可参与的测验总数</p>
            </CardContent>
          </Card>
        </div>
      )}
      {participations && participations.length > 0 && (
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索演讲标题、描述或演讲者..."
            value={searchQuery}
          />
        </div>
      )}
      {filteredParticipations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">
              {searchQuery ? '没有找到匹配的演讲' : '还没有参与任何演讲'}
            </h3>
            <p className="mb-4 text-center text-muted-foreground">
              {searchQuery
                ? '尝试使用其他关键词搜索'
                : '输入演讲码加入您的第一场演讲！'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowJoinDialog(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                加入演讲
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredParticipations.map((p) => (
            <Card
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
              key={p.id}
            >
              <Link
                className="absolute inset-0 z-10"
                href={`/lectures/${p.id}`}
              >
                <span className="sr-only">查看{p.title}详情</span>
              </Link>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <span className="truncate">{p.title}</span>
                      <Badge
                        className={lectureStatusConfig[p.status]?.className}
                        variant={lectureStatusConfig[p.status]?.variant}
                      >
                        {lectureStatusConfig[p.status]?.label}
                      </Badge>
                      <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                    </CardTitle>
                    <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                      {p.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                    {p.status === 'in_progress' ? (
                      <Play className="h-4 w-4" />
                    ) : p.status === 'ended' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3 text-muted-foreground text-sm">
                  <span>演讲者：{p.owner_name || '未知'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{p._count?.quiz_items || 0} 道题</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatRelativeTime(p.joined_at || '')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <JoinLectureDialog
        onOpenChange={setShowJoinDialog}
        onSuccess={() => {
          mutate();
        }}
        open={showJoinDialog}
      />
    </div>
  );
}
