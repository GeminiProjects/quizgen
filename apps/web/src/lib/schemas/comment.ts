import { z } from 'zod';

/**
 * 评论创建请求验证模式
 */
export const createCommentSchema = z.object({
  lecture_id: z.string().uuid(),
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(1000, '评论内容不能超过1000个字符'),
  is_anonymous: z.boolean().optional().default(false),
  visibility: z.enum(['public', 'speaker_only']).optional().default('public'),
});

/**
 * 评论更新请求验证模式
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(1000, '评论内容不能超过1000个字符'),
  is_anonymous: z.boolean().optional(),
  visibility: z.enum(['public', 'speaker_only']).optional(),
});

/**
 * 评论列表查询参数验证模式
 */
export const commentListQuerySchema = z.object({
  lecture_id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  visibility: z.enum(['public', 'speaker_only']).optional(),
});

/**
 * 评论删除请求验证模式
 */
export const deleteCommentSchema = z.object({
  id: z.string().uuid(),
});

// 导出类型定义
export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
export type UpdateCommentRequest = z.infer<typeof updateCommentSchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
export type DeleteCommentRequest = z.infer<typeof deleteCommentSchema>;
