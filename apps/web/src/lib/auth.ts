import { auth } from '@repo/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * 获取服务端会话（不会抛出异常）
 */
export const getServerSideSession = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

/**
 * 获取会话并确保用户已登录
 * 如果未登录会自动重定向到登录页
 */
export const requireAuth = async () => {
  const session = await getServerSideSession();

  if (!session) {
    redirect('/?auth=required');
  }

  return session;
};
