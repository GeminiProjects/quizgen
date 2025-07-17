import { redirect } from 'next/navigation';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import Logo from '@/components/logo';
import { getServerSideSession } from '@/lib/auth';
import UserStatus from './components/user-status';
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
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* 面包屑导航 */}
        <div className="mb-6">
          <BreadcrumbNav items={[{ label: '控制台', href: '/dashboard' }]} />
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Logo className="h-10 w-10 md:h-12 md:w-12" />
            <div className="min-w-0 flex-1">
              <h1 className="mb-1 truncate font-bold text-2xl sm:mb-2 sm:text-3xl">
                QuizGen
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                欢迎回来，{session.user.name}！管理您的演讲、组织和参与活动。
              </p>
            </div>
          </div>
          <div className="hidden flex-shrink-0 self-start sm:self-center md:block">
            <UserStatus session={session} />
          </div>
        </div>

        <DashboardTabs session={session} />
      </div>
    </div>
  );
}
