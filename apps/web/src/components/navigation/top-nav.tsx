import Link from 'next/link';
import Logo from '@/components/logo';
import UserStatus from '@/components/user-status';
import { getServerSideSession } from '@/lib/auth';
import { TopNavLink } from './top-nav-link';

const navItems = [
  {
    id: 'participation',
    label: '参与记录',
    iconName: 'Users' as const,
    href: '/participation',
    color: 'success' as const,
  },
  {
    id: 'lectures',
    label: '我的演讲',
    iconName: 'Sparkles' as const,
    href: '/lectures',
    color: 'info' as const,
  },
  {
    id: 'organizations',
    label: '我的组织',
    iconName: 'Building2' as const,
    href: '/organizations',
    color: 'warning' as const,
  },
];

export async function TopNav() {
  const session = await getServerSideSession();

  if (!session?.user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo 和产品名 */}
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2" href="/">
              <Logo height={24} width={24} />
              <span className="hidden font-semibold sm:inline-block">
                QuizGen
              </span>
            </Link>

            {/* 导航项 - 桌面端 */}
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <TopNavLink
                  color={item.color}
                  href={item.href}
                  iconName={item.iconName}
                  key={item.id}
                  label={item.label}
                />
              ))}
            </nav>
          </div>

          {/* 右侧菜单 */}
          <div className="flex items-center gap-2">
            {/* 用户菜单 */}
            <UserStatus session={session} size="sm" />
          </div>
        </div>
      </div>
    </header>
  );
}
