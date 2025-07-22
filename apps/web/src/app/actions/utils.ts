import { revalidatePath } from 'next/cache';
import type { ActionResult } from '@/types';

/**
 * 统一的 Server Action 错误处理函数
 * @param error - 捕获的错误对象
 * @returns 格式化的错误响应
 */
export function handleActionError(error: unknown): ActionResult<never> {
  console.error('Server Action 错误:', error);

  // 处理已知的错误类型
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // 处理未知错误
  return {
    success: false,
    error: '操作失败，请稍后重试',
  };
}

// 类型辅助：将 Date 类型转换为 string
export type SerializeDate<T> = T extends Date
  ? string
  : T extends object
    ? // biome-ignore lint/suspicious/noExplicitAny: 就用 any
      T extends any[]
      ? SerializeDate<T[number]>[]
      : { [K in keyof T]: SerializeDate<T[K]> }
    : T;

/**
 * 递归序列化对象中的所有 Date 类型为 ISO 字符串
 * @param obj - 需要序列化的对象
 * @returns 序列化后的对象
 */
export function serializeDates<T>(obj: T): SerializeDate<T> {
  if (obj === null || obj === undefined) {
    return obj as SerializeDate<T>;
  }

  if (obj instanceof Date) {
    return obj.toISOString() as SerializeDate<T>;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDates(item)) as SerializeDate<T>;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDates(value);
    }
    return serialized as SerializeDate<T>;
  }

  return obj as SerializeDate<T>;
}

/**
 * 创建分页查询的通用参数
 * @param params - 分页参数
 * @returns 标准化的分页参数
 */
export function createPaginationParams(params?: {
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.min(100, Math.max(1, params?.limit ?? 50));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * 构建分页响应数据
 * @param data - 数据列表
 * @param total - 总数
 * @param page - 当前页
 * @param limit - 每页数量
 * @returns 包含分页信息的响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

/**
 * 批量重验证多个路径
 * @param paths - 需要重验证的路径数组
 */
export function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * 生成成功的 Action 响应
 * @param data - 响应数据
 * @returns 成功的响应对象
 */
export function createSuccessResponse<T>(
  data: T
): ActionResult<SerializeDate<T>> {
  return {
    success: true,
    data: serializeDates(data),
  };
}

/**
 * 生成失败的 Action 响应
 * @param error - 错误信息
 * @returns 失败的响应对象
 */
export function createErrorResponse(error: string): ActionResult<never> {
  return {
    success: false,
    error,
  };
}

/**
 * 验证必填字段
 * @param data - 需要验证的对象
 * @param fields - 必填字段列表
 * @throws 如果缺少必填字段则抛出错误
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  fields: string[]
): void {
  const missingFields = fields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
  }
}

/**
 * 安全地执行数据库事务
 * @param fn - 事务函数
 * @returns 事务执行结果
 */
export async function withTransaction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<SerializeDate<T>>> {
  try {
    const result = await fn();
    return createSuccessResponse(result);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * 生成唯一标识符（用于重试逻辑）
 * @param prefix - 前缀
 * @param generator - 生成函数
 * @param validator - 验证函数
 * @param maxRetries - 最大重试次数
 * @returns 生成的唯一标识符
 */
export async function generateUniqueId(
  prefix: string,
  generator: () => string,
  validator: (id: string) => Promise<boolean>,
  maxRetries = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const id = generator();
    const isValid = await validator(id);

    if (isValid) {
      return id;
    }
  }

  throw new Error(`生成${prefix}失败，请重试`);
}

/**
 * 格式化数据库计数结果
 * @param count - 计数结果对象或数字
 * @returns 格式化后的数字
 */
export function formatCount(count: { count: number } | number): number {
  return typeof count === 'number' ? count : count.count;
}

/**
 * 检查用户是否拥有指定资源
 * @param resourceOwnerId - 资源所有者ID
 * @param userId - 当前用户ID
 * @param resourceName - 资源名称（用于错误提示）
 * @throws 如果用户不是资源所有者则抛出错误
 */
export function assertOwnership(
  resourceOwnerId: string,
  userId: string,
  resourceName = '资源'
): void {
  if (resourceOwnerId !== userId) {
    throw new Error(`您没有权限操作此${resourceName}`);
  }
}

/**
 * 创建条件数组的辅助函数
 * @param baseCondition - 基础条件
 * @param additionalConditions - 额外条件数组
 * @returns 过滤后的有效条件数组
 */
export function buildConditions<T>(
  baseCondition: T,
  additionalConditions: (T | undefined)[]
): T[] {
  const conditions = [baseCondition];

  for (const condition of additionalConditions) {
    if (condition !== undefined) {
      conditions.push(condition);
    }
  }

  return conditions;
}

/**
 * 处理可选的日期字符串转换
 * @param dateString - 日期字符串
 * @returns Date 对象或 undefined
 */
export function parseOptionalDate(dateString?: string): Date | undefined {
  return dateString ? new Date(dateString) : undefined;
}

/**
 * 批量序列化日期字段
 * @param items - 需要序列化的对象数组
 * @param dateFields - 日期字段名称数组
 * @returns 序列化后的对象数组
 */
export function serializeDateFields<T extends Record<string, unknown>>(
  items: T[],
  dateFields: (keyof T)[]
): T[] {
  return items.map((item) => {
    const serialized = { ...item };

    for (const field of dateFields) {
      const value = item[field];
      if (value instanceof Date) {
        serialized[field] = value.toISOString() as T[keyof T];
      } else if (value === null || value === undefined) {
        serialized[field] = value as T[keyof T];
      }
    }

    return serialized;
  });
}

/**
 * 延迟执行（用于模拟异步操作或防抖）
 * @param ms - 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 安全地获取环境变量
 * @param key - 环境变量键名
 * @param defaultValue - 默认值
 * @returns 环境变量值或默认值
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];

  if (!(value || defaultValue)) {
    throw new Error(`缺少必需的环境变量: ${key}`);
  }

  return value || defaultValue || '';
}
