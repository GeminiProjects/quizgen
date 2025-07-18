import { redirect } from 'next/navigation';
import { getServerSideSession } from '@/lib/auth';
import LecturesContent from './content';

/**
 * 我的演讲页面
 * 管理用户创建的演讲会话
 */
export default async function LecturesPage() {
  const session = await getServerSideSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="w-full">
      <LecturesContent />
    </div>
  );
}
