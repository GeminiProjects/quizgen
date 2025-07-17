import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织卡片骨架屏组件
 * 用于组织列表中单个组织卡片的加载状态
 */
export function OrganizationCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card p-6 transition-all">
      {/* 标题和图标 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>

      {/* 描述文本 */}
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* 创建时间 */}
      <Skeleton className="mb-4 h-3 w-40" />

      {/* 密码输入框和按钮 */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}
