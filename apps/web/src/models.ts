// 允许使用任何模型提供商 (需要其支持 PDF 解析，否则材料解析可能失败)
// 默认使用 Gemini 2.5 Flash
// 参阅: https://ai-sdk.dev/docs/foundations/providers-and-models

import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

const gemini25flashlite = google('gemini-2.5-flash-lite');

const gemini25flash = google('gemini-2.5-flash');

export const defaultContextModel: LanguageModel = gemini25flashlite;

export const defaultQuizModel: LanguageModel = gemini25flash;
