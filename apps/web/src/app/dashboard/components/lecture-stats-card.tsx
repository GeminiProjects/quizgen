import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

interface Lecture {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'paused' | 'ended';
  starts_at: string;
  created_at: string;
}

interface LectureStatsCardProps {
  lectures: Lecture[];
}

/**
 * 演讲统计卡片
 * 显示演讲的基本统计信息
 */
export default function LectureStatsCard({ lectures }: LectureStatsCardProps) {
  // 计算统计数据
  const totalLectures = lectures.length;
  const notStartedCount = lectures.filter(
    (l) => l.status === 'not_started'
  ).length;
  const inProgressCount = lectures.filter(
    (l) => l.status === 'in_progress'
  ).length;
  const endedCount = lectures.filter((l) => l.status === 'ended').length;

  // 计算本周创建的演讲数量
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekCount = lectures.filter(
    (l) => new Date(l.created_at) >= weekAgo
  ).length;

  const stats = [
    {
      title: '总演讲数',
      value: totalLectures,
      description: '您创建的所有演讲',
    },
    {
      title: '未开始',
      value: notStartedCount,
      description: '等待开始的演讲',
    },
    {
      title: '进行中',
      value: inProgressCount,
      description: '正在进行的演讲',
    },
    {
      title: '已结束',
      value: endedCount,
      description: '已完成的演讲',
    },
    {
      title: '本周新建',
      value: thisWeekCount,
      description: '过去7天创建的演讲',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
