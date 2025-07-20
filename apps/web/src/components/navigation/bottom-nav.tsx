'use client';

import { cn } from '@repo/ui/lib/utils';
import { Building2, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 导航项配置 - 按照顺序：参与、演讲、组织
const navItems = [
  {
    id: 'participation',
    label: '听众',
    icon: Users,
    href: '/participation',
    color: 'success' as const,
    apiEndpoint: '/api/participation',
  },
  {
    id: 'lectures',
    label: '演讲',
    icon: Sparkles,
    href: '/lectures',
    color: 'info' as const,
    apiEndpoint: '/api/lectures',
  },
  {
    id: 'organizations',
    label: '组织',
    icon: Building2,
    href: '/organizations',
    color: 'warning' as const,
    apiEndpoint: '/api/organizations',
  },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  // 获取当前激活的导航项
  const activeNav = navItems.find((item) => pathname.startsWith(item.href))?.id;

  return (
    <nav
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50 border-t bg-background',
        className
      )}
    >
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const colorClass = `text-${item.color}`;

          return (
            <Link
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors',
                isActive
                  ? colorClass
                  : 'text-muted-foreground hover:text-foreground'
              )}
              href={item.href}
              key={item.id}
              prefetch={false}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-colors',
                  isActive && colorClass
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
