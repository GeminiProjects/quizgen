import { Card, CardContent, CardHeader } from '@repo/ui/components/card';
import { Skeleton } from '@repo/ui/components/skeleton';
import { Tabs, TabsContent, TabsList } from '@repo/ui/components/tabs';

/**
 * 组织详情页面骨架屏
 * 用于组织详情页面完整内容加载时的占位显示
 */
export default function OrganizationDetailSkeleton() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑导航 skeleton */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* 页面头部 skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="mb-2 h-8 w-48 md:h-9" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>

        {/* 统计卡片 skeleton */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 标签页 skeleton */}
        <Tabs className="space-y-6" defaultValue="info">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </TabsList>

          <TabsContent className="space-y-4" value="info">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <Skeleton className="mb-2 h-6 w-24" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <Skeleton className="mb-1 h-4 w-20" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div>
                    <Skeleton className="mb-1 h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <Skeleton className="mb-2 h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
