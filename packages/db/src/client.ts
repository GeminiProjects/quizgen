/**
 * 客户端安全的导出
 * 
 * 这个文件只导出类型定义和常量，不包含任何服务器端代码
 * 可以安全地在客户端组件中使用
 */

// 导出所有 Schema 类型（这些是 TypeScript 类型，不会包含运行时代码）
export type {
  User,
  Session,
  Account,
  Verification,
  Organization,
  Lecture,
  Material,
  Transcript,
  QuizItem,
  Attempt,
  LectureParticipant,
} from './schema';

// 导出类型推断工具
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// 导出常量和枚举
export { LectureStatus, QuestionType } from './types';
export type { 
  LectureStatusType, 
  QuestionTypeEnum,
  PaginationParams,
  PaginatedResult,
  SortParams,
  DateRangeParams,
  DbOperationResult,
  BulkOperationResult
} from './types';