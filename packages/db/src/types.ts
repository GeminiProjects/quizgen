/**
 * 数据库类型定义
 *
 * 提供常用的数据库操作类型和工具类型
 */

// 导出 Drizzle 的类型推断工具，用户可以直接使用
/**
 * 查询构建器类型
 */
export type { InferInsertModel, InferSelectModel, SQL } from 'drizzle-orm';
/**
 * 数据库事务类型
 */
export type { PgTransaction } from 'drizzle-orm/pg-core';

/**
 * 演讲状态枚举
 */
export const LectureStatus = {
  /** 草稿状态 */
  DRAFT: 'draft',
  /** 待开始 */
  SCHEDULED: 'scheduled',
  /** 进行中 */
  ONGOING: 'ongoing',
  /** 已完成 */
  COMPLETED: 'completed',
  /** 已取消 */
  CANCELLED: 'cancelled',
} as const;

export type LectureStatusType =
  (typeof LectureStatus)[keyof typeof LectureStatus];

/**
 * 题目类型枚举
 */
export const QuestionType = {
  /** 单选题 */
  SINGLE_CHOICE: 'single_choice',
  /** 多选题 */
  MULTIPLE_CHOICE: 'multiple_choice',
  /** 判断题 */
  TRUE_FALSE: 'true_false',
  /** 简答题 */
  SHORT_ANSWER: 'short_answer',
} as const;

export type QuestionTypeEnum = (typeof QuestionType)[keyof typeof QuestionType];

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 偏移量 */
  offset?: number;
  /** 限制数量 */
  limit?: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  data: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 时间范围查询参数
 */
export interface DateRangeParams {
  /** 开始时间 */
  startDate?: Date | string;
  /** 结束时间 */
  endDate?: Date | string;
}

/**
 * 数据库操作结果
 */
export interface DbOperationResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 影响的行数 */
  affectedRows?: number;
}

/**
 * 批量操作结果
 */
export interface BulkOperationResult<T = unknown> {
  /** 成功的记录 */
  succeeded: T[];
  /** 失败的记录 */
  failed: Array<{
    data: T;
    error: string;
  }>;
  /** 总数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failureCount: number;
}
