/**
 * AI 包的常量定义
 * 包含文件处理相关的常量
 */

/**
 * 支持的文件 MIME 类型
 */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/html',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * 支持的文件类型别名
 */
export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * MIME 类型对应的文件扩展名
 */
export const MIME_TYPE_EXTENSIONS: Record<SupportedMimeType, string[]> = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'text/html': ['.html', '.htm'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
};

/**
 * 最大文件大小（10MB）
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * 文件处理超时时间（5分钟）
 */
export const FILE_PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * 文件扩展名到 MIME 类型的映射
 */
export const EXTENSION_TO_MIME_TYPE: Record<string, SupportedMimeType> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * 检查文件类型是否支持
 */
export function isSupportedMimeType(
  mimeType: string
): mimeType is SupportedMimeType {
  return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
}

// 文件扩展名正则表达式
const FILE_EXTENSION_REGEX = /\.[^.]+$/;

/**
 * 根据文件名获取 MIME 类型
 */
export function getMimeTypeFromFilename(
  filename: string
): SupportedMimeType | null {
  const ext = filename.toLowerCase().match(FILE_EXTENSION_REGEX)?.[0];
  if (!ext) {
    return null;
  }

  return EXTENSION_TO_MIME_TYPE[ext] || null;
}
