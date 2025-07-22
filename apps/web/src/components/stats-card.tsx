import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

/**
 * 通用统计卡片组件
 * 用于展示统计数据的卡片
 */
export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
}: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-muted-foreground text-sm">{title}</p>
          <div className="font-semibold text-2xl tabular-nums">{value}</div>
          {description && (
            <p className="truncate text-muted-foreground text-xs">
              {description}
            </p>
          )}
        </div>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground/50" />
      </div>
    </div>
  );
}
