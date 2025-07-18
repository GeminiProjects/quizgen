import { auth } from '@repo/auth';
import { headers } from 'next/headers';

export const getServerSideSession = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
};
