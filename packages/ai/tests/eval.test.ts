import { expect, test } from 'bun:test';
import fs from 'node:fs';
import { google } from '@ai-sdk/google';
import {
  cleanText,
  createFilePart,
  generateContext,
  generateQuestions,
  type QuizGenerationConfig,
} from '@repo/ai';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * 题目结构定义
 */
const quizItemSchema = z.object({
  question: z.string().describe('题目内容'),
  options: z.array(z.string()).length(4).describe('四个选项'),
  correctAnswer: z.number().min(0).max(3).describe('正确答案索引'),
  explanation: z.string().describe('答案解释'),
});

/**
 * 题目质量评估结构
 */
const quizEvaluationSchema = z.object({
  qualityScore: z.number().min(1).max(10).describe('整体质量评分'),
  clarity: z.number().min(1).max(10).describe('题目清晰度'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('难度等级'),
  relevance: z.number().min(1).max(10).describe('相关性评分'),
  optionQuality: z.number().min(1).max(10).describe('选项质量评分'),
  hasDistractors: z.boolean().describe('是否有合理的干扰项'),
  specificIssues: z.array(z.string()).describe('具体问题'),
  improvements: z.array(z.string()).describe('改进建议'),
});

/**
 * 批量评估结果结构
 */
const batchEvaluationSchema = z.object({
  evaluations: z.array(
    z.object({
      index: z.number().describe('题目索引'),
      evaluation: quizEvaluationSchema,
    })
  ),
});

/**
 * 从PDF文件生成上下文
 */
async function generateContextFromPDF(pdfPath: string): Promise<string> {
  const dataContent = fs.readFileSync(pdfPath);
  const filePart = createFilePart(
    dataContent,
    'example.pdf',
    'application/pdf'
  );

  const result = generateContext({
    model: google('gemini-2.5-flash'),
    file: filePart,
  });

  let i = 0;
  for await (const chunk of result.textStream) {
    if (i++ % 50 === 0) {
      console.log(`[${i}] 文本块: ${cleanText(chunk).substring(0, 100)}...`);
    }
  }

  // 获取完整的上下文内容
  return await result.text;
}

/**
 * 批量生成题目
 * 使用已实现的 generateQuestions 函数
 */
async function generateQuizItems(context: string, count = 20) {
  const config: QuizGenerationConfig = {
    model: google('gemini-2.5-flash'),
    context,
    count,
  };

  const result = await generateQuestions(config);

  if (!result.success) {
    throw new Error(result.error || '生成题目失败');
  }

  // 转换为原有的格式
  return result.quizzes.map((quiz) => ({
    question: quiz.question,
    options: quiz.options,
    correctAnswer: quiz.answer,
    explanation: quiz.explanation,
  }));
}

/**
 * 批量评估所有题目
 */
async function evaluateBatchQuizItems(
  quizItems: z.infer<typeof quizItemSchema>[],
  context: string
) {
  // 构建批量评估的prompt
  const quizItemsText = quizItems
    .map(
      (item, index) => `
题目${index + 1}：${item.question}
选项：
A. ${item.options[0]}
B. ${item.options[1]}
C. ${item.options[2]}
D. ${item.options[3]}
正确答案：${String.fromCharCode(65 + item.correctAnswer)}
解释：${item.explanation}
`
    )
    .join('\n---\n');

  const { object: batchResult } = await generateObject({
    model: google('gemini-2.5-pro'),
    schema: batchEvaluationSchema,
    system:
      '你是一个资深的教育评估专家，擅长评判测试题目的质量。\n已知演讲的上下文是：\n' +
      context,
    prompt: `请批量评估以下${quizItems.length}道基于给定内容的选择题质量：

${quizItemsText}

请为每道题目从以下方面进行评估：
1. 题目的清晰度和准确性
2. 难度是否合适
3. 与主题的相关性
4. 选项设计的合理性（干扰项质量）
5. 答案解释的充分性

请按照题目顺序返回评估结果，确保每个题目都有对应的评估，分数应该体现差异性，尽可能拉开题目间的差距。  
注意：题目索引从0开始。`,
  });

  // 输出评估结果概览
  console.log('\n📊 批量评估完成，评估结果概览：');
  console.log(`├─ 评估题目数量: ${batchResult.evaluations.length}`);
  console.log(
    `├─ 平均质量得分: ${(batchResult.evaluations.reduce((sum, e) => sum + e.evaluation.qualityScore, 0) / batchResult.evaluations.length).toFixed(1)}/10`
  );
  console.log(
    `├─ 难度分布: 简单=${batchResult.evaluations.filter((e) => e.evaluation.difficulty === 'easy').length}, 中等=${batchResult.evaluations.filter((e) => e.evaluation.difficulty === 'medium').length}, 困难=${batchResult.evaluations.filter((e) => e.evaluation.difficulty === 'hard').length}`
  );
  console.log(
    `└─ 高质量题目(≥8分): ${batchResult.evaluations.filter((e) => e.evaluation.qualityScore >= 8).length}道`
  );

  // 将评估结果与原题目合并（处理1-based到0-based的索引转换）
  return quizItems.map((item, index) => {
    // Gemini 返回的是 1-based 索引，需要转换
    const evaluation = batchResult.evaluations.find(
      (e) => e.index === index + 1 || e.index === index // 兼容两种索引方式
    )?.evaluation;
    if (!evaluation) {
      throw new Error(`Missing evaluation for quiz item ${index}`);
    }
    return {
      ...item,
      evaluation,
    };
  });
}

/**
 * 选出最优质的题目
 */
function selectTopQuizItems(
  evaluatedItems: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    evaluation: z.infer<typeof quizEvaluationSchema>;
  }>,
  topN = 5
) {
  // 按综合得分排序
  const sortedItems = evaluatedItems.sort((a, b) => {
    // 计算综合得分（考虑多个维度）
    const scoreA =
      a.evaluation.qualityScore * 0.4 +
      a.evaluation.clarity * 0.3 +
      a.evaluation.relevance * 0.2 +
      a.evaluation.optionQuality * 0.1;

    const scoreB =
      b.evaluation.qualityScore * 0.4 +
      b.evaluation.clarity * 0.3 +
      b.evaluation.relevance * 0.2 +
      b.evaluation.optionQuality * 0.1;

    return scoreB - scoreA; // 降序排列
  });

  // 返回前N个最优题目
  return sortedItems.slice(0, topN);
}

