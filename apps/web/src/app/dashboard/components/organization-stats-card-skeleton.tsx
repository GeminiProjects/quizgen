import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织统计卡片骨架屏
 * 用于组织统计数据加载时的占位显示
 */
export default function OrganizationStatsCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
