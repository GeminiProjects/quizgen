import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织统计卡片骨架屏组件
 * 用于在数据加载时显示占位内容
 */
export function OrganizationStatsCardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 模拟 4 个统计卡片 */}
      {Array.from({ length: 4 }).map(() => (
        <div
          className="relative overflow-hidden rounded-lg border bg-card p-6"
          key={Math.random()}
        >
          {/* 图标和标题行 */}
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* 统计数值 */}
          <div className="mt-4">
            <Skeleton className="h-8 w-16" />
          </div>

          {/* 百分比变化 */}
          <div className="mt-2">
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}
