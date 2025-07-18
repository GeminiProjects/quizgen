'use client';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Building2, Sparkles, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const iconMap = {
  Users,
  Sparkles,
  Building2,
} as const;

const colorClasses = {
  success: {
    text: 'text-success',
    bg: 'bg-success/10',
  },
  info: {
    text: 'text-info',
    bg: 'bg-info/10',
  },
  warning: {
    text: 'text-warning',
    bg: 'bg-warning/10',
  },
};

interface TopNavLinkProps {
  href: string;
  iconName: keyof typeof iconMap;
  label: string;
  color: 'success' | 'info' | 'warning';
}

export function TopNavLink({ href, iconName, label, color }: TopNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  const Icon = iconMap[iconName];
  const { text: textClass, bg: bgClass } = colorClasses[color];

  return (
    <Link href={href}>
      <Button
        className={cn('h-8 gap-2', isActive && bgClass, isActive && textClass)}
        size="sm"
        variant={isActive ? 'secondary' : 'ghost'}
      >
        <Icon className={cn('h-3.5 w-3.5', isActive && textClass)} />
        <span className="hidden lg:inline-block">{label}</span>
      </Button>
    </Link>
  );
}
