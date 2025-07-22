/**
 * 核心生成器模块
 * 包含上下文生成和测验生成的核心逻辑
 */

import {
  generateObject,
  type StreamTextResult,
  streamText,
  type ToolSet,
} from 'ai';
import { z } from 'zod';
import {
  CONTEXT_GENERATION_PROMPT,
  fillPromptTemplate,
  QUIZ_GENERATION_PROMPT,
} from './prompts';
import type {
  ContextGenerationConfig,
  QuizGenerationConfig,
  QuizGenerationResult,
} from './types';
import { withTimeout } from './utils';

/**
 * 测验结果的 Zod 验证模式
 * 确保生成的结果符合预期格式
 */
const quizGenerationSchema = z.object({
  success: z.boolean().describe('生成是否成功'),
  total: z.number().describe('生成的题目总数'),
  quizzes: z
    .array(
      z.object({
        question: z.string().describe('问题内容'),
        options: z.array(z.string()).length(4).describe('四个选项'),
        answer: z.number().min(0).max(3).describe('正确答案索引'),
        explanation: z.string().describe('答案解释'),
      })
    )
    .describe('测验题目列表'),
});

/**
 * 生成上下文内容
 * 从文件中提取并优化文本内容
 *
 * @param config 上下文生成配置
 * @returns 流式文本结果
 *
 * @example
 * ```typescript
 * const result = generateContext({
 *   model: google('gemini-2.5-flash'),
 *   file: { type: 'file', data: buffer, filename: 'doc.pdf', mediaType: 'application/pdf' }
 * });
 *
 * // 流式输出
 * for await (const chunk of result.textStream) {
 *   console.log(chunk);
 * }
 *
 * // 获取完整结果
 * const fullText = await result.text;
 * ```
 */
export function generateContext(
  config: ContextGenerationConfig
): StreamTextResult<ToolSet, never> {
  const { model, file } = config;

  const result = streamText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: CONTEXT_GENERATION_PROMPT.content,
          },
          file,
        ],
      },
    ],
  });

  return result;
}

/**
 * 生成测验题目
 * 基于给定的上下文内容生成指定数量的选择题
 *
 * @param config 测验生成配置
 * @returns 测验生成结果
 *
 * @example
 * ```typescript
 * const result = await generateQuestions({
 *   model: google('gemini-2.5-flash'),
 *   context: '文章内容...',
 *   count: 5,
 * });
 *
 * if (result.success) {
 *   console.log(`生成了 ${result.total} 道题目`);
 *   result.quizzes.forEach((quiz, index) => {
 *     console.log(`题目 ${index + 1}: ${quiz.question}`);
 *   });
 * }
 * ```
 */
export async function generateQuestions(
  config: QuizGenerationConfig
): Promise<QuizGenerationResult> {
  const { model, context, count, timeoutOptions } = config;

  try {
    // 填充提示词模板
    const prompt = fillPromptTemplate(QUIZ_GENERATION_PROMPT, {
      CONTENT: context,
      COUNT: count.toString(),
    });

    // 生成对象的 Promise
    const generatePromise = generateObject({
      model,
      prompt,
      schema: quizGenerationSchema,
    });

    // 应用超时控制
    const result = await withTimeout(generatePromise, timeoutOptions);

    // 验证结果
    if (!result.object.success) {
      return {
        success: false,
        total: 0,
        quizzes: [],
        error: '生成失败',
      };
    }

    // 确保生成的题目数量正确
    if (result.object.quizzes.length !== count) {
      console.warn(
        `期望生成 ${count} 道题目，实际生成 ${result.object.quizzes.length} 道`
      );
    }

    return result.object;
  } catch (error) {
    console.error('生成测验题目时出错:', error);

    // 检查是否是超时错误
    if (error instanceof Error && error.message.includes('超时')) {
      return {
        success: false,
        total: 0,
        quizzes: [],
        error: timeoutOptions?.timeoutMessage || error.message,
      };
    }

    return {
      success: false,
      total: 0,
      quizzes: [],
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}
