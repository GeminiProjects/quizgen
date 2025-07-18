/**
 * 通用验证模式
 * 提供常用的验证规则和类型定义
 */

import { z } from 'zod';

/**
 * 通用分页参数模式
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1))
    .optional()
    .default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional()
    .default(10),
});

/**
 * 通用 UUID 参数模式
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('无效的ID格式'),
});

/**
 * 演讲状态枚举
 */
export const lectureStatusSchema = z.enum([
  'not_started',
  'in_progress',
  'paused',
  'ended',
]);

/**
 * 通用类型定义
 */
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type LectureStatus = z.infer<typeof lectureStatusSchema>;
