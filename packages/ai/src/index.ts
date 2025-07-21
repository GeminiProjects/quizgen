/**
 * @repo/ai - Gemini API 客户端和工具集
 */

// 导出客户端相关功能
export { createGeminiClient } from './client';

// 导出文件处理器
export { FileProcessor } from './file-processor';

// 导出类型定义
export type {
  FileProcessingResult,
  ProcessingProgress,
  SupportedMimeType,
} from './types';

export {
  MAX_FILE_SIZE,
  MIME_TYPE_EXTENSIONS,
  SUPPORTED_MIME_TYPES,
} from './types';
