/**
 * Better Auth API 路由
 * 处理所有认证相关的 API 请求
 */
import { auth } from '@repo/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// 导出 GET 和 POST 处理程序
export const { GET, POST } = toNextJsHandler(auth);
