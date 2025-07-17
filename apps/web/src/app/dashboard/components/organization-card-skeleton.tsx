import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织卡片骨架屏
 * 用于组织列表中单个组织卡片加载时的占位显示
 */
export default function OrganizationCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1 h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 统计信息 skeleton */}
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {/* 密码输入框 skeleton */}
        <div className="relative">
          <Skeleton className="h-8 w-full" />
          <div className="absolute top-1 right-1 flex gap-1">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
