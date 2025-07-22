/**
 * Google AI Provider 测试套件
 * 测试文件内容提取和测验生成功能
 */

import { expect, test } from 'bun:test';
import fs from 'node:fs';
import { google } from '@ai-sdk/google';
import {
  type ContextGenerationConfig,
  createFilePart,
  exportQuizzesToJSON,
  generateContext,
  generateQuestions,
  type QuizGenerationConfig,
  validateQuiz,
} from '@repo/ai';

// 测试配置
const model = google('gemini-2.5-flash');
const input = './data/example.pdf';
const outputContext = './out/example_context_gemini.txt';
const outputQuizzes = './out/example_quizzes_gemini.json';

/**
 * 测试：42页超长PDF内容提取
 * 使用 Gemini 2.5 Flash 模型
 */
test(
  '42 页超长 PDF 内容提取 (Gemini 2.5 Flash)',
  async () => {
    const dataContent = fs.readFileSync(input);
    const context = fs.existsSync(outputContext)
      ? fs.readFileSync(outputContext)
      : null;

    // 如果内容已存在，则跳过生成
    if (context && context.length > 0) {
      console.log('上下文已存在，跳过生成');
      return;
    }

    // 创建文件部分对象
    const filePart = createFilePart(
      dataContent,
      'example.pdf',
      'application/pdf'
    );

    // 配置上下文生成
    const config: ContextGenerationConfig = {
      model,
      file: filePart,
    };

    // 生成上下文
    const result = generateContext(config);

    console.log('等待上下文生成...');
    let chunkCount = 0;
    for await (const chunk of result.textStream) {
      chunkCount++;
      // 只输出前几个chunk，避免日志过多
      if (chunkCount <= 5) {
        console.log(`Chunk ${chunkCount}: ${chunk.substring(0, 100)}...`);
      }
    }
    console.log(`共接收到 ${chunkCount} 个文本块`);

    console.log('上下文生成完成');

    // 获取最终结果
    const finalResult = await result.text;
    console.log(`生成的文本长度: ${finalResult.length} 字符`);

    // 写入文件用于调试
    if (!fs.existsSync('./out')) {
      fs.mkdirSync('./out');
    }
    fs.writeFileSync(outputContext, finalResult);
  },
  // 3 分钟超时
  3 * 60 * 1000
);

/**
 * 测试：生成选择题
 * 基于提取的上下文生成中文测验题目
 */
test(
  '生成 10 道选择题',
  async () => {
    // 确保上下文文件存在
    if (!fs.existsSync(outputContext)) {
      console.error('上下文文件不存在，请先运行内容提取测试');
      return;
    }

    // 如果已经生成过题目，跳过
    if (fs.existsSync(outputQuizzes)) {
      console.log('题目已存在，跳过生成');
      return;
    }

    const context = fs.readFileSync(outputContext).toString();
    const count = 10;

    // 配置测验生成
    const config: QuizGenerationConfig = {
      model,
      context,
      count,
    };

    // 生成选择题
    console.log(`开始生成 ${count} 道选择题...`);
    const result = await generateQuestions(config);

    // 验证结果
    expect(result.success).toBe(true);
    expect(result.total).toBe(count);
    expect(result.quizzes.length).toBe(count);

    console.log(`成功生成 ${result.total} 道题目`);

    // 验证每道题目
    result.quizzes.forEach((quiz, index) => {
      console.log(`\n题目 ${index + 1}: ${quiz.question.substring(0, 50)}...`);

      // 使用工具函数验证题目
      expect(validateQuiz(quiz)).toBe(true);

      // 详细验证
      expect(quiz.question).toBeDefined();
      expect(quiz.question.length).toBeGreaterThan(0);
      expect(quiz.options).toHaveLength(4);
      expect(quiz.options.every((opt) => opt.length > 0)).toBe(true);
      expect(quiz.answer).toBeGreaterThanOrEqual(0);
      expect(quiz.answer).toBeLessThanOrEqual(3);
      expect(quiz.explanation).toBeDefined();
      expect(quiz.explanation.length).toBeGreaterThan(0);
    });

    // 导出为JSON格式
    const json = exportQuizzesToJSON(result);
    fs.writeFileSync(outputQuizzes, json);
    console.log(`\n题目已导出到 ${outputQuizzes}`);
  },
  // 30 秒超时
  30 * 1000
);
