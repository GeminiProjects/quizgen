import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb';
import Link from 'next/link';
import { Fragment } from 'react';

interface BreadcrumbNavProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

/**
 * 面包屑导航组件
 * 提供页面层级导航
 */
export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList className="text-muted-foreground/70 text-xs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Fragment key={item.href || item.label}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    asChild
                    className="transition-colors hover:text-muted-foreground"
                  >
                    <Link href={item.href || '#'}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator className="text-muted-foreground/50">
                  <span className="mx-1">›</span>
                </BreadcrumbSeparator>
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
