import { getLectures } from '@/app/actions/lectures';
import { LecturesListClient } from './lectures-list-client';
import LecturesPageContent from './page-content';

export const metadata = {
  title: '我的演讲',
};

export default async function LecturesPage() {
  // 初始加载时检查是否有演讲
  const result = await getLectures({ limit: 1 });
  const hasLectures = result.success && result.data && result.data.total > 0;

  if (!hasLectures) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-2xl text-info">我的演讲</h1>
            <p className="text-muted-foreground">管理您创建的演讲会话</p>
          </div>
        </div>
        <LecturesPageContent hasLectures={false} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-2xl text-info">我的演讲</h1>
          <p className="text-muted-foreground">管理您创建的演讲会话</p>
        </div>
        <LecturesPageContent hasLectures={true} />
      </div>
      <LecturesListClient />
    </div>
  );
}
