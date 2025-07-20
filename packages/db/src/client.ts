/**
 * 客户端安全的导出
 *
 * 这个文件只导出类型定义和常量，不包含任何服务器端代码
 * 可以安全地在客户端组件中使用
 */

// 导出类型推断工具
export type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
// 导出所有 Schema 类型（这些是 TypeScript 类型，不会包含运行时代码）
export type {
  Account,
  Attempt,
  Lecture,
  LectureParticipant,
  Material,
  Organization,
  QuizItem,
  Session,
  Transcript,
  User,
  Verification,
} from './schema';
export type {
  BulkOperationResult,
  DateRangeParams,
  DbOperationResult,
  LectureStatusType,
  PaginatedResult,
  PaginationParams,
  QuestionTypeEnum,
  SortParams,
} from './types';
// 导出常量和枚举
export { LectureStatus, QuestionType } from './types';
