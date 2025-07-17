import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

interface ParticipationRecord {
  id: string;
  lecture_id: string;
  lecture_title: string;
  quiz_attempts: number;
  correct_answers: number;
  accuracy_rate: number;
  joined_at: string;
}

interface ParticipationStatsCardProps {
  records: ParticipationRecord[];
}

/**
 * 参与统计卡片
 * 显示用户参与演讲的统计信息
 */
export default function ParticipationStatsCard({
  records,
}: ParticipationStatsCardProps) {
  // 计算统计数据
  const totalParticipations = records.length;
  const totalQuizAttempts = records.reduce(
    (sum, record) => sum + record.quiz_attempts,
    0
  );
  const totalCorrectAnswers = records.reduce(
    (sum, record) => sum + record.correct_answers,
    0
  );
  const overallAccuracy =
    totalQuizAttempts > 0
      ? Math.round((totalCorrectAnswers / totalQuizAttempts) * 100)
      : 0;

  // 计算本周参与的演讲数量
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeekCount = records.filter(
    (r) => new Date(r.joined_at) >= weekAgo
  ).length;

  const stats = [
    {
      title: '参与演讲数',
      value: totalParticipations,
      description: '您参与的演讲总数',
    },
    {
      title: '答题总数',
      value: totalQuizAttempts,
      description: '所有演讲的答题次数',
    },
    {
      title: '正确答案',
      value: totalCorrectAnswers,
      description: '答对的题目数量',
    },
    {
      title: '平均准确率',
      value: `${overallAccuracy}%`,
      description: '总体答题准确率',
    },
    {
      title: '本周参与',
      value: thisWeekCount,
      description: '过去7天参与的演讲',
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
