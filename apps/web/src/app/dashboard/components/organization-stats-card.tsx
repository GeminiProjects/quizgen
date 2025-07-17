import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  _count?: {
    lectures: number;
  };
}

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
    },
    {
      title: '总演讲数',
      value: totalLectures,
      description: '组织内的所有演讲',
    },
    {
      title: '平均演讲数',
      value: avgLecturesPerOrg,
      description: '每个组织的平均演讲数',
    },
    {
      title: '本月新建',
      value: thisMonthCount,
      description: '过去30天创建的组织',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stat.value}</div>
            <p className="mt-1 text-muted-foreground text-xs">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
