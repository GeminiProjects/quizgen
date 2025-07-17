'use client';

import type { SessionResponse } from '@repo/auth';
import { Tabs, TabsContent } from '@repo/ui/components/tabs';
import { Mic, Presentation, Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BottomNav } from './components/bottom-nav';
import LecturesTab from './tabs/lectures-tab';
import OrganizationsTab from './tabs/organizations-tab';
import ParticipationTab from './tabs/participation-tab';

interface DashboardTabsProps {
  session: SessionResponse;
}

/**
 * Dashboard 标签页组件
 * 根据用户角色展示不同的管理功能
 */
export default function DashboardTabs({ session }: DashboardTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 从 URL 参数中获取初始标签页，默认为 'participation'
  const initialTab = searchParams.get('tab') || 'participation';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabsLoaded, setTabsLoaded] = useState({
    participation: false,
    lectures: false,
    organizations: false,
  });

  // 更新 URL 参数
  const updateTabInUrl = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  // 处理标签页切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateTabInUrl(value);
  };

  // 预加载所有标签页的数据
  useEffect(() => {
    // 标记所有标签页为已加载，让子组件开始加载数据
    setTabsLoaded({
      participation: true,
      lectures: true,
      organizations: true,
    });
  }, []);

  return (
    <>
      <div className="w-full">
        <Tabs
          className="w-full"
          onValueChange={handleTabChange}
          value={activeTab}
        >
          {/* 桌面端标签页按钮 */}
          <div className="mb-6 hidden w-full grid-cols-1 gap-4 sm:grid-cols-3 md:grid">
            <button
              className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                activeTab === 'participation'
                  ? 'border-success bg-success/10'
                  : 'hover:border-success/50'
              }`}
              onClick={() => handleTabChange('participation')}
              type="button"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Mic className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="truncate font-semibold text-sm">参与记录</h3>
                <p className="truncate text-muted-foreground text-xs">
                  查看参与的演讲和测评
                </p>
              </div>
            </button>

            <button
              className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                activeTab === 'lectures'
                  ? 'border-info bg-info/10'
                  : 'hover:border-info/50'
              }`}
              onClick={() => handleTabChange('lectures')}
              type="button"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 text-info">
                <Presentation className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="truncate font-semibold text-sm">我的演讲</h3>
                <p className="truncate text-muted-foreground text-xs">
                  管理创建的演讲会话
                </p>
              </div>
            </button>

            <button
              className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                activeTab === 'organizations'
                  ? 'border-warning bg-warning/10'
                  : 'hover:border-warning/50'
              }`}
              onClick={() => handleTabChange('organizations')}
              type="button"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <h3 className="truncate font-semibold text-sm">我的组织</h3>
                <p className="truncate text-muted-foreground text-xs">
                  创建和管理演讲组织
                </p>
              </div>
            </button>
          </div>

          <div>
            <TabsContent className="m-0" value="participation">
              {tabsLoaded.participation && <ParticipationTab />}
            </TabsContent>

            <TabsContent className="m-0" value="lectures">
              {tabsLoaded.lectures && <LecturesTab />}
            </TabsContent>

            <TabsContent className="m-0" value="organizations">
              {tabsLoaded.organizations && <OrganizationsTab />}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* 移动端底部导航栏 */}
      <BottomNav
        currentTab={activeTab}
        onTabChange={handleTabChange}
        userInfo={{
          avatar: session.user.image || undefined,
          name: session.user.name || undefined,
        }}
      />
    </>
  );
}
