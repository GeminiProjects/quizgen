/**
 * 题目生成 API 路由
 * 基于演讲材料和转录内容使用 AI 生成选择题
 */

import { createGeminiClient } from '@repo/ai';
import {
  db,
  eq,
  lectures,
  type Material,
  materials,
  type Transcript,
  transcripts,
} from '@repo/db';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  handleDatabaseError,
  validateRequestBody,
  withErrorHandler,
} from '@/lib/api-utils';
import { getServerSideSession } from '@/lib/auth';

// 请求体验证模式
const generateQuizSchema = z.object({
  lecture_id: z.string().uuid('演讲ID格式不正确'),
  count: z.number().min(1).max(10).default(10), // 一次生成的题目数量
});

// 生成题目的结构化输出格式
interface GeneratedQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

/**
 * 构造题目生成的 prompt
 */
function buildPrompt(mats: Material[], trans: Transcript[]): string {
  // 构建上下文
  let context = '';

  // 添加材料内容
  if (mats.length > 0) {
    context += '【预上传材料内容】\n';
    mats.forEach((material, index) => {
      context += `\n材料 ${index + 1}：${material.file_name}\n`;
      if (material.text_content) {
        context += `${material.text_content}\n`;
      }
    });
  }

  // 添加转录内容
  if (trans.length > 0) {
    context += '\n【演讲转录内容】\n';
    // 按时间排序转录内容
    const sortedTranscripts = [...trans].sort(
      (a, b) => a.ts.getTime() - b.ts.getTime()
    );
    for (const transcript of sortedTranscripts) {
      context += `${transcript.text} `;
    }
  }

  // 构造完整的 prompt
  const prompt = `基于以下演讲内容，生成10道高质量的四选一选择题。

${context}

要求：
1. 题目应该测试听众对核心概念的理解，而不是简单的记忆
2. 每道题目都应该有明确的教学目标
3. 选项设计要合理，错误选项应该是常见的误解或混淆点
4. 题目难度适中，既不过于简单也不过于复杂
5. 覆盖演讲的不同方面和重点内容
6. 语言清晰准确，避免歧义
7. 确保每道题只有一个正确答案

请以JSON格式返回10道题目，格式如下：
[
  {
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": 0, // 正确答案的索引（0-3）
    "explanation": "答案解释（可选）"
  }
]

注意：
- correctAnswer 必须是0到3之间的数字
- options 数组必须包含正好4个选项
- 所有内容使用中文`;

  return prompt;
}

/**
 * 解析 AI 生成的题目
 */

const JSON_ARRAY_REGEX = /\[[\s\S]*\]/;

function parseGeneratedQuizzes(content: string): GeneratedQuiz[] {
  try {
    // 尝试找到 JSON 数组
    const jsonMatch = content.match(JSON_ARRAY_REGEX);
    if (!jsonMatch) {
      throw new Error('未找到有效的JSON格式');
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeneratedQuiz[];

    // 验证并清理数据
    return parsed
      .filter((item) => {
        return (
          item.question &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.correctAnswer === 'number' &&
          item.correctAnswer >= 0 &&
          item.correctAnswer <= 3
        );
      })
      .map((item) => ({
        question: item.question.trim(),
        options: item.options.map((opt: string) => opt.trim()),
        correctAnswer: item.correctAnswer,
        explanation: item.explanation?.trim(),
      }));
  } catch (error) {
    console.error('解析生成的题目失败:', error);
    return [];
  }
}

/**
 * 生成测验题目
 * POST /api/quiz-items/generate
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 验证用户身份
  const session = await getServerSideSession();

  if (!session) {
    return createErrorResponse('未登录', 401);
  }

  // 验证请求体
  const validationResult = await validateRequestBody(
    request,
    generateQuizSchema
  );

  if (!validationResult.success) {
    return createErrorResponse(validationResult.error);
  }

  const { lecture_id, count } = validationResult.data;

  try {
    // 验证演讲是否存在且用户有权限
    const [lecture] = await db
      .select({
        id: lectures.id,
        owner_id: lectures.owner_id,
        status: lectures.status,
      })
      .from(lectures)
      .where(eq(lectures.id, lecture_id))
      .limit(1);

    if (!lecture) {
      return createErrorResponse('演讲不存在', 404);
    }

    if (lecture.owner_id !== session.user.id) {
      return createErrorResponse('无权为此演讲生成题目', 403);
    }

    // 获取演讲的材料和转录内容
    const [lectureMaterials, lectureTranscripts] = await Promise.all([
      db.select().from(materials).where(eq(materials.lecture_id, lecture_id)),
      db
        .select()
        .from(transcripts)
        .where(eq(transcripts.lecture_id, lecture_id)),
    ]);

    // 检查是否有足够的内容生成题目
    if (lectureMaterials.length === 0 && lectureTranscripts.length === 0) {
      return createErrorResponse(
        '没有足够的内容生成题目，请先上传材料或开始演讲',
        400
      );
    }

    // 获取 Gemini API 密钥
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_GENERATIVE_AI_API_KEY 未配置');
      return createErrorResponse('AI 服务配置错误', 500);
    }

    // 创建 Gemini 客户端
    const genai = createGeminiClient(apiKey);
    // 构造 prompt
    const prompt = buildPrompt(lectureMaterials, lectureTranscripts);

    // 调用 AI 生成题目
    const result = await genai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = result.text ?? '';

    // 解析生成的题目
    const generatedQuizzes = parseGeneratedQuizzes(text);

    if (generatedQuizzes.length === 0) {
      return createErrorResponse('题目生成失败，请重试', 500);
    }

    // 限制返回的题目数量
    const quizzesToReturn = generatedQuizzes.slice(0, count);

    return createSuccessResponse(
      {
        quizzes: quizzesToReturn,
        count: quizzesToReturn.length,
      },
      '题目生成成功'
    );
  } catch (error) {
    console.error('生成题目时出错:', error);
    return handleDatabaseError(error);
  }
});
