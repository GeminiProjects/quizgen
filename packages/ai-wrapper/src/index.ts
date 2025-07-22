import {
  type FilePart,
  generateObject,
  type LanguageModel,
  type StreamTextResult,
  streamText,
  type ToolSet,
} from 'ai';
import { z } from 'zod';

interface GenerateQuestionsResult {
  success: boolean;
  total: number;
  quizzes: Array<{
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }>;
}

const PROMPT_GENERATE_CONTEXT = `
You will be provided with the content of a file. Your task is to return this content in text form, ensuring it is complete and accurate while optimizing its presentation. Here are your instructions:

1. The file content will be provided.

2. Process the content as follows:
   a. Remove any invalid or irrelevant information
   b. Reorganize the content if necessary to improve clarity and coherence
   c. Format the text appropriately to enhance readability (e.g., use paragraphs, lists, or tables if applicable)

3. To improve information density:
   a. Eliminate redundant information
   b. Combine related points when possible without losing important details
   c. Use concise language while maintaining the original meaning

4. Ensure your output:
   a. Contains only the processed file content
   b. Does not include any additional information, commentary, or metadata
   c. Is a complete and accurate representation of the original content
   d. Is the same language as the original content

Return your final output with no other text.
`;

const PROMPT_GENERATE_QUESTIONS = `
You are tasked with generating multiple-choice questions based on given content. Your goal is to create engaging and informative questions that test understanding of the material.

First, carefully read and analyze the following content:

<content>
{{CONTENT}}
</content>

Now, follow these steps to generate {{COUNT}} multiple-choice questions:

1. Identify key concepts, facts, or ideas from the content that would be suitable for quiz questions.
2. For each question:
   a. Formulate a clear and concise question.
   b. Create four answer options (A, B, C, D), ensuring only one is correct.
   c. Determine the correct answer.
3. Write a brief explanation for why the correct answer is right and why the other options are incorrect.
4. The language of the questions and explanations should be Chinese.

Please generate {{COUNT}} questions following this format and present them one after another.
`;

export const generateQuestions = async (
  model: LanguageModel,
  context: string,
  count: number
): Promise<GenerateQuestionsResult> => {
  const prompt = PROMPT_GENERATE_QUESTIONS.replace(
    '{{CONTENT}}',
    context
  ).replace('{{COUNT}}', count.toString());

  const result = await generateObject({
    model,
    prompt,
    schema: z.object({
      success: z.boolean(),
      total: z.number(),
      quizzes: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          answer: z.number(),
          explanation: z.string(),
        })
      ),
    }),
  });

  return result.object;
};

export const generateContext = (
  model: LanguageModel,
  file: FilePart
): StreamTextResult<ToolSet, never> => {
  return streamText({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: PROMPT_GENERATE_CONTEXT,
          },
          file,
        ],
      },
    ],
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: -1,
          includeThoughts: false,
        },
      },
    },
  });
};