/**
 * 完整的题目生成和筛选流程
 */
async function generateAndSelectBestQuizItems(
  pdfPath: string,
  generateCount = 20,
  selectCount = 5
) {
  console.log(`\n🎯 开始从 ${pdfPath} 生成题目...`);

  // 步骤0：从PDF提取上下文
  console.log('\n📄 从PDF文件提取内容...');
  let startTime = Date.now();
  const context = await generateContextFromPDF(pdfPath);
  let duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✅ 成功提取内容 (耗时: ${duration}秒, 长度: ${context.length} 字符)`
  );

  // 步骤1：使用 Gemini 2.5 Flash 快速生成题目
  console.log(`\n📝 使用 Gemini 2.5 Flash 生成 ${generateCount} 道题目...`);
  startTime = Date.now();
  const quizItems = await generateQuizItems(context, generateCount);
  duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ 成功生成 ${quizItems.length} 道题目 (耗时: ${duration}秒)`);

  // 步骤2：使用 Gemini 2.5 Pro 评估题目质量
  console.log('\n🔍 使用 Gemini 2.5 Pro 批量评估题目质量...');
  startTime = Date.now();
  const evaluatedItems = await evaluateBatchQuizItems(quizItems, context);
  duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ 完成所有题目的质量评估 (耗时: ${duration}秒)`);

  // 步骤3：选出最优质的题目
  console.log(`\n🏆 选择最优质的 ${selectCount} 道题目...`);
  const bestItems = selectTopQuizItems(evaluatedItems, selectCount);

  // 输出结果
  console.log('\n📊 最终选出的优质题目：');
  bestItems.forEach((item, index) => {
    const avgScore = (
      item.evaluation.qualityScore * 0.4 +
      item.evaluation.clarity * 0.3 +
      item.evaluation.relevance * 0.2 +
      item.evaluation.optionQuality * 0.1
    ).toFixed(1);

    console.log(`\n${index + 1}. [综合得分: ${avgScore}/10]`);
    console.log(`   题目: ${item.question}`);
    console.log(`   难度: ${item.evaluation.difficulty}`);
    console.log(`   质量评分: ${item.evaluation.qualityScore}/10`);
    console.log(`   清晰度: ${item.evaluation.clarity}/10`);
  });

  return bestItems;
}

// 测试用例
test(
  '完整测试：从PDF生成题目并评估质量',
  async () => {
    const pdfPath = './data/example.pdf';
    const bestQuizItems = await generateAndSelectBestQuizItems(pdfPath, 20, 5);

    // 验证结果
    expect(bestQuizItems).toHaveLength(5);

    // 验证每个题目都有必要的字段
    for (const item of bestQuizItems) {
      expect(item.question).toBeTruthy();
      expect(item.options).toHaveLength(4);
      expect(item.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(item.correctAnswer).toBeLessThanOrEqual(3);
      expect(item.explanation).toBeTruthy();
      expect(item.evaluation.qualityScore).toBeGreaterThanOrEqual(1);
      expect(item.evaluation.qualityScore).toBeLessThanOrEqual(10);
    }

    // 验证题目是否按质量排序（第一个应该是最好的）
    for (let i = 0; i < bestQuizItems.length - 1; i++) {
      const currentScore =
        bestQuizItems[i].evaluation.qualityScore * 0.4 +
        bestQuizItems[i].evaluation.clarity * 0.3 +
        bestQuizItems[i].evaluation.relevance * 0.2 +
        bestQuizItems[i].evaluation.optionQuality * 0.1;

      const nextScore =
        bestQuizItems[i + 1].evaluation.qualityScore * 0.4 +
        bestQuizItems[i + 1].evaluation.clarity * 0.3 +
        bestQuizItems[i + 1].evaluation.relevance * 0.2 +
        bestQuizItems[i + 1].evaluation.optionQuality * 0.1;

      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }
  },
  // 10 分钟超时
  10 * 60 * 1000
);
