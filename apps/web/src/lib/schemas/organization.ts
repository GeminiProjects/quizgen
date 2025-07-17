/**
 * 组织相关 API 验证模式
 * 包含组织的创建、更新、查询等操作的验证规则
 */

import { z } from 'zod';
import { paginationSchema } from './common';

/**
 * 组织创建请求模式
 */
export const organizationCreateSchema = z.object({
  name: z
    .string()
    .min(1, '组织名称不能为空')
    .max(100, '组织名称不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码不能超过50个字符'),
});

/**
 * 组织更新请求模式
 */
export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .min(1, '组织名称不能为空')
    .max(100, '组织名称不能超过100个字符')
    .optional(),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码不能超过50个字符')
    .optional(),
});

/**
 * 组织列表查询模式
 */
export const organizationListSchema = paginationSchema.extend({
  search: z.string().optional(),
});

/**
 * 组织密码验证模式
 */
export const organizationPasswordSchema = z.object({
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 组织相关 API 模式集合
 */
export const organizationSchemas = {
  create: organizationCreateSchema,
  update: organizationUpdateSchema,
  list: organizationListSchema,
  validatePassword: organizationPasswordSchema,
};

/**
 * 类型定义导出
 */
export type OrganizationCreateRequest = z.infer<
  typeof organizationCreateSchema
>;
export type OrganizationUpdateRequest = z.infer<
  typeof organizationUpdateSchema
>;
export type OrganizationListQuery = z.infer<typeof organizationListSchema>;
export type OrganizationPasswordRequest = z.infer<
  typeof organizationPasswordSchema
>;
