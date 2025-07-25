/**
 * AI 模型配置文件
 *
 * 本文件定义了 QuizGen 应用中使用的 AI 模型配置。
 * 支持多种模型提供商，但需要确保所选模型支持 PDF 解析功能，
 * 否则材料解析功能可能无法正常工作。
 *
 * 默认配置：
 * - 上下文处理：Gemini 2.5 Flash Lite（轻量级，适合快速响应）
 * - 测验生成：Gemini 2.5 Flash（标准版，适合复杂任务）
 *
 * 参考文档：https://ai-sdk.dev/docs/foundations/providers-and-models
 */

import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

/**
 * Gemini 2.5 Flash Lite 模型实例 (轻量级模型)
 */
const gemini25flashlite = google('gemini-2.5-flash-lite');

/**
 * Gemini 2.5 Flash 模型实例 (标准版模型)
 */
const gemini25flash = google('gemini-2.5-flash');

/**
 * 默认上下文处理模型
 *
 * 用于处理演讲材料等上下文相关的任务。
 * 选择轻量级模型以确保快速响应和较低的成本。
 */
export const defaultContextModel: LanguageModel = gemini25flashlite;

/**
 * 默认测验生成模型
 *
 * 用于生成测验题目，需要质量较高输出的任务。
 */
export const defaultQuizModel: LanguageModel = gemini25flash;
