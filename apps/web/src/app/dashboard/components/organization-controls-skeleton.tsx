import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 组织控件骨架屏
 * 用于搜索框和排序控件加载时的占位显示
 */
export default function OrganizationControlsSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-[140px] rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  );
}
