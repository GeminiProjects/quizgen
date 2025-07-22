import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ArrowRight, Building2, Calendar, Presentation } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { getOrganizations } from '@/app/actions/organizations';
import OrganizationsPageContent from './page-content';
import OrganizationPasswordField from './password-field';
import OrganizationStatsCard from './stats';

function OrganizationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function OrganizationsList() {
  const result = await getOrganizations();

  if (!(result.success && result.data) || result.data.data.length === 0) {
    return <OrganizationsPageContent hasOrganizations={false} />;
  }

  const organizations = result.data.data;

  return (
    <>
      <OrganizationStatsCard organizations={organizations} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {organizations.map((org) => (
          <Card
            className="group relative overflow-hidden transition-all duration-200 hover:shadow-md"
            key={org.id}
          >
            <Link
              className="absolute inset-0 z-10"
              href={`/organizations/${org.id}`}
            >
              <span className="sr-only">查看{org.name}详情</span>
            </Link>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="truncate">{org.name}</span>
                    <ArrowRight className="-translate-x-1 h-3.5 w-3.5 flex-shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                    {org.description || '暂时没有描述。'}
                  </CardDescription>
                </div>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Presentation className="h-3.5 w-3.5" />
                  <span>演讲管理</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(org.created_at).toLocaleDateString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <OrganizationPasswordField
                orgId={org.id}
                password={org.password}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-warning">我的组织</h1>
          <p className="text-muted-foreground">创建和管理演讲组织</p>
        </div>
        <OrganizationsPageContent hasOrganizations={true} searchQuery="" />
      </div>

      <Suspense fallback={<OrganizationsSkeleton />}>
        <OrganizationsList />
      </Suspense>
    </div>
  );
}
