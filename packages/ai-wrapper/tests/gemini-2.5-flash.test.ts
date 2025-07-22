import { expect, test } from 'bun:test';
import fs from 'node:fs';
import { google } from '@ai-sdk/google';
import type { FilePart } from 'ai';
import { generateContext, generateQuestions } from '../src';

const model = google('gemini-2.5-flash');

test(
  '42 页超长 PDF 内容提取 (Gemini 2.5 Flash)',
  async () => {
    const dataContent = fs.readFileSync('./data/example.pdf');
    const context = fs.existsSync('./out/example_generated.txt')
      ? fs.readFileSync('./out/example_generated.txt')
      : null;

    // 如果内容已存在，则跳过生成
    if (context && context.length > 0) {
      return;
    }

    const filePart: FilePart = {
      type: 'file',
      data: dataContent,
      filename: 'example.pdf',
      mediaType: 'application/pdf',
    };

    const result = generateContext(model, filePart);

    for await (const chunk of result.textStream) {
      console.log(chunk);
    }

    const finalResult = await result.text;

    fs.writeFileSync('./out/example_generated.txt', finalResult);
  },
  // 3 分钟
  3 * 60 * 1000
);

test(
  '生成 5 道选择题',
  async () => {
    const context = fs.readFileSync('./out/example_generated.txt').toString();
    const count = 5;

    const result = await generateQuestions(model, context, count);

    expect(result.success).toBe(true);
    expect(result.total).toBe(count);
    expect(result.quizzes.length).toBe(count);

    console.log(result);
  },
  // 30 秒
  30 * 1000
);
