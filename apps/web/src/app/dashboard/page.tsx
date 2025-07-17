import { redirect } from 'next/navigation';
import { getServerSideSession } from '@/lib/auth';
import DashboardTabs from './dashboard-tabs';

/**
 * Dashboard 主页面
 * 支持三种用户角色：组织者、演讲者、听众
 */
export default async function Dashboard() {
  const session = await getServerSideSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">演讲管理控制台</h1>
        <p className="text-muted-foreground">
          欢迎回来，{session.user.name}！管理您的演讲、组织和参与活动。
        </p>
      </div>

      <DashboardTabs session={session} />
    </div>
  );
}
