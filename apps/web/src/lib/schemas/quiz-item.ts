/**
 * 测验题目相关 API 验证模式
 * 包含测验题目的创建、更新、查询等操作的验证规则
 */

import { z } from 'zod';
import { paginationSchema } from './common';

/**
 * 测验题目创建请求模式
 */
export const quizItemCreateSchema = z.object({
  question: z.string().min(1, '题目不能为空').max(500, '题目不能超过500个字符'),
  options: z
    .array(z.string().min(1, '选项不能为空'))
    .length(4, '必须提供4个选项'),
  answer: z.number().min(0, '答案索引不能小于0').max(3, '答案索引不能大于3'),
  lecture_id: z.string().uuid('无效的演讲ID'),
});

/**
 * 测验题目更新请求模式
 */
export const quizItemUpdateSchema = quizItemCreateSchema.omit({
  lecture_id: true,
});

/**
 * 测验题目列表查询模式
 */
export const quizItemListSchema = paginationSchema.extend({
  lecture_id: z.string().uuid('无效的演讲ID'),
});

/**
 * AI 生成题目请求模式
 */
export const quizItemGenerateSchema = z.object({
  lecture_id: z.string().uuid('无效的演讲ID'),
  context: z.string().min(1, '上下文不能为空'), // 当前演讲内容
});

/**
 * 测验题目相关 API 模式集合
 */
export const quizItemSchemas = {
  create: quizItemCreateSchema,
  update: quizItemUpdateSchema,
  list: quizItemListSchema,
  generate: quizItemGenerateSchema,
};

/**
 * 类型定义导出
 */
export type QuizItemCreateRequest = z.infer<typeof quizItemCreateSchema>;
export type QuizItemUpdateRequest = z.infer<typeof quizItemUpdateSchema>;
export type QuizItemListQuery = z.infer<typeof quizItemListSchema>;
export type QuizItemGenerateRequest = z.infer<typeof quizItemGenerateSchema>;
