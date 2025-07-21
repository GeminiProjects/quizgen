import { Building2, Calendar, LayoutGrid, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import type { Organization } from '@/types';

interface OrganizationStatsCardProps {
  organizations: Organization[];
}

/**
 * 组织统计卡片
 * 显示组织的基本统计信息
 */
export default function OrganizationStatsCard({
  organizations,
}: OrganizationStatsCardProps) {
  // 计算统计数据
  const totalOrganizations = organizations.length;
  const totalLectures = organizations.reduce(
    (sum, org) => sum + (org._count?.lectures || 0),
    0
  );
  const avgLecturesPerOrg =
    totalOrganizations > 0 ? Math.round(totalLectures / totalOrganizations) : 0;

  // 计算本月创建的组织数量
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  const thisMonthCount = organizations.filter(
    (o) => new Date(o.created_at) >= monthAgo
  ).length;

  const stats = [
    {
      title: '总组织数',
      value: totalOrganizations,
      description: '您创建的所有组织',
      icon: Building2,
    },
    {
      title: '总演讲数',
      value: totalLectures,
      description: '组织内的所有演讲',
      icon: LayoutGrid,
    },
    {
      title: '平均演讲数',
      value: avgLecturesPerOrg,
      description: '每个组织的平均演讲数',
      icon: TrendingUp,
    },
    {
      title: '本月新建',
      value: thisMonthCount,
      description: '过去30天创建的组织',
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard
          description={stat.description}
          icon={stat.icon}
          key={stat.title}
          title={stat.title}
          value={stat.value}
        />
      ))}
    </div>
  );
}
