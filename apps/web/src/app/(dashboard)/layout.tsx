import { BottomNav } from '@/components/navigation/bottom-nav';
import { TopNav } from '@/components/navigation/top-nav';
import { requireAuth } from '@/lib/auth';

// 强制动态渲染，因为所有 dashboard 页面都需要认证
export const dynamic = 'force-dynamic';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 统一在布局中进行认证检查
  await requireAuth();
  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶部导航栏 - 固定高度，减少空间占用 */}
      <TopNav />

      {/* 主内容区域 - 自适应剩余空间 */}
      <main className="flex-1">
        {/* 移除了原有的 max-w-7xl 限制，改为在具体页面中控制 */}
        <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </div>
      </main>

      {/* 底部导航栏 - 仅在移动端显示 */}
      <BottomNav className="md:hidden" />
    </div>
  );
}
