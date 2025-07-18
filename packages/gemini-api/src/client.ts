/**
 * Gemini API 客户端封装
 */
import { GoogleGenAI } from '@google/genai';

/**
 * 创建 Gemini AI 客户端实例
 * @param apiKey - Google Generative AI API 密钥
 * @returns GoogleGenAI 客户端实例
 */
export function createGeminiClient(apiKey: string): GoogleGenAI {
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required');
  }

  return new GoogleGenAI({
    apiKey,
  });
}
