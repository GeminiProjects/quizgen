import { getOrganizations } from '@/app/actions/organizations';
import { OrganizationsListClient } from './organizations-list-client';
import OrganizationsPageContent from './page-content';

export const metadata = {
  title: '我的组织',
};

export default async function OrganizationsPage() {
  // 初始加载时检查是否有组织
  const result = await getOrganizations({ limit: 1 });
  const hasOrganizations =
    result.success && result.data && result.data.total > 0;

  if (!hasOrganizations) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-2xl text-warning">我的组织</h1>
            <p className="text-muted-foreground">创建和管理演讲组织</p>
          </div>
        </div>
        <OrganizationsPageContent hasOrganizations={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-warning">我的组织</h1>
          <p className="text-muted-foreground">创建和管理演讲组织</p>
        </div>
        <OrganizationsPageContent hasOrganizations={true} />
      </div>
      <OrganizationsListClient />
    </div>
  );
}
