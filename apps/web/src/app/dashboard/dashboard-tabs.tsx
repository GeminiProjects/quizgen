'use client';

import type { SessionResponse } from '@repo/auth';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { Mic, Presentation, Users } from 'lucide-react';
import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('lectures');

  return (
    <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger className="flex items-center gap-2" value="lectures">
          <Presentation className="h-4 w-4" />
          我的演讲
        </TabsTrigger>
        <TabsTrigger className="flex items-center gap-2" value="organizations">
          <Users className="h-4 w-4" />
          我的组织
        </TabsTrigger>
        <TabsTrigger className="flex items-center gap-2" value="participation">
          <Mic className="h-4 w-4" />
          参与记录
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-6" value="lectures">
        <LecturesTab session={session} />
      </TabsContent>

      <TabsContent className="mt-6" value="organizations">
        <OrganizationsTab session={session} />
      </TabsContent>

      <TabsContent className="mt-6" value="participation">
        <ParticipationTab session={session} />
      </TabsContent>
    </Tabs>
  );
}
