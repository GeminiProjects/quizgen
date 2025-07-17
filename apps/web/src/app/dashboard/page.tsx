import { auth } from '@repo/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import ComponentUser from './component-user';

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/');
  }

  return (
    <div>
      <ComponentUser session={session} />
    </div>
  );
}
