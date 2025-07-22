import { z } from 'zod';

export const participationSchemas = {
  // 通过演讲码加入
  joinByCode: z.object({
    join_code: z
      .string()
      .min(1, '请输入演讲码')
      .max(10, '演讲码格式错误')
      .transform((val) => val.toUpperCase().trim()),
  }),

  // 提交答题记录
  submitAttempt: z.object({
    quiz_id: z.string().uuid('无效的题目ID'),
    selected: z.number().int().min(0).max(3, '答案选项无效'),
    latency_ms: z.number().int().min(0, '答题时间无效'),
  }),

  // 搜索参与的演讲
  searchParticipated: z.object({
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    search: z.string().optional(),
    status: z
      .enum(['not_started', 'in_progress', 'paused', 'ended'])
      .optional(),
  }),
};
