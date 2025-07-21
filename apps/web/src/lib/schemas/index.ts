/**
 * API 验证模式统一导出
 * 提供所有 API 接口的数据验证模式
 */

// 导出答题记录相关模式
export * from './attempt';
export {
  type AttemptStatsQuery,
  type AttemptSubmitRequest,
  attemptSchemas,
} from './attempt';
// 导出通用模式
export * from './common';
// 导出演讲相关模式
export * from './lecture';
export {
  type LectureCreateRequest,
  type LectureJoinByCodeRequest,
  type LectureListQuery,
  type LectureUpdateRequest,
  lectureSchemas,
} from './lecture';
// 导出组织相关模式
export * from './organization';
// 为了保持向后兼容，重新导出原有的模式集合
export {
  type OrganizationCreateRequest,
  type OrganizationListQuery,
  type OrganizationPasswordRequest,
  type OrganizationUpdateRequest,
  organizationSchemas,
} from './organization';
// 导出测验题目相关模式
export * from './quiz-item';
export {
  type QuizItemCreateRequest,
  type QuizItemGenerateRequest,
  type QuizItemListQuery,
  type QuizItemUpdateRequest,
  quizItemSchemas,
} from './quiz-item';
export * from "./participation";
