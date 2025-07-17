import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// 定义选择题选项的 Zod schema
export const QuizOptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string().min(1, '选项内容不能为空'),
});

// 定义单个测验题目的 Zod schema
export const QuizItemSchema = z.object({
  question: z.string().min(10, '题目至少需要10个字符'),
  options: z.array(QuizOptionSchema).length(4, '必须包含4个选项'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(10, '解释至少需要10个字符'),
});

// 定义测验题目集合的 Zod schema
export const QuizSchema = z.object({
  items: z.array(QuizItemSchema).min(1, '至少需要1道题目'),
});

// 类型定义 - 导出供其他模块使用
export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizItem = z.infer<typeof QuizItemSchema>;
export type Quiz = z.infer<typeof QuizSchema>;

/**
 * 构造课程内容提示词
 * @param content 课程内容文本
 * @returns 格式化的课程内容提示词
 */
export function buildContentPrompt(content: string): string {
  return `
## 课程内容
${content.trim()}

以上是本次课程的主要内容，请仔细阅读并理解其中的关键知识点。
`;
}

/**
 * 构造题目生成指示
 * @param questionCount 题目数量
 * @returns 题目生成指示
 */
export function buildQuizInstructions(questionCount = 4): string {
  return `
## 测验题目生成要求

请基于以上课程内容，生成 ${questionCount} 道高质量的四选一选择题，要求：

1. **题目质量要求**：
   - 题目应涵盖课程内容的核心知识点
   - 难度适中，能有效测试学员的理解程度
   - 题目表述清晰，避免歧义
   - 考查深度理解而非表面记忆

2. **选项设计要求**：
   - 每道题必须有4个选项（A、B、C、D）
   - 只有一个正确答案
   - 错误选项应有一定迷惑性，但不能过于明显
   - 选项长度相近，避免明显的长短暗示

3. **答案解释要求**：
   - 为每道题提供详细的答案解释
   - 解释应说明为什么某个选项是正确的
   - 简要说明其他选项为什么是错误的

请严格按照指定的JSON格式返回结果。
`;
}

/**
 * 构造完整的提示词
 * @param content 课程内容
 * @param questionCount 题目数量
 * @returns 完整的提示词
 */
export function buildPrompt(content: string, questionCount = 4): string {
  const contentPrompt = buildContentPrompt(content);
  const instructions = buildQuizInstructions(questionCount);

  return `${contentPrompt}\n${instructions}`;
}

/**
 * 生成测验题目
 * @param content 课程内容
 * @param questionCount 题目数量
 * @returns Promise<Quiz> 生成的测验题目
 */
export async function generateQuiz(
  content: string,
  questionCount = 4
): Promise<Quiz> {
  const prompt = buildPrompt(content, questionCount);

  const result = await generateObject({
    model: google('gemini-2.5-pro'),
    prompt,
    schema: QuizSchema,
  });

  return result.object;
}

// 示例使用
const sampleContent = `
人工智能的定义可以分为两部分，即"人工"和"智能"。
"人工"即由人设计，为人创造、制造。关于什么是"智能"，较有争议性。这涉及到其它诸如意识、自我、心灵，包括无意识的精神等等问题。
人唯一了解的智能是人本身的智能，这是普遍认同的观点。但是目前，人类对人类自身智能，与对构成人所拥有智能的必要元素的了解都十分有限，因此很难准确定义什么是"人工"制造的"智能"。
因此人工智能的研究往往涉及对人智能本身的研究。其它关于动物或其它人造系统的智能也普遍被认为是人工智能相关的研究课题。
人工智能目前在电脑领域内，得到了愈加广泛的发挥。并在机器人、经济政治决策、控制系统、仿真系统中得到应用。
人工智能也广泛应用于许多不同领域。机器人经营餐馆和商店并修复城市基础设施。人工智能管理运输系统和自动驾驶车辆。
智能平台管理多个城市领域，例如垃圾收集和空气质量监测。事实上，城市人工智能体现在城市空间、基础设施和技术中，将我们的城市变成了无人监督的自治实体。
可以方便地实时实现数字化支持的智能响应服务。
许多城市现在主动利用大数据和人工智能，通过为我们的基础设施提供更好的能源、计算能力和连接性来提高经济回报。
最近，由于人工智能减少了行政成本和时间，许多政府开始将人工智能用于各种公共服务。
例如，移民流程的机器人自动化减少了处理时间并提高了效率。人工智能为地方政府服务带来技术突破。
人工智能代理协助城市规划者基于目标导向的蒙特卡罗树搜索进行场景规划。目标推理人工智能代理提供最佳的土地利用解决方案，帮助人类制定民主的城市土地利用规划。
人工智能利用在线数据来监控和修改环境威胁政策。在2019 年水危机期间，潜在狄利克雷分配方法确定了Twitter (X) 中讨论最多的主题，这是一种朴素的推文分类方法，对干旱的影响和原因、政府响应和潜在解决方案等主题进行了分类。人工智能工具与司法部门的人类法官相辅相成，提供客观、一致的风险评估。
`;

// 运行测试
async function runTest() {
  try {
    console.log('正在生成测验题目...');
    const quiz = await generateQuiz(sampleContent, 4);
    console.log('生成成功！');
    console.log(JSON.stringify(quiz, null, 2));
  } catch (error) {
    console.error('生成失败:', error);
  }
}

// 执行测试
runTest();
