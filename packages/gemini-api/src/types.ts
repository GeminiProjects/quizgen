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
export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// 文件大小限制（20MB）
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
