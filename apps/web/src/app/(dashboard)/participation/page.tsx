import { Card, CardContent } from '@repo/ui/components/card';
import { Activity, FileQuestion, UserPlus } from 'lucide-react';
import { getParticipatedLectures } from '@/app/actions/participation';
import { JoinLectureDialog } from './components/join-lecture-dialog';
import { ParticipatedLectureCard } from './components/participated-lecture-card';

export default async function ParticipationPage() {
  const result = await getParticipatedLectures();
  const participatedLectures = result.success ? result.data : [];

  // 计算总体统计
  const totalStats = participatedLectures.reduce(
    (acc, item) => ({
      totalQuizzes: acc.totalQuizzes + item.stats.totalQuizzes,
      answeredQuizzes: acc.answeredQuizzes + item.stats.answeredQuizzes,
      correctAnswers: acc.correctAnswers + item.stats.correctAnswers,
    }),
    { totalQuizzes: 0, answeredQuizzes: 0, correctAnswers: 0 }
  );

  const overallCorrectRate =
    totalStats.answeredQuizzes > 0
      ? Math.round(
          (totalStats.correctAnswers / totalStats.answeredQuizzes) * 100
        )
      : 0;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">我的参与</h1>
          <p className="text-muted-foreground">参与演讲互动，实时答题测验</p>
        </div>
        <JoinLectureDialog />
      </div>

      {participatedLectures.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  参与演讲
                </p>
                <p className="font-bold text-2xl">
                  {participatedLectures.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <FileQuestion className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  已答题目
                </p>
                <p className="font-bold text-2xl">
                  {totalStats.answeredQuizzes}/{totalStats.totalQuizzes}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  整体正确率
                </p>
                <p className="font-bold text-2xl">{overallCorrectRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {participatedLectures.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">暂未参与任何演讲</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              输入演讲码即可加入演讲，参与实时互动答题
            </p>
            <JoinLectureDialog />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {participatedLectures.map((item) => (
            <ParticipatedLectureCard
              key={item.participant.id}
              lecture={item.lecture}
              participant={item.participant}
              stats={item.stats}
            />
          ))}
        </div>
      )}
    </div>
  );
}
