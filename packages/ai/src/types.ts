/**
 * AI 包的类型定义文件
 * 包含所有公共接口和类型定义
 */

import type { FilePart, LanguageModel } from 'ai';

/**
 * 测验题目接口
 * 表示一个完整的选择题
 */
export interface Quiz {
  /** 问题内容 */
  question: string;
  /** 选项列表（通常为4个选项） */
  options: string[];
  /** 正确答案的索引（0-3） */
  answer: number;
  /** 答案解释，说明为什么这个答案是正确的 */
  explanation: string;
}

/**
 * 测验生成结果接口
 * 包含生成的测验题目和状态信息
 */
export interface QuizGenerationResult {
  /** 生成是否成功 */
  success: boolean;
  /** 生成的题目总数 */
  total: number;
  /** 生成的测验题目列表 */
  quizzes: Quiz[];
  /** 错误信息（可选） */
  error?: string;
}

/**
 * 超时配置接口
 * 用于控制生成函数的超时行为
 */
export interface TimeoutOptions {
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 超时时的错误信息 */
  timeoutMessage?: string;
  /** 超时时的回调函数 */
  onTimeout?: () => void;
}

/**
 * 上下文生成配置接口
 * 用于控制上下文生成的行为
 */
export interface ContextGenerationConfig {
  /** 使用的语言模型 */
  model: LanguageModel;
  /** 输入文件 */
  file: FilePart;
}

/**
 * 测验生成配置接口
 * 用于控制测验生成的行为
 */
export interface QuizGenerationConfig {
  /** 使用的语言模型 */
  model: LanguageModel;
  /** 上下文内容 */
  context: string;
  /** 要生成的题目数量 */
  count: number;
  /** 超时选项（可选） */
  timeoutOptions?: TimeoutOptions;
}

/**
 * 提示词模板类型
 * 用于定义不同的提示词模板
 */
export interface PromptTemplate {
  /** 模板名称 */
  name: string;
  /** 模板内容 */
  content: string;
  /** 模板变量 */
  variables?: string[];
}
