import { MessageSquare, Presentation, TrendingUp, Users } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import type { Lecture } from '@/types';

interface LectureStatsCardProps {
  lectures: Lecture[];
}

/**
 * 演讲统计卡片
 * 显示演讲相关的统计信息
 */
export default function LectureStatsCard({ lectures }: LectureStatsCardProps) {
  // 计算统计数据
  const totalLectures = lectures.length;

  // 计算进行中的演讲数
  const activeLectures = lectures.filter(
    (lecture) => lecture.status === 'in_progress'
  ).length;

  // 计算总参与人数
  const totalParticipants = lectures.reduce(
    (sum, lecture) => sum + (lecture._count?.participants || 0),
    0
  );

  // 计算总题目数
  const totalQuizItems = lectures.reduce(
    (sum, lecture) => sum + (lecture._count?.quiz_items || 0),
    0
  );

  // 计算本月创建的演讲数
  const thisMonth = new Date();
  const monthlyLectures = lectures.filter((lecture) => {
    const createdAt = new Date(lecture.created_at);
    return (
      createdAt.getMonth() === thisMonth.getMonth() &&
      createdAt.getFullYear() === thisMonth.getFullYear()
    );
  }).length;

  // 计算平均参与人数
  const avgParticipants =
    totalLectures > 0 ? Math.round(totalParticipants / totalLectures) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        description={
          activeLectures > 0 ? `${activeLectures} 进行中` : '演讲总数'
        }
        icon={Presentation}
        title="演讲总数"
        value={totalLectures}
      />

      <StatsCard
        description="本月创建"
        icon={TrendingUp}
        title="本月创建"
        value={monthlyLectures}
      />

      <StatsCard
        description={`平均 ${avgParticipants} 人/场`}
        icon={Users}
        title="参与人数"
        value={totalParticipants}
      />

      <StatsCard
        description="测验题目"
        icon={MessageSquare}
        title="测验题目"
        value={totalQuizItems}
      />
    </div>
  );
}
