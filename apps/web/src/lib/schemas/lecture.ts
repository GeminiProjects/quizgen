/**
 * 演讲相关 API 验证模式
 * 包含演讲的创建、更新、查询等操作的验证规则
 */

import { z } from 'zod';
import { lectureStatusSchema, paginationSchema } from './common';

/**
 * 演讲创建请求模式
 */
export const lectureCreateSchema = z.object({
  title: z
    .string()
    .min(1, '演讲标题不能为空')
    .max(200, '标题不能超过200个字符'),
  description: z
    .string()
    .max(1000, '描述不能超过1000个字符')
    .nullable()
    .optional(),
  org_id: z.string().uuid('无效的组织ID').nullable().optional(),
  org_password: z.string().nullable().optional(), // 加入组织时需要的密码
  starts_at: z.string().datetime('无效的开始时间格式'),
});

/**
 * 演讲更新请求模式
 */
export const lectureUpdateSchema = z.object({
  title: z
    .string()
    .min(1, '演讲标题不能为空')
    .max(200, '标题不能超过200个字符')
    .optional(),
  description: z.string().max(1000, '描述不能超过1000个字符').optional(),
  status: lectureStatusSchema.optional(),
  starts_at: z.string().datetime('无效的开始时间格式').optional(),
  ends_at: z.string().datetime('无效的结束时间格式').optional(),
});

/**
 * 演讲列表查询模式
 */
export const lectureListSchema = paginationSchema.extend({
  org_id: z.string().uuid('无效的组织ID').optional(),
  status: lectureStatusSchema.optional(),
  search: z.string().optional(),
});

/**
 * 通过演讲码加入演讲模式
 */
export const lectureJoinByCodeSchema = z.object({
  join_code: z.string().min(1, '演讲码不能为空'),
});

/**
 * 演讲相关 API 模式集合
 */
export const lectureSchemas = {
  create: lectureCreateSchema,
  update: lectureUpdateSchema,
  list: lectureListSchema,
  joinByCode: lectureJoinByCodeSchema,
};

/**
 * 类型定义导出
 */
export type LectureCreateRequest = z.infer<typeof lectureCreateSchema>;
export type LectureUpdateRequest = z.infer<typeof lectureUpdateSchema>;
export type LectureListQuery = z.infer<typeof lectureListSchema>;
export type LectureJoinByCodeRequest = z.infer<typeof lectureJoinByCodeSchema>;
