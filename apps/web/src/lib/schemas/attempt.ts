/**
 * 答题记录相关 API 验证模式
 * 包含答题记录的提交、查询等操作的验证规则
 */

import { z } from 'zod';

/**
 * 答题提交请求模式
 */
export const attemptSubmitSchema = z.object({
  quiz_id: z.string().uuid('无效的题目ID'),
  selected: z.number().min(0, '选择答案不能小于0').max(3, '选择答案不能大于3'),
});

/**
 * 答题统计查询模式
 */
export const attemptStatsSchema = z
  .object({
    quiz_id: z.string().uuid('无效的题目ID').optional(),
    lecture_id: z.string().uuid('无效的演讲ID').optional(),
  })
  .refine((data) => data.quiz_id || data.lecture_id, {
    message: '请指定 quiz_id 或 lecture_id',
  });

/**
 * 答题记录相关 API 模式集合
 */
export const attemptSchemas = {
  submit: attemptSubmitSchema,
  stats: attemptStatsSchema,
};

/**
 * 类型定义导出
 */
export type AttemptSubmitRequest = z.infer<typeof attemptSubmitSchema>;
export type AttemptStatsQuery = z.infer<typeof attemptStatsSchema>;
