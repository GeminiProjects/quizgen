/**
 * 工具函数模块
 * 包含各种辅助函数
 */

import type { FilePart } from 'ai';
import type { Quiz, QuizGenerationResult, TimeoutOptions } from './types';

/**
 * 创建文件部分对象
 * 用于构建符合AI SDK要求的文件输入
 *
 * @param data 文件数据（Buffer或Uint8Array）
 * @param filename 文件名
 * @param mediaType 媒体类型
 * @returns FilePart对象
 */
export function createFilePart(
  data: Uint8Array | ArrayBuffer | Buffer | URL,
  filename: string,
  mediaType: string
): FilePart {
  return {
    type: 'file',
    data,
    filename,
    mediaType,
  };
}

/**
 * 根据文件扩展名获取媒体类型
 * @param filename 文件名
 * @returns 媒体类型字符串
 */
export function getMediaType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();

  const mediaTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
    html: 'text/html',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  return mediaTypes[ext || ''] || 'application/octet-stream';
}

/**
 * 验证测验题目的完整性
 * @param quiz 测验题目
 * @returns 是否有效
 */
export function validateQuiz(quiz: Quiz): boolean {
  return (
    quiz.question.length > 0 &&
    quiz.options.length === 4 &&
    quiz.options.every((opt) => opt.length > 0) &&
    quiz.answer >= 0 &&
    quiz.answer <= 3 &&
    quiz.explanation.length > 0
  );
}

/**
 * 将测验结果导出为JSON格式
 * @param result 测验生成结果
 * @param pretty 是否格式化输出
 * @returns JSON字符串
 */
export function exportQuizzesToJSON(
  result: QuizGenerationResult,
  pretty = true
): string {
  return JSON.stringify(result, null, pretty ? 2 : 0);
}

/**
 * 清理和规范化文本内容
 * 去除多余的空白和特殊字符
 *
 * @param text 原始文本
 * @returns 清理后的文本
 */
export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // 将多个空白字符替换为单个空格
    .replace(/\n{3,}/g, '\n\n') // 将多个换行替换为最多两个
    .trim();
}

/**
 * 创建带超时的 Promise
 * 用于为异步操作添加超时控制
 *
 * @param promise 原始 Promise
 * @param options 超时选项
 * @returns 带超时控制的 Promise
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   generateQuestions(config),
 *   { timeout: 30000, timeoutMessage: '生成题目超时' }
 * );
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  options?: TimeoutOptions
): Promise<T> {
  if (!options?.timeout) {
    return promise;
  }

  const { timeout, timeoutMessage = '操作超时', onTimeout } = options;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const timeoutId = setTimeout(() => {
        onTimeout?.();
        reject(new Error(timeoutMessage));
      }, timeout);

      // 清理定时器
      promise.finally(() => clearTimeout(timeoutId));
    }),
  ]);
}

/**
 * 创建可取消的超时控制器
 * 提供更精细的超时控制
 *
 * @param timeout 超时时间（毫秒）
 * @returns 超时控制器
 *
 * @example
 * ```typescript
 * const controller = createTimeoutController(30000);
 *
 * try {
 *   const result = await controller.wrap(generateQuestions(config));
 * } catch (error) {
 *   if (controller.isTimeout) {
 *     console.log('操作超时');
 *   }
 * }
 * ```
 */
export function createTimeoutController(timeout: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimeout = false;

  return {
    get isTimeout() {
      return isTimeout;
    },

    wrap<T>(promise: Promise<T>): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        timeoutId = setTimeout(() => {
          isTimeout = true;
          reject(new Error(`操作超时（${timeout}ms）`));
        }, timeout);

        promise
          .then(resolve)
          .catch(reject)
          .finally(() => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          });
      });
    },

    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  };
}

/**
 * 批量执行带超时的异步操作
 * 用于并发场景下的超时控制
 *
 * @param promises Promise 数组
 * @param timeout 统一超时时间
 * @returns 结果数组，包含成功和失败的结果
 */
export function batchWithTimeout<T>(
  promises: Promise<T>[],
  timeout: number
): Promise<
  Array<{ success: true; data: T } | { success: false; error: Error }>
> {
  return Promise.all(
    promises.map(async (promise) => {
      try {
        const data = await withTimeout(promise, { timeout });
        return { success: true as const, data };
      } catch (error) {
        return {
          success: false as const,
          error: error instanceof Error ? error : new Error('未知错误'),
        };
      }
    })
  );
}
