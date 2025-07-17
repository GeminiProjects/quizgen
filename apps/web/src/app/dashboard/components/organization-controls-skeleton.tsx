import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织控件骨架屏组件
 * 用于搜索和排序控件的加载状态
 */
export function OrganizationControlsSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 搜索框 */}
      <div className="max-w-md flex-1">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 排序选择器 */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
