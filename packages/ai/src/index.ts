/**
 * @repo/ai-wrapper - AI功能封装包
 *
 * 提供统一的AI接口，支持：
 * - 文件内容提取和优化
 * - 基于内容的测验题目生成
 * - 多种AI模型支持（Google Gemini、OpenRouter等）
 * - 流式输出和批量处理
 *
 * @packageDocumentation
 */

// 导出常量
export {
  EXTENSION_TO_MIME_TYPE,
  FILE_PROCESSING_TIMEOUT,
  getMimeTypeFromFilename,
  isSupportedMimeType,
  MAX_FILE_SIZE,
  MIME_TYPE_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
  type SupportedMimeType,
} from './constants';
// 导出核心生成器函数
export {
  generateContext,
  generateQuestions,
} from './generators';
// 导出提示词管理函数
export {
  CONTEXT_GENERATION_PROMPT,
  fillPromptTemplate,
  QUIZ_GENERATION_PROMPT,
} from './prompts';
// 导出所有类型定义
export type {
  ContextGenerationConfig,
  PromptTemplate,
  Quiz,
  QuizGenerationConfig,
  QuizGenerationResult,
  TimeoutOptions,
} from './types';
// 导出工具函数
export {
  batchWithTimeout,
  cleanText,
  createFilePart,
  createTimeoutController,
  exportQuizzesToJSON,
  getMediaType,
  validateQuiz,
  withTimeout,
} from './utils';
