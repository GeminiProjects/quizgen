/**
 * API 测试辅助函数
 */

import type { db as drizzleDB } from '@repo/db';
import { type NewUser, users } from '@repo/db/schema';

/**
 * 创建测试用户
 */
export const createTestUser = async (
  db: typeof drizzleDB,
  userData?: Partial<NewUser>
) => {
  const testUser: NewUser = {
    id: userData?.id || `test-user-${Date.now()}`,
    email: userData?.email || `test-${Date.now()}@example.com`,
    name: userData?.name || '测试用户',
    emailVerified: userData?.emailVerified ?? false,
  };

  const [user] = await db.insert(users).values(testUser).returning();
  return user;
};

/**
 * 创建认证 Headers
 * 模拟已登录用户的请求头
 */
export const createAuthHeaders = (userId: string) => {
  // 创建模拟的 session
  const mockSession = {
    user: { id: userId },
    session: {
      id: `session-${Date.now()}`,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
    },
  };

  // 返回包含认证信息的 headers
  return {
    'Content-Type': 'application/json',
    'x-test-user-id': userId, // 测试环境用的标识
    'x-test-session': JSON.stringify(mockSession),
  };
};

/**
 * 创建 Next.js 请求对象
 */
export const createMockRequest = (
  method: string,
  url: string,
  options?: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
) => {
  const { body, searchParams = {} } = options || {};
  const requestHeaders = options?.headers || {};

  // 构建完整的 URL
  const fullUrl = new URL(url, 'http://localhost:3000');
  for (const [key, value] of Object.entries(searchParams)) {
    fullUrl.searchParams.append(key, value);
  }

  return new Request(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...requestHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
};

/**
 * 获取测试环境的认证 session
 * 在测试环境中模拟 Better Auth 的 session
 */
export const getMockSession = (request: Request) => {
  const testUserId = request.headers.get('x-test-user-id');
  const testSession = request.headers.get('x-test-session');

  if (testUserId && testSession) {
    return JSON.parse(testSession);
  }

  return null;
};

/**
 * 清理数据库
 * 按照外键依赖顺序删除数据
 */
export const cleanupDB = async (db: typeof drizzleDB) => {
  const {
    attempts,
    quizItems,
    transcripts,
    materials,
    lectures,
    organizations,
  } = await import('@repo/db/schema');

  // 按照外键依赖顺序删除数据
  await db.delete(attempts);
  await db.delete(quizItems);
  await db.delete(transcripts);
  await db.delete(materials);
  await db.delete(lectures);
  await db.delete(organizations);
  await db.delete(users);
};

/**
 * 断言响应状态码
 */
export const assertResponseStatus = (
  response: Response,
  expectedStatus: number
) => {
  if (response.status !== expectedStatus) {
    throw new Error(
      `期望状态码 ${expectedStatus}，实际状态码 ${response.status}`
    );
  }
};

/**
 * 断言响应包含错误
 */
export const assertErrorResponse = async (
  response: Response,
  expectedCode?: string
) => {
  const data = await response.json();

  if (!data.error) {
    throw new Error('响应中没有错误信息');
  }

  if (expectedCode && data.error.code !== expectedCode) {
    throw new Error(
      `期望错误码 ${expectedCode}，实际错误码 ${data.error.code}`
    );
  }

  return data.error;
};
