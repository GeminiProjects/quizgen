import { Card, CardContent } from '@repo/ui/components/card';
import { UserPlus } from 'lucide-react';
import type { Metadata } from 'next';
import { getParticipatedLectures } from '@/app/actions/participation';
import { JoinLectureDialog } from './components/join-lecture-dialog';
import { ParticipationListClient } from './participation-list-client';

export const metadata: Metadata = {
  title: '参加演讲',
};

export default async function ParticipationPage() {
  const result = await getParticipatedLectures();
  const hasParticipatedLectures = result.success && result.data.length > 0;

  if (!hasParticipatedLectures) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-2xl text-success">参加演讲</h1>
            <p className="text-muted-foreground">参与演讲互动，实时答题测验</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <UserPlus className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">暂未参与任何演讲</h3>
            <p className="my-4 text-muted-foreground text-sm">
              输入演讲码即可加入演讲，参与实时互动答题
            </p>
            <JoinLectureDialog />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-success">参加演讲</h1>
          <p className="text-muted-foreground">参与演讲互动，实时答题测验</p>
        </div>
        <JoinLectureDialog />
      </div>
      <ParticipationListClient />
    </div>
  );
}
