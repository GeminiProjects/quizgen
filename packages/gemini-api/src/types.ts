/**
 * 文件处理相关的类型定义
 */

// 文件处理结果
export interface FileProcessingResult {
  fileName: string;
  fileType: string;
  extractedText: string;
  geminiFileUri: string;
}

// 处理进度
export interface ProcessingProgress {
  status: 'uploading' | 'processing' | 'extracting' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
}

// 支持的文件类型
export const SUPPORTED_MIME_TYPES = ['text/plain', 'application/pdf'] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// 文件扩展名映射
export const MIME_TYPE_EXTENSIONS: Record<SupportedMimeType, string[]> = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
};

// 文件大小限制（20MB）
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
