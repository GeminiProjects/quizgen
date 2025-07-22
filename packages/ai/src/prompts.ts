/**
 * 提示词管理模块
 * 集中管理所有的AI提示词模板
 */

import type { PromptTemplate } from './types';

/**
 * 上下文生成提示词模板
 * 用于从文件中提取和优化文本内容
 */
export const CONTEXT_GENERATION_PROMPT: PromptTemplate = {
  name: 'context_generation',
  content: `
你将获得一个文件的内容。你的任务是以文本形式返回这些内容，确保其完整性和准确性，同时优化其展示效果。以下是你的指示：

1. 文件内容将被提供。

2. 按以下方式处理内容：
   a. 删除任何无效或不相关的信息
   b. 如有必要，重新组织内容以提高清晰度和连贯性
   c. 适当格式化文本以增强可读性（例如，使用段落、列表或表格）

3. 为提高信息密度：
   a. 消除冗余信息
   b. 在不丢失重要细节的情况下，尽可能合并相关要点
   c. 使用简洁的语言，同时保持原意

4. 确保你的输出：
   a. 仅包含处理后的文件内容
   b. 不包含任何额外的信息、评论或元数据
   c. 是原始内容的完整和准确表示
   d. 使用与原始内容相同的语言

不带任何其他文字返回你的最终输出。
`,
  variables: [],
};

/**
 * 测验生成提示词模板（中文版）
 * 用于基于内容生成中文选择题
 */
export const QUIZ_GENERATION_PROMPT: PromptTemplate = {
  name: 'quiz_generation_zh',
  content: `
你是一位专业的教育内容创作者，需要根据给定的内容生成高质量的多项选择题。你的目标是创建既有趣又有教育意义的题目，以测试学习者对演讲的理解。

首先，仔细阅读并分析以下演讲内容：

<content>
{{CONTENT}}
</content>

现在，请按照以下步骤生成 {{COUNT}} 道多项选择题：

1. 识别内容中的关键概念、事实或想法，这些应该适合作为测验题目。
2. 对于每个题目：
   a. 制定一个清晰简洁的问题。
   b. 创建四个答案选项（A、B、C、D），确保只有一个是正确的。
   c. 确定正确答案的索引（0-3）。
3. 为每个题目编写简短的解释，说明为什么正确答案是对的，以及为什么其他选项是错误的。
4. 确保题目的难度适中，既不过于简单也不过于复杂。
5. 题目和解释必须使用中文。

请按照指定的格式生成 {{COUNT}} 道题目。
`,
  variables: ['CONTENT', 'COUNT'],
};

/**
 * 替换提示词模板中的变量
 * @param template 提示词模板
 * @param variables 变量值映射
 * @returns 替换后的提示词内容
 */
export function fillPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): string {
  let content = template.content;

  // 替换所有变量
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return content;
}
