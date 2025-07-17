import { Skeleton } from '@repo/ui/components/skeleton';

/**
 * 演讲列表骨架屏
 * 用于演讲列表加载时的占位显示
 */
export default function LectureListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          className="group relative overflow-hidden rounded-lg border p-3 md:p-4"
          key={i}
        >
          <div className="flex items-start gap-3 md:gap-4">
            <Skeleton className="h-9 w-9 rounded-lg md:h-10 md:w-10" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-3/4 md:h-6" />
                  <Skeleton className="mt-1 h-4 w-full" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 md:mt-3 md:gap-4">
                <Skeleton className="h-3 w-20 md:h-4" />
                <Skeleton className="h-3 w-24 md:h-4" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
