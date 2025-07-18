import { redirect } from 'next/navigation';
import { getServerSideSession } from '@/lib/auth';
import ParticipationContent from './content';

/**
 * 参与记录页面
 * 查看用户参与的演讲和测评
 */
export default async function ParticipationPage() {
  const session = await getServerSideSession();

  if (!session) {
    redirect('/');
  }

  return (
    <div className="w-full">
      <ParticipationContent />
    </div>
  );
}
