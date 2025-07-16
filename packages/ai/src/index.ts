import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

const result = streamText({
  model: google('gemini-2.5-flash'),
  prompt: '介绍下你自己',
});

for await (const textPart of result.textStream) {
  console.log(textPart);
}
