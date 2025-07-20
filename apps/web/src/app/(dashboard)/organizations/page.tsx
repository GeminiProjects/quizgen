import { requireAuth } from '@/lib/auth';
import OrganizationsContent from './content';

/**
 * 我的组织页面
 * 创建和管理演讲组织
 */
export default async function OrganizationsPage() {
  await requireAuth();

  return (
    <div className="w-full">
      <OrganizationsContent />
    </div>
  );
}
