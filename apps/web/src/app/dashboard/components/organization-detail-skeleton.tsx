import { Skeleton } from '@repo/ui/components/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';

/**
 * 组织详情页骨架屏组件
 * 用于组织详情页面的完整加载状态
 */
export function OrganizationDetailSkeleton() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Skeleton className="h-4 w-16" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* 头部信息 */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="mb-2 h-8 w-64" />
                  <Skeleton className="h-5 w-48" />
                </div>
              </div>
              <Skeleton className="mb-2 h-4 w-full max-w-2xl" />
              <Skeleton className="h-4 w-3/4 max-w-2xl" />
            </div>
            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map(() => (
            <div
              className="relative overflow-hidden rounded-lg border bg-card p-6"
              key={Math.random()}
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* 标签页 */}
        <Tabs className="space-y-6" defaultValue="lectures">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lectures">演讲会话</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
            <TabsTrigger value="settings">组织设置</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="lectures">
            {/* 搜索和过滤栏 */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Skeleton className="h-10 flex-1" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            {/* 演讲列表 */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map(() => (
                <div
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                  key={Math.random()}
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-9 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
