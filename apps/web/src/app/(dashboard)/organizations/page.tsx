import { redirect } from 'next/navigation';
import { getServerSideSession } from '@/lib/auth';
import OrganizationsContent from './content';

/**
 * 我的组织页面
 * 创建和管理演讲组织
 */
export default async function OrganizationsPage() {
  const session = await getServerSideSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="w-full">
      <OrganizationsContent />
    </div>
  );
}
