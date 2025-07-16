**背景:**

我是一名正在学习 `Vercel AI SDK` 的开发者，希望利用它和 `Google Gemini API` 来构建 AI 相关应用。  
我的主要开发语言是 `TypeScript`，并且使用 `Bun` 作为我的运行时环境。  

**你的角色:**

请你扮演一位经验丰富的全栈工程师，同时也是 `Vercel AI SDK` 和 `Google API` 的专家。  
你将作为我的技术导师，耐心并详尽地解答我的问题。

**互动方式:**

*   我会提供我正在学习的 `Vercel AI SDK` 相关文档或我遇到的具体代码问题。
*   请你总是用详细且通俗易懂的中文来解释概念和代码。
*   当提供代码示例时，请确保它们是基于 `TypeScript` 和 `Bun` 环境的，并且是完整、可运行的。
*   除了直接回答问题，也请你主动提供相关的最佳实践、潜在的陷阱以及优化建议。
*   让我们从第一个问题开始。

---
附录: 文档

TITLE: Server Action using `streamUI` with AI SDK OpenAI Provider
DESCRIPTION: This Server Action illustrates the migration to the `streamUI` function from `@ai-sdk/rsc` using the `@ai-sdk/openai` provider. It configures the `gpt-4.1` model, defines system and user messages, and includes a `get_city_weather` tool. The tool uses `zod` for parameter validation and its `generate` key returns a React Server Component (`Spinner` then `Weather`) after fetching data, demonstrating the new API pattern and improved provider flexibility.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-3-1

LANGUAGE: TypeScript
CODE:
```
import { streamUI } from '@ai-sdk/rsc';

import { openai } from '@ai-sdk/openai';

import { z } from 'zod';

import { Spinner, Weather } from '@/components';

import { getWeather } from '@/utils';

async function submitMessage(userInput = 'What is the weather in SF?') {

'use server';

const result = await streamUI({

model: openai('gpt-4.1'),

system: 'You are a helpful assistant',

messages: [{ role: 'user', content: userInput }],

text: ({ content }) => <p>{content}</p>,

tools: {

get_city_weather: {

description: 'Get the current weather for a city',

parameters: z

.object({

city: z.string().describe('Name of the city'),

})

.required(),

generate: async function* ({ city }) {

yield <Spinner />;

const weather = await getWeather(city);

return <Weather info={weather} />;

},

},

},

});

return result.value;

}
```

----------------------------------------

TITLE: Generate Text with AI SDK using OpenAI Model
DESCRIPTION: This code snippet demonstrates how to use the AI SDK's `generateText` function to produce text output from an OpenAI model. It shows the basic setup for importing necessary modules and making an asynchronous call to generate text based on a given prompt.
SOURCE: https://v5.ai-sdk.dev/introduction

LANGUAGE: javascript
CODE:
```
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const { text } = await generateText({
  model: openai("o3-mini"),
  prompt: "What is love?"
})
```

----------------------------------------

TITLE: Install @types/react to resolve JSX namespace error
DESCRIPTION: To fix the 'Cannot find namespace 'JSX'' error, install the `@types/react` package as a dependency. This provides the necessary JSX namespace definitions that the AI SDK currently relies on, allowing your project to compile without this specific TypeScript error.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/typescript-cannot-find-namespace-jsx

LANGUAGE: Shell
CODE:
```
npm install @types/react
```

----------------------------------------

TITLE: Define Chatbot API Route with AI SDK Tools
DESCRIPTION: This server-side API route (`app/api/chat/route.ts`) demonstrates how to use `@ai-sdk/openai` and `ai` to stream text responses with integrated tool definitions. It configures three distinct tools: `getWeatherInformation` (server-side auto-executed), `askForConfirmation` (client-side user interaction), and `getLocation` (client-side auto-executed). The route processes incoming messages, generates tool calls via `streamText`, and returns a UI message stream response.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { z } from 'zod';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

// server-side tool with execute function:

getWeatherInformation: {

description: 'show the weather in a given city to the user',

parameters: z.object({ city: z.string() }),

execute: async ({}: { city: string }) => {

const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];

return weatherOptions[

Math.floor(Math.random() * weatherOptions.length)

];

},

},

// client-side tool that starts user interaction:

askForConfirmation: {

description: 'Ask the user for confirmation.',

parameters: z.object({

message: z.string().describe('The message to ask for confirmation.'),

}),

},

// client-side tool that is automatically executed on the client:

getLocation: {

description:

'Get the user location. Always ask for confirmation before using this tool.',

parameters: z.object({}),

},

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Sequential Processing (Chains) Example with AI SDK
DESCRIPTION: This example demonstrates sequential processing, a workflow pattern where steps are executed in a predefined order. It shows how to generate marketing copy using `generateText`, then perform a quality check on the generated copy using `generateObject` with a Zod schema, and finally, conditionally regenerate the copy with specific instructions if it fails the quality criteria. This illustrates a simple chain of operations with a feedback loop.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { generateText, generateObject } from 'ai';

import { z } from 'zod';

async function generateMarketingCopy(input: string) {

const model = openai('gpt-4o');

// First step: Generate marketing copy

const { text: copy } = await generateText({

model,

prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal.`,

});

// Perform quality check on copy

const { object: qualityMetrics } = await generateObject({

model,

schema: z.object({

hasCallToAction: z.boolean(),

emotionalAppeal: z.number().min(1).max(10),

clarity: z.number().min(1).max(10),

}),

prompt: `Evaluate this marketing copy for:

1. Presence of call to action (true/false)

2. Emotional appeal (1-10)

3. Clarity (1-10)

Copy to evaluate: ${copy}`,

});

// If quality check fails, regenerate with more specific instructions

if (

!qualityMetrics.hasCallToAction ||

qualityMetrics.emotionalAppeal < 7 ||

qualityMetrics.clarity < 7

) {

const { text: improvedCopy } = await generateText({

model,

prompt: `Rewrite this marketing copy with:

${!qualityMetrics.hasCallToAction ? '- A clear call to action' : ''}

${qualityMetrics.emotionalAppeal < 7 ? '- Stronger emotional appeal' : ''}

${qualityMetrics.clarity < 7 ? '- Improved clarity and directness' : ''}

Original copy: ${copy}`,

});

return { copy: improvedCopy, qualityMetrics };

}

return { copy, qualityMetrics };

}
```

----------------------------------------

TITLE: Generate Structured JSON Data with AI SDK and OpenAI o3-mini
DESCRIPTION: This snippet demonstrates how to leverage AI SDK Core's `generateObject` function to produce type-safe, structured JSON output. It shows how to define a schema using Zod and ensure the model's response conforms to it, which is crucial for data extraction and classification tasks.
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';

import { openai } from '@ai-sdk/openai';

import { z } from 'zod';

const { object } = await generateObject({
model: openai('o3-mini'),
schema: z.object({
recipe: z.object({
name: z.string(),
ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
steps: z.array(z.string()),
}),
}),
prompt: 'Generate a lasagna recipe.',
});
```

----------------------------------------

TITLE: AI SDK: Basic Text Prompt Usage
DESCRIPTION: Demonstrates how to use a simple text string as a prompt for AI content generation. The `prompt` property is set directly with a static string, suitable for straightforward generation tasks using AI SDK functions like `generateText`.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
prompt: 'Invent a new holiday and describe its traditions.',
});
```

----------------------------------------

TITLE: API: generateText() function
DESCRIPTION: Generates text and allows calling tools from a language model.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core

LANGUAGE: APIDOC
CODE:
```
generateText(): Generate text and call tools from a language model.
```

----------------------------------------

TITLE: Send Text Content in AI SDK User Message
DESCRIPTION: Demonstrates how to send a simple text string as content in a user message to an AI model using `generateText`. The `content` property can be a string or an array of content parts.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Where can I buy the best Currywurst in Berlin?',
        },
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Configure OpenAI API Key in .env.local
DESCRIPTION: Add your OpenAI API key to the `.env.local` file. The AI SDK's OpenAI provider will automatically use this environment variable for authentication when making requests to the OpenAI service.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: dotenv
CODE:
```
OPENAI_API_KEY=xxxxxxxxx
```

----------------------------------------

TITLE: Combine Multiple Tools for Complex Workflows
DESCRIPTION: Demonstrates how to integrate and use multiple Anthropic tools (computer, bash, text editor) within a single `generateText` request. It shows the setup for each tool and their combined usage to execute a complex task involving file creation, writing, and terminal commands.
SOURCE: https://v5.ai-sdk.dev/guides/computer-use

LANGUAGE: JavaScript
CODE:
```
const computerTool = anthropic.tools.computer_20241022({
...
});
const bashTool = anthropic.tools.bash_20241022({
execute: async ({ command, restart }) => execSync(command).toString()
});
const textEditorTool = anthropic.tools.textEditor_20241022({
execute: async ({
command,
path,
file_text,
insert_line,
new_str,
old_str,
view_range
}) => {
// Handle file operations based on command
switch(command) {
return executeTextEditorFunction({
command,
path,
fileText: file_text,
insertLine: insert_line,
newStr: new_str,
oldStr: old_str,
viewRange: view_range
});
}
}
});
const response = await generateText({
model: anthropic("claude-3-5-sonnet-20241022"),
prompt: "Create a new file called example.txt, write 'Hello World' to it, and run 'cat example.txt' in the terminal",
tools: {
computer: computerTool,
bash: bashTool,
str_replace_editor: textEditorTool
},
});
```

----------------------------------------

TITLE: Create Server Action for Streaming Generative UI with AI SDK RSC
DESCRIPTION: This server-side action uses `streamUI` from `@ai-sdk/rsc` to generate and stream React components based on AI model output. It defines a `getWeather` tool with a Zod schema, demonstrating how to yield loading states and return dynamic components based on tool execution, allowing for a more dynamic and responsive UI.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
'use server';

import { streamUI } from '@ai-sdk/rsc';
import { deepinfra } from '@ai-sdk/deepinfra';
import { z } from 'zod';

export async function streamComponent() {
const result = await streamUI({
model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),
prompt: 'Get the weather for San Francisco',
text: ({ content }) => <div>{content}</div>,
tools: {
getWeather: {
description: 'Get the weather for a location',
parameters: z.object({ location: z.string() }),
generate: async function* ({ location }) {
yield <div>loading...</div>;
const weather = '25c'; // await getWeather(location);
return (
<div>
the weather in {location} is {weather}.
</div>
);
},
},
},
});
return result.value;
}
```

----------------------------------------

TITLE: Generate Structured JSON Data with AI SDK Core
DESCRIPTION: This snippet showcases the AI SDK's capability to generate structured JSON data by constraining model output to a Zod schema. It demonstrates using `generateObject` with the Llama 3.1 70B Instruct model to produce a type-safe recipe object, useful for data extraction or synthetic data generation.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';

import { deepinfra } from '@ai-sdk/deepinfra';

import { z } from 'zod';

const { object } = await generateObject({

model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),

schema: z.object({

recipe: z.object({

name: z.string(),

ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),

steps: z.array(z.string()),

}),

}),

prompt: 'Generate a lasagna recipe.',

});
```

----------------------------------------

TITLE: Generate Text with AI SDK and OpenAI GPT-4o
DESCRIPTION: This snippet demonstrates how to use the AI SDK's `generateText` function to interact with OpenAI's GPT-4o model. It shows a basic prompt to generate a text response, abstracting away provider-specific complexities.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
model: openai.responses('gpt-4o'),
prompt: 'Explain the concept of quantum entanglement.',
});
```

----------------------------------------

TITLE: Stream Text Generation using AI SDK with OpenAI
DESCRIPTION: This code snippet demonstrates how to implement a streaming user interface for text generation using the AI SDK. It utilizes OpenAI's `gpt-4.1` model and the `streamText` function to display parts of the response as they become available, enhancing user experience for larger language models. Dependencies include `@ai-sdk/openai` and `ai`.
SOURCE: https://v5.ai-sdk.dev/foundations/streaming

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText } from 'ai';

const { textStream } = streamText({
model: openai('gpt-4.1'),
prompt: 'Write a poem about embedding models.',
});

for await (const textPart of textStream) {
console.log(textPart);
}
```

----------------------------------------

TITLE: Implement Basic Chat UI with AI SDK React `useChat` Hook
DESCRIPTION: This React component demonstrates a fundamental chat interface using the `@ai-sdk/react` `useChat` hook. It manages messages, user input, and submission to a backend API, displaying conversational flow.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: tsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role === 'user' ? 'User: ' : 'AI: '}</div>
          <div>{message.content}</div>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: AI SDK Tool Definition for Flight Search and UI Rendering
DESCRIPTION: This `searchFlights` tool, defined within `actions.tsx`, allows the AI model to search for flights based on provided source, destination, and date parameters. It uses Zod for input validation and yields a loading message before executing the search. Crucially, it returns a React component (`<Flights />`) to render the search results directly into the AI conversation UI, enabling rich, interactive responses.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
searchFlights: {
  description: 'search for flights',
  parameters: z.object({
    source: z.string().describe('The origin of the flight'),
    destination: z.string().describe('The destination of the flight'),
    date: z.string().describe('The date of the flight'),
  }),
  generate: async function* ({ source, destination, date }) {
    yield `Searching for flights from ${source} to ${destination} on ${date}...`;
    const results = await searchFlights(source, destination, date);
    return (<Flights flights={results} />);
  },
}
```

----------------------------------------

TITLE: Conditionally Rendering React Components from AI Tool Output
DESCRIPTION: This React component demonstrates how to consume the structured JSON output from a language model's tool call. It checks if a message has a 'function' role, extracts the content, and passes it as props to a `<WeatherCard/>` component, enabling dynamic UI updates based on AI responses.
SOURCE: https://v5.ai-sdk.dev/advanced/rendering-ui-with-language-models

LANGUAGE: TypeScript
CODE:
```
return (
  <div>
    {messages.map(message => {
      if (message.role === 'function') {
        const { name, content } = message
        const { temperature, unit, description, forecast } = content;
        return (
          <WeatherCard
            weather={{
              temperature: 47,
              unit: 'F',
              description: 'sunny',
              forecast,
            }}
          />
        )
      }
    })}
  </div>
)
```

----------------------------------------

TITLE: Define and Register a New Stock Tool in AI SDK
DESCRIPTION: This snippet defines a `stockTool` using `createTool` from `@ai-sdk/react`, specifying its description, parameters (a stock symbol), and an asynchronous `execute` function that simulates an API call to fetch stock price. It then updates the main `tools` object to include this new tool alongside an existing `weatherTool`, making it available for the AI model.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: TypeScript
CODE:
```
// Add a new stock tool
export const stockTool = createTool({
  description: 'Get price for a stock',
  parameters: z.object({
    symbol: z.string().describe('The stock symbol to get the price for')
  }),
  execute: async function ({ symbol }) {
    // Simulated API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { symbol, price: 100 };
  }
});

// Update the tools object
export const tools = {
  displayWeather: weatherTool,
  getStockPrice: stockTool
};
```

----------------------------------------

TITLE: AI SDK: Using System Prompts for Model Guidance
DESCRIPTION: Shows how to set a system prompt using the `system` property to provide initial instructions to the AI model. This guides the model's behavior and response style, here demonstrated for a travel itinerary planning assistant, combined with a user prompt.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
system:
`You help planning travel itineraries. ` +
`Respond to the users' request with a list ` +
`of the best stops to make in their destination.`,
prompt:
`I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
`Please suggest the best tourist activities for me to do.`,
});
```

----------------------------------------

TITLE: Stream Text Generations with AI SDK Core
DESCRIPTION: Demonstrates how to use the `streamText` function from `@ai-sdk/openai` to generate and stream text from a language model, suitable for interactive applications like chat bots.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const { textStream } = streamText({
model: openai('gpt-4o'),
prompt: 'Invent a new holiday and describe its traditions.',
});

for await (const textPart of textStream) {
process.stdout.write(textPart);
}
```

----------------------------------------

TITLE: LanguageModelV2: Redesigned LLM Communication Architecture
DESCRIPTION: `LanguageModelV2` represents a complete architectural redesign for how the AI SDK interacts with language models, treating all LLM outputs as unified content parts. This new design enables consistent handling of diverse response types like text, images, and reasoning, offering improved type safety and simplified extensibility for new model capabilities.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: APIDOC
CODE:
```
LanguageModelV2:
  - Content-First Design: All LLM outputs represented as ordered content parts in a unified array.
  - Improved Type Safety: Better TypeScript type guarantees for different content types.
  - Simplified Extensibility: Adding support for new model capabilities without core structure changes.
```

----------------------------------------

TITLE: Stream Object Generation via Route Handler (After Migration)
DESCRIPTION: This API route handler demonstrates the recommended approach for streaming object generations with AI SDK UI. It uses `streamObject` to generate structured data based on a schema and directly returns a `toTextStreamResponse()`, making it compatible with client-side hooks like `useObject`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
import { streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { notificationSchema } from '@/utils/schemas';

export async function POST(req: Request) {
const context = await req.json();

const result = streamObject({
model: openai('gpt-4.1'),
schema: notificationSchema,
prompt:
`Generate 3 notifications for a messages app in this context:` + context,
});

return result.toTextStreamResponse();
}
```

----------------------------------------

TITLE: Generate Text with AI SDK Core
DESCRIPTION: Demonstrates the basic usage of the `generateText` function from AI SDK Core to generate text based on a simple prompt. It shows how to import the function and await the result to get the generated text.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: JavaScript
CODE:
```
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

----------------------------------------

TITLE: Updated Next.js Server Action for Resource Creation with AI Embeddings
DESCRIPTION: This updated `createResource` server action extends the initial functionality by integrating AI embedding generation. After creating a resource, it calls `generateEmbeddings` on the resource content and then stores these embeddings in a separate `embeddings` table, linking them to the newly created resource. This enables AI-powered features like semantic search or recommendations.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: TypeScript
CODE:
```
'use server';

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from '@/lib/db/schema/resources';
import { db } from '../db';
import { generateEmbeddings } from '../ai/embedding';
import { embeddings as embeddingsTable } from '../db/schema/embeddings';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);
    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();
    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map(embedding => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );
    return 'Resource successfully created and embedded.';
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.';
  }
};
```

----------------------------------------

TITLE: Generate Text with OpenAI Model using AI SDK
DESCRIPTION: This snippet demonstrates how to generate text using the `generateText` function from the AI SDK. It imports the necessary `generateText` utility and the `openai` provider, then calls `generateText` with a specific OpenAI model and a prompt to receive a text response.
SOURCE: https://v5.ai-sdk.dev/foundations/overview

LANGUAGE: TypeScript
CODE:
```
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

const { text } = await generateText({
  model: openai("o3-mini"),
  prompt: "What is love?"
})
```

----------------------------------------

TITLE: createAI Function
DESCRIPTION: Creates a context provider that wraps your application, enabling shared state between the client and the language model on the server.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc

LANGUAGE: APIDOC
CODE:
```
createAI()
  Description: Create a context provider that wraps your application and shares state between the client and language model on the server.
```

----------------------------------------

TITLE: JavaScript: Language Model Routing with Dynamic Search Parameters
DESCRIPTION: This example illustrates how a language model can generate function calls with dynamic parameters, such as `searchImages("Van Gogh")`, based on conversational user input. It demonstrates the model's ability to act as a router, directing the application flow by calling appropriate functions with extracted data.
SOURCE: https://v5.ai-sdk.dev/advanced/model-as-router

LANGUAGE: javascript
CODE:
```
searchImages("Van Gogh");
searchImages("Monet");
```

----------------------------------------

TITLE: Next.js Frontend Chat UI with AI SDK useChat Hook
DESCRIPTION: This React component (app/page.tsx) demonstrates how to build a chat interface in a Next.js application using the @ai-sdk/react useChat hook. It manages chat messages, user input, and submission, displaying conversations between the user and the AI. The hook automatically handles requests to the backend API route.
SOURCE: https://v5.ai-sdk.dev/guides/o1

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
```

----------------------------------------

TITLE: Generate Structured Data with AI SDK's generateObject
DESCRIPTION: Demonstrates how to use `generateObject` to generate structured data (a recipe) based on a Zod schema. The schema is also used to validate the generated data, ensuring type safety and correctness.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: typescript
CODE:
```
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: yourModel,
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string())
    })
  }),
  prompt: 'Generate a lasagna recipe.'
});
```

----------------------------------------

TITLE: Client-Side Chat Interface with AI SDK `useChat` Hook
DESCRIPTION: This snippet demonstrates how to integrate the `@ai-sdk/react` `useChat` hook into a Next.js client component. It sets up a basic chat interface, managing message display, user input, and form submission, automatically handling AI responses and parallel/multi-step tool calls.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {

const { messages, input, setInput, handleSubmit } = useChat();

return (

<div>

{messages.map(message => (

<div key={message.id}>

<div>{message.role}</div>

<div>{message.content}</div>

</div>

))}

<form onSubmit={handleSubmit}>

<input

type="text"

value={input}

onChange={event => {

setInput(event.target.value);

}}

/>

<button type="submit">Send</button>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Server-Side UI Generation with AI SDK RSC
DESCRIPTION: This snippet demonstrates how to use `@ai-sdk/rsc` to generate and stream React components from the server based on a language model's tool call. It showcases `createStreamableUI` for creating a streamable UI, defines a `getWeather` tool with Zod for parameter validation, and renders a `<WeatherCard/>` component which is then streamed to the client.
SOURCE: https://v5.ai-sdk.dev/advanced/rendering-ui-with-language-models

LANGUAGE: TypeScript
CODE:
```
import { createStreamableUI } from '@ai-sdk/rsc'

const uiStream = createStreamableUI();

const text = generateText({

model: openai('gpt-3.5-turbo'),

system: 'you are a friendly assistant',

prompt: 'what is the weather in SF?',

tools: {

getWeather: {

description: 'Get the weather for a location',

parameters: z.object({

city: z.string().describe('The city to get the weather for'),

unit: z

.enum(['C', 'F'])

.describe('The unit to display the temperature in')

}),

execute: async ({ city, unit }) => {

const weather = getWeather({ city, unit })

const { temperature, unit, description, forecast } = weather

uiStream.done(

<WeatherCard

weather={{

temperature: 47,

unit: 'F',

description: 'sunny',

forecast,

}}

/>

)

}

}

}

})

return {

display: uiStream.value

}
```

----------------------------------------

TITLE: Generate Slogans with Few-Shot Examples
DESCRIPTION: Demonstrates the power of incorporating examples into a prompt to guide the LLM. This technique helps the model understand desired patterns and subtleties, leading to more appropriate and creative outputs.
SOURCE: https://v5.ai-sdk.dev/advanced/prompt-engineering

LANGUAGE: Prompt
CODE:
```
Create three slogans for a business with unique features.
Business: Bookstore with cats
Slogans: "Purr-fect Pages", "Books and Whiskers", "Novels and Nuzzles"
Business: Gym with rock climbing
Slogans: "Peak Performance", "Reach New Heights", "Climb Your Way Fit"
Business: Coffee shop with live music
Slogans:
```

----------------------------------------

TITLE: Cache OpenAI Responses with AI SDK Lifecycle Callbacks and Upstash Redis
DESCRIPTION: This TypeScript example demonstrates how to implement response caching for OpenAI models using the AI SDK's `onFinish` lifecycle callback. It leverages Upstash Redis to store and retrieve AI generated text, preventing redundant API calls for identical requests. The `POST` function checks for a cached response before calling the language model, and then caches the new response for 1 hour upon completion.
SOURCE: https://v5.ai-sdk.dev/advanced/caching

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { formatDataStreamPart, streamText, UIMessage } from 'ai';
import { Redis } from '@upstash/redis';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_TOKEN,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // come up with a key based on the request:
  const key = JSON.stringify(messages);

  // Check if we have a cached response
  const cached = await redis.get(key);
  if (cached != null) {
    return new Response(formatDataStreamPart('text', cached), {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Call the language model:
  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    async onFinish({ text }) {
      // Cache the response text:
      await redis.set(key, text);
      await redis.expire(key, 60 * 60);
    },
  });

  // Respond with the stream
  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Frontend Text Stream with useCompletion (Next.js Client Component)
DESCRIPTION: This Next.js client component demonstrates how to use the `useCompletion` hook from `@ai-sdk/react` to handle text streams. It configures `streamProtocol` to 'text' and displays the streamed completion in a div.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/stream-protocol

LANGUAGE: tsx
CODE:
```
'use client';

import { useCompletion } from '@ai-sdk/react';

export default function Page() {

const { completion, input, handleInputChange, handleSubmit } = useCompletion({

streamProtocol: 'text',

});

return (

<form onSubmit={handleSubmit}>

<input name="prompt" value={input} onChange={handleInputChange} />

<button type="submit">Submit</button>

<div>{completion}</div>

</form>

);

}
```

----------------------------------------

TITLE: Implement AI Chat UI with useChat Hook in Next.js
DESCRIPTION: This client-side React component uses the `useChat` hook from `@ai-sdk/react` to manage chat state, input, and submission. It renders messages from the AI and user, and provides an input field and submit button for user interaction, enabling a seamless real-time chat experience.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
const { messages, input, handleInputChange, handleSubmit } = useChat();

return (
<>
{messages.map(message => (
<div key={message.id}>
{message.role === 'user' ? 'User: ' : 'AI: '}
{message.content}
</div>
))}
<form onSubmit={handleSubmit}>
<input name="prompt" value={input} onChange={handleInputChange} />
<button type="submit">Submit</button>
</form>
</>
);
}
```

----------------------------------------

TITLE: AI SDK Chat API Reference
DESCRIPTION: Comprehensive documentation for the parameters, return values, and data structures used in the AI SDK's chat functionality, likely associated with a `useChat` hook. It covers configuration options, message formats, and tool call handling.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-chat

LANGUAGE: APIDOC
CODE:
```
API Parameters:
  api?: string = '/api/chat'
    The API endpoint that is called to generate chat responses. It can be a relative path (starting with '/') or an absolute URL.
  id?: string
    An unique identifier for the chat. If not provided, a random one will be generated. When provided, the `useChat` hook with the same `id` will have shared states across components. This is useful when you have multiple components showing the same chat stream.
  initialInput?: string = ''
    An optional string for the initial prompt input.
  initialMessages?: Messages[] = []
    An optional array of initial chat messages
  onToolCall?: ({toolCall: ToolCall}) => void | unknown| Promise<unknown>
    Optional callback function that is invoked when a tool call is received. Intended for automatic client-side tool execution. You can optionally return a result for the tool call, either synchronously or asynchronously.
  onResponse?: (response: Response) => void
    An optional callback that will be called with the response from the API endpoint. Useful for throwing customized errors or logging
  onFinish?: (message: Message, options: OnFinishOptions) => void
    An optional callback function that is called when the completion stream ends.
  onError?: (error: Error) => void
    A callback that will be called when the chat stream encounters an error. Optional.
  generateId?: () => string
    A custom id generator for message ids and the chat id. Optional.
  headers?: Record<string, string> | Headers
    Additional headers to be passed to the API endpoint. Optional.
  body?: any
    Additional body object to be passed to the API endpoint. Optional.
  credentials?: 'omit' | 'same-origin' | 'include'
    An optional literal that sets the mode of credentials to be used on the request. Defaults to same-origin.
  maxSteps?: number
    Maximum number of backend calls to generate a response. A maximum number is required to prevent infinite loops in the case of misconfigured tools. By default, it is set to 1.
  streamProtocol?: 'text' | 'data'
    An optional literal that sets the type of stream to be used. Defaults to `data`. If set to `text`, the stream will be treated as a text stream.
  fetch?: FetchFunction
    Optional. A custom fetch function to be used for the API call. Defaults to the global fetch function.
  experimental_prepareRequestBody?: (options: { messages: UIMessage[]; requestData?: JSONValue; requestBody?: object, chatId: string }) => unknown
    Experimental. When a function is provided, it will be used to prepare the request body for the chat API. This can be useful for customizing the request body based on the messages and data in the chat.
  experimental_throttle?: number
    React only. Custom throttle wait time in milliseconds for the message and data updates. When specified, updates will be throttled using this interval. Defaults to undefined (no throttling).

OnFinishOptions:
  usage: CompletionTokenUsage
    The token usage for the completion.
  promptTokens: number
    The total number of tokens in the prompt.
  completionTokens: number
    The total number of tokens in the completion.
  totalTokens: number
    The total number of tokens generated.
  finishReason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'
    The reason why the generation ended.

Return Values (from useChat hook):
  messages: UIMessage[]
    The current array of chat messages.
  id: string
    The unique identifier of the message.
  role: 'system' | 'user' | 'assistant' | 'data'
    The role of the message.
  createdAt?: Date
    The creation date of the message.
  content: string
    The content of the message.
  annotations?: Array<JSONValue>
    Additional annotations sent along with the message.
  parts: Array<TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | StepStartUIPart>
    An array of message parts that are associated with the message.

UIMessage Part Types:
  TextUIPart:
    type: "text"
    text: string
      The text content of the part.
  ReasoningUIPart:
    type: "reasoning"
    reasoning: string
      The reasoning content of the part.
  ToolInvocationUIPart:
    type: "tool-invocation"
    toolInvocation: ToolInvocation

ToolInvocation (Partial Call):
  state: 'partial-call'
    The state of the tool call when it was partially created.
  toolCallId: string
    ID of the tool call. This ID is used to match the tool call with the tool result.
  toolName: string
    Name of the tool that is being called.
  args: any
    Partial arguments of the tool call. This is a JSON-serializable object.

ToolInvocation (Full Call):
  state: 'call'
    The state of the tool call when it was fully created.
  toolCallId: string
    ID of the tool call. This ID is used to match the tool call with the tool result.
  toolName: string
    Name of the tool that is being called.
```

----------------------------------------

TITLE: Implement Multi-Step Agent with stopWhen for Math Problems
DESCRIPTION: This example demonstrates how to create an AI agent that solves math problems iteratively using the `stopWhen` parameter with `stepCountIs`. It integrates a `calculate` tool powered by `math.js` to evaluate mathematical expressions, allowing the LLM to reason step-by-step and use the tool as needed to arrive at a final, explained answer.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import * as mathjs from 'mathjs';
import { z } from 'zod';

const { text: answer } = await generateText({
  model: openai('gpt-4o-2024-08-06'),
  tools: {
    calculate: tool({
      description:
        'A tool for evaluating mathematical expressions. ' +
        'Example expressions: ' +
        "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      parameters: z.object({ expression: z.string() }),
      execute: async ({ expression }) => mathjs.evaluate(expression),
    }),
  },
  stopWhen: stepCountIs(10),
  system:
    'You are solving math problems. ' +
    'Reason step by step. ' +
    'Use the calculator when necessary. ' +
    'When you give the final answer, ' +
    'provide an explanation for how you arrived at it.',
  prompt:
    'A taxi driver earns $9461 per 1-hour of work. ' +
    'If he works 12 hours a day and in 1 hour ' +
    'he uses 12 liters of petrol with a price  of $134 for 1 liter. ' +
    'How much money does he earn in one day?',
});

console.log(`ANSWER: ${answer}`);
```

----------------------------------------

TITLE: Create .env.local File for OpenAI API Key
DESCRIPTION: This command creates an empty `.env.local` file in the project root. This file will be used to store sensitive environment variables, such as the OpenAI API key, which the AI SDK's OpenAI Provider will automatically use for authentication.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: shell
CODE:
```
touch .env.local
```

----------------------------------------

TITLE: Calling Server Action `sendMessage` from Client with `useActions` Hook
DESCRIPTION: This React client component demonstrates how to use the `useActions` hook from `@ai-sdk/rsc` to invoke a server action named `sendMessage`. It manages UI state using `useUIState` to display user inputs and AI responses, ensuring the UI updates correctly after the server action call. The example includes a form for user input and a list to display messages.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useActions, useUIState } from '@ai-sdk/rsc';

import { AI } from './ai';

export default function Page() {
  const { sendMessage } = useActions<typeof AI>();
  const [messages, setMessages] = useUIState();

  const handleSubmit = async event => {
    event.preventDefault();
    setMessages([
      ...messages,
      { id: Date.now(), role: 'user', display: event.target.message.value },
    ]);

    const response = await sendMessage(event.target.message.value);
    setMessages([
      ...messages,
      { id: Date.now(), role: 'assistant', display: response },
    ]);
  };

  return (
    <>
      <ul>
        {messages.map(message => (
          <li key={message.id}>{message.display}</li>
        ))}
      </ul>
      <form onSubmit={handleSubmit}>
        <input type="text" name="message" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
```

----------------------------------------

TITLE: Create Server-Side Chat API Route with AI SDK
DESCRIPTION: Implement a server-side API route (`server/api/chat.ts`) that leverages the AI SDK to stream text responses from an OpenAI model. This route handles incoming messages, converts them for the model, and streams the generated text back to the client.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: typescript
CODE:
```
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default defineLazyEventHandler(async () => {
const apiKey = useRuntimeConfig().openaiApiKey;
if (!apiKey) throw new Error('Missing OpenAI API key');

const openai = createOpenAI({
apiKey: apiKey,
});

return defineEventHandler(async (event: any) => {
const { messages }: { messages: UIMessage[] } = await readBody(event);
const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
});

return result.toUIMessageStreamResponse();
});
});
```

----------------------------------------

TITLE: Client-side Chatbot with useChat and Dynamic Tool UI
DESCRIPTION: This React component demonstrates a client-side chatbot using @ai-sdk/react's useChat hook. It showcases how to define and execute client-side tools via onToolCall (e.g., getLocation), manage multi-step tool interactions with maxSteps, and dynamically render different states of tool invocations (text, tool-invocation with call, partial-call, result states for askForConfirmation, getLocation, getWeatherInformation) within the chat UI.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit, addToolResult } =

useChat({

maxSteps: 5,

// run client-side tools that are automatically executed:

async onToolCall({ toolCall }) {

if (toolCall.toolName === 'getLocation') {

const cities = [

'New York',

'Los Angeles',

'Chicago',

'San Francisco',

];

return cities[Math.floor(Math.random() * cities.length)];

}

},

});

return (

<>

{messages?.map(message => (

<div key={message.id}>

<strong>{`${message.role}: `}</strong>

{message.parts.map(part => {

switch (part.type) {

// render text parts as simple text:

case 'text':

return part.text;

// for tool invocations, distinguish between the tools and the state:

case 'tool-invocation': {

const callId = part.toolInvocation.toolCallId;

switch (part.toolInvocation.toolName) {

case 'askForConfirmation': {

switch (part.toolInvocation.state) {

case 'call':

return (

<div key={callId}>

{part.toolInvocation.args.message}

<div>

<button

onClick={() =>

addToolResult({

toolCallId: callId,

result: 'Yes, confirmed.',

})

}

>

Yes

</button>

<button

onClick={() =>

addToolResult({

toolCallId: callId,

result: 'No, denied',

})

}

>

No

</button>

</div>

</div>

);

case 'result':

return (

<div key={callId}>

Location access allowed:{' '}

{part.toolInvocation.result}

</div>

);

}

break;

}

case 'getLocation': {

switch (part.toolInvocation.state) {

case 'call':

return <div key={callId}>Getting location...</div>;

case 'result':

return (

<div key={callId}>

Location: {part.toolInvocation.result}

</div>

);

}

break;

}

case 'getWeatherInformation': {

switch (part.toolInvocation.state) {

// example of pre-rendering streaming tool calls:

case 'partial-call':

return (

<pre key={callId}>

{JSON.stringify(part.toolInvocation, null, 2)}

</pre>

);

case 'call':

return (

<div key={callId}>

Getting weather information for{' '}

{part.toolInvocation.args.city}...

</div>

);

case 'result':

return (

<div key={callId}>

Weather in {part.toolInvocation.args.city}:{' '}

{part.toolInvocation.result}

</div>

);

}

break;

}

}

}

}

})}

<br />

</div>

))}

<form onSubmit={handleSubmit}>

<input value={input} onChange={handleInputChange} />

</form>

</>

);

}
```

----------------------------------------

TITLE: Rendering AI SDK 4.2 Message Parts with useChat Hook
DESCRIPTION: Example React component demonstrating how to iterate through the new `message.parts` array from the `useChat` hook to render different types of multi-modal AI responses in the UI, including text, source, reasoning, tool invocations, and files.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-4-2

LANGUAGE: JavaScript
CODE:
```
function Chat() {

const { messages } = useChat();

return (

<div>

{messages.map(message =>

message.parts.map((part, i) => {

switch (part.type) {

case 'text':

return <p key={i}>{part.text}</p>;

case 'source':

return <p key={i}>{part.source.url}</p>;

case 'reasoning':

return <div key={i}>{part.reasoning}</div>;

case 'tool-invocation':

return <div key={i}>{part.toolInvocation.toolName}</div>;

case 'file':

return (

<img

key={i}

src={`data:${part.mediaType};base64,${part.data}`}

/>

);

}

}),

)}

</div>

);

}
```

----------------------------------------

TITLE: Implement AI Chat Route Handler in Next.js
DESCRIPTION: This TypeScript code defines a Next.js API route handler at `/api/chat` for streaming text responses from an OpenAI model. It processes incoming chat messages, converts them for the model, and streams the generated text back to the client.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-app-router

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();
const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
});
return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Implement Multi-Tool AI Chatbot with AI SDK in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to extend an AI chatbot application to include multiple tools, specifically a 'weather' tool and a 'convertCelsiusToFahrenheit' tool. It uses `@ai-sdk/openai` for model interaction and `zod` for tool parameter validation. The `streamText` function is configured to enable multi-step tool calls, allowing the AI model to sequentially use different tools (e.g., get weather then convert temperature) to fulfill complex user requests. The `onStepFinish` callback logs each step of the tool execution for debugging.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
input: process.stdin,
output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
while (true) {
const userInput = await terminal.question('You: ');
messages.push({ role: 'user', content: userInput });

const result = streamText({
model: openai('gpt-4o'),
messages,
tools: {
weather: tool({
description: 'Get the weather in a location (in Celsius)',
parameters: z.object({
location: z
.string()
.describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: Math.round((Math.random() * 30 + 5) * 10) / 10, // Random temp between 5°C and 35°C
}),
}),
convertCelsiusToFahrenheit: tool({
description: 'Convert a temperature from Celsius to Fahrenheit',
parameters: z.object({
celsius: z
.number()
.describe('The temperature in Celsius to convert'),
}),
execute: async ({ celsius }) => {
const fahrenheit = (celsius * 9) / 5 + 32;
return { fahrenheit: Math.round(fahrenheit * 100) / 100 };
},
}),
},
stopWhen: stepCountIs(5),
onStepFinish: step => {
console.log(JSON.stringify(step, null, 2));
},
});

let fullResponse = '';
process.stdout.write('\nAssistant: ');
for await (const delta of result.textStream) {
fullResponse += delta;
process.stdout.write(delta);
}
process.stdout.write('\n\n');
messages.push({ role: 'assistant', content: fullResponse });
}
}

main().catch(console.error);
```

----------------------------------------

TITLE: Implement Tool Calling with AI SDK and GPT-4.5
DESCRIPTION: This snippet illustrates how to integrate tool calling with the AI SDK, allowing GPT-4.5 to interact with external systems and perform discrete tasks. The `getWeather` tool demonstrates fetching (simulated) real-time data based on model prompts, enhancing the model's ability to provide accurate and up-to-date information.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: TypeScript
CODE:
```
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { text } = await generateText({
model: openai('gpt-4.5-preview'),
prompt: 'What is the weather like today in San Francisco?',
tools: {
getWeather: tool({
description: 'Get the weather in a location',
parameters: z.object({
location: z.string().describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: 72 + Math.floor(Math.random() * 21) - 10,
}),
}),
},
});
```

----------------------------------------

TITLE: Implement AI Chat UI in Next.js with AI SDK useChat Hook
DESCRIPTION: This snippet shows how to integrate the `useChat` hook from `@ai-sdk/react` into a Next.js page (`app/page.tsx`). It demonstrates how to manage chat messages, input, and form submission to create an interactive chat interface that communicates with the backend API route.
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
```

----------------------------------------

TITLE: Implement Chat UI with AI SDK's useChat Hook in Next.js
DESCRIPTION: This code snippet demonstrates how to set up a chat interface in a Next.js application using the `@ai-sdk/react`'s `useChat` hook. It displays chat messages and provides an input field for user interaction, automatically connecting to the `/api/chat` POST route. It handles message rendering based on role and part type.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: typescript
CODE:
```
import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: Migrate AI Models with AI SDK: OpenAI to DeepInfra Llama
DESCRIPTION: Demonstrates the AI SDK's unified API for switching between different AI models and providers. This example shows how to migrate a text generation call from OpenAI's GPT-4.1 to Meta's Llama 3.1-70B-Instruct hosted on DeepInfra, emphasizing the minimal code changes required due to the consistent `generateText` function.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
model: openai('gpt-4.1'),
prompt: 'What is love?',
});
```

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';
import { deepinfra } from '@ai-sdk/deepinfra';

const { text } = await generateText({
model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),
prompt: 'What is love?',
});
```

----------------------------------------

TITLE: Implement Sequential AI Actions with AI SDK
DESCRIPTION: This example demonstrates how to create a sequential chain using the `@ai-sdk/openai` package. It shows three dependent `generateText` calls: first for generating blog post ideas, then picking the best idea from the generated list, and finally creating a detailed outline based on the chosen idea. Each step's output is directly used as input for the next step's prompt.
SOURCE: https://v5.ai-sdk.dev/advanced/sequential-generations

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { generateText } from 'ai';

async function sequentialActions() {
  // Generate blog post ideas
  const ideasGeneration = await generateText({
    model: openai('gpt-4o'),
    prompt: 'Generate 10 ideas for a blog post about making spaghetti.',
  });
  console.log('Generated Ideas:\n', ideasGeneration);

  // Pick the best idea
  const bestIdeaGeneration = await generateText({
    model: openai('gpt-4o'),
    prompt: `Here are some blog post ideas about making spaghetti:\n\n${ideasGeneration}\n\nPick the best idea from the list above and explain why it's the best.`,
  });
  console.log('\nBest Idea:\n', bestIdeaGeneration);

  // Generate an outline
  const outlineGeneration = await generateText({
    model: openai('gpt-4o'),
    prompt: `We've chosen the following blog post idea about making spaghetti:\n\n${bestIdeaGeneration}\n\nCreate a detailed outline for a blog post based on this idea.`,
  });
  console.log('\nBlog Post Outline:\n', outlineGeneration);
}

sequentialActions().catch(console.error);
```

----------------------------------------

TITLE: Create Chat Endpoint Route Handler with Anthropic
DESCRIPTION: Defines a Next.js API route handler (`app/api/chat/route.ts`) responsible for processing incoming user messages and streaming text responses from the Anthropic Claude 3.7 Sonnet model. It converts UI messages to model messages and can forward reasoning tokens to the client.
SOURCE: https://v5.ai-sdk.dev/guides/sonnet-3-7

LANGUAGE: TypeScript
CODE:
```
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({
model: anthropic('claude-3-7-sonnet-20250219'),
messages: convertToModelMessages(messages),
providerOptions: {
anthropic: {
thinking: { type: 'enabled', budgetTokens: 12000 },
} satisfies AnthropicProviderOptions,
},
});

return result.toUIMessageStreamResponse({
sendReasoning: true,
});
}
```

----------------------------------------

TITLE: Generic Error Handler Function for AI SDK
DESCRIPTION: Defines a reusable `errorHandler` function that safely converts various error types (null, string, Error instances, or other objects) into a human-readable string message. This function is designed to be used with AI SDK's error handling mechanisms.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/use-chat-an-error-occurred

LANGUAGE: TypeScript
CODE:
```
export function errorHandler(error: unknown) {

if (error == null) {

return 'unknown error';

}

if (typeof error === 'string') {

return error;

}

if (error instanceof Error) {

return error.message;

}

return JSON.stringify(error);

}
```

----------------------------------------

TITLE: Install AI SDK and OpenAI Provider for Next.js
DESCRIPTION: This command installs the necessary AI SDK packages, including the core SDK, OpenAI provider, and React bindings, for a Next.js application.
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: Shell
CODE:
```
pnpm install ai@alpha @ai-sdk/openai@alpha @ai-sdk/react@alpha
```

----------------------------------------

TITLE: Client-side Chatbot with useChat and Tool Handling
DESCRIPTION: This snippet demonstrates a client-side React component using `@ai-sdk/react`'s `useChat` hook. It shows how to handle real-time message streaming, implement client-side tools like `getLocation` and `askForConfirmation` using `onToolCall` and `addToolResult`, and render different states of tool invocations (call, partial-call, result) in the UI. It also highlights the use of `maxSteps` for multi-turn tool interactions.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: tsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit, addToolResult } =

useChat({

maxSteps: 5,

// run client-side tools that are automatically executed:

async onToolCall({ toolCall }) {

if (toolCall.toolName === 'getLocation') {

const cities = [

'New York',

'Los Angeles',

'Chicago',

'San Francisco',

];

return cities[Math.floor(Math.random() * cities.length)];

}

},

});

return (

<>

{messages?.map(message => (

<div key={message.id}>

<strong>{`${message.role}: `}</strong>

{message.parts.map(part => {

switch (part.type) {

// render text parts as simple text:

case 'text':

return part.text;

// for tool invocations, distinguish between the tools and the state:

case 'tool-invocation': {

const callId = part.toolInvocation.toolCallId;

switch (part.toolInvocation.toolName) {

case 'askForConfirmation': {

switch (part.toolInvocation.state) {

case 'call':

return (

<div key={callId}>

{part.toolInvocation.args.message}

<div>

<button

onClick={() =>

addToolResult({

toolCallId: callId,

result: 'Yes, confirmed.',

})

}

>

Yes

</button>

<button

onClick={() =>

addToolResult({

toolCallId: callId,

result: 'No, denied',

})

}

>

No

</button>

</div>

</div>

);

case 'result':

return (

<div key={callId}>

Location access allowed:{' '}

{part.toolInvocation.result}

</div>

);

}

break;

}

case 'getLocation': {

switch (part.toolInvocation.state) {

case 'call':

return <div key={callId}>Getting location...</div>;

case 'result':

return (

<div key={callId}>

Location: {part.toolInvocation.result}

</div>

);

}

break;

}

case 'getWeatherInformation': {

switch (part.toolInvocation.state) {

// example of pre-rendering streaming tool calls:

case 'partial-call':

return (

<pre key={callId}>

{JSON.stringify(part.toolInvocation, null, 2)}

</pre>

);

case 'call':

return (

<div key={callId}>

Getting weather information for{' '}

{part.toolInvocation.args.city}...

</div>

);

case 'result':

return (

<div key={callId}>

Weather in {part.toolInvocation.args.city}:{' '}

{part.toolInvocation.result}

</div>

);

}

break;

}

}

}

}

})}

<br />

</div>

))}

<form onSubmit={handleSubmit}>

<input value={input} onChange={handleInputChange} />

</form>

</>

);

}
```

----------------------------------------

TITLE: AI Model Prompt for PostgreSQL SQL Query Generation
DESCRIPTION: This prompt provides an AI model with a detailed PostgreSQL database schema for the 'unicorns' table, along with specific instructions for generating SQL retrieval queries. It includes rules for case-insensitive string matching using ILIKE, handling comma-separated lists, interpreting numerical values like valuation, and ensuring query outputs are suitable for data visualization with at least two columns.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: Prompt
CODE:
```
You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:

unicorns (

id SERIAL PRIMARY KEY,

company VARCHAR(255) NOT NULL UNIQUE,

valuation DECIMAL(10, 2) NOT NULL,

date_joined DATE,

country VARCHAR(255) NOT NULL,

city VARCHAR(255) NOT NULL,

industry VARCHAR(255) NOT NULL,

select_investors TEXT NOT NULL

);

Only retrieval queries are allowed.

For things like industry, company names and other string fields, use the ILIKE operator and convert both the search term and the field to lowercase using LOWER() function. For example: LOWER(industry) ILIKE LOWER('%search_term%').

Note: select_investors is a comma-separated list of investors. Trim whitespace to ensure you're grouping properly. Note, some fields may be null or have only one value.

When answering questions about a specific field, ensure you are selecting the identifying column (ie. what is Vercel's valuation would select company and valuation').

The industries available are:

- healthcare & life sciences

- consumer & retail

- financial services

- enterprise tech

- insurance

- media & entertainment

- industrials

- health

If the user asks for a category that is not in the list, infer based on the list above.

Note: valuation is in billions of dollars so 10b would be 10.0.

Note: if the user asks for a rate, return it as a decimal. For example, 0.1 would be 10%.

If the user asks for 'over time' data, return by year.

When searching for UK or USA, write out United Kingdom or United States respectively.

EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column. If the user asks for a rate, return the rate as a decimal. For example, 0.1 would be 10%.
```

----------------------------------------

TITLE: Generate Text with Advanced Prompts in AI SDK Core
DESCRIPTION: Illustrates how to use the `generateText` function with a system prompt to guide the model's behavior and a user prompt for the specific task. This allows for more controlled and complex text generation, such as summarizing articles with a specific writing style.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: JavaScript
CODE:
```
import { generateText } from 'ai';

const { text } = await generateText({
  model: yourModel,
  system:
    'You are a professional writer. ' +
    'You write simple, clear, and concise content.',
  prompt: `Summarize the following article in 3-5 sentences: ${article}`,
});
```

----------------------------------------

TITLE: Define a Tool with `tool()` for Type Inference in AI SDK
DESCRIPTION: This snippet demonstrates how to use the `tool` helper function from the AI SDK to define a tool with a Zod schema for parameters and an asynchronous `execute` method. It highlights how `tool` enables TypeScript to correctly infer the types of the `execute` method's arguments based on the defined parameters, ensuring type safety and developer experience.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/tool

LANGUAGE: TypeScript
CODE:
```
import { tool } from 'ai';
import { z } from 'zod';

export const weatherTool = tool({
  description: 'Get the weather in a location',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for')
  }),
  // location below is inferred to be a string:
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10
  })
});
```

----------------------------------------

TITLE: Create Server Action to Generate Chart Configuration with AI
DESCRIPTION: This TypeScript Server Action (`generateChartConfig`) takes SQL query results and a user's natural language query as input. It uses an OpenAI model (`gpt-4o`) with the previously defined `configSchema` to generate a chart configuration object. The action includes a system prompt to guide the AI and handles error logging.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...other imports... */
import { Config, configSchema, explanationsSchema, Result } from '@/lib/types';

/* ...rest of the file... */

export const generateChartConfig = async (
results: Result[],
userQuery: string,
) => {
'use server';
try {
const { object: config } = await generateObject({
model: openai('gpt-4o'),
system: 'You are a data visualization expert.',
prompt: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.

For multiple groups use multi-lines.

Here is an example complete config:

export const chartConfig = {
	type: "pie",
	xKey: "month",
	yKeys: ["sales", "profit", "expenses"],
	colors: {
		sales: "#4CAF50",    // Green for sales
		profit: "#2196F3",   // Blue for profit
		expenses: "#F44336"  // Red for expenses
	},
	legend: true
}

User Query:

${userQuery}

Data:

${JSON.stringify(results, null, 2)}`,
schema: configSchema,
});

// Override with shadcn theme colors
const colors: Record<string, string> = {};
config.yKeys.forEach((key, index) => {
colors[key] = `hsl(var(--chart-${index + 1}))`;
});

const updatedConfig = { ...config, colors };

return { config: updatedConfig };
} catch (e) {
console.error(e);
throw new Error('Failed to generate chart suggestion');
}
};
```

----------------------------------------

TITLE: Next.js Frontend Chat UI with AI SDK useChat Hook
DESCRIPTION: This React component demonstrates how to build a conversational user interface using the AI SDK's `useChat` hook. It manages chat messages, input state, and handles form submission, automatically sending messages to a `/api/chat` endpoint and updating the UI with streaming responses. This provides a foundational structure for a chatbot application.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';
import { defaultChatStoreOptions } from 'ai';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    chatStore: defaultChatStoreOptions({
      api: '/api/chat',
    }),
  });

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="space-y-4">
        {messages.map(m => (
          <div key={m.id} className="whitespace-pre-wrap">
            <div>
              <div className="font-bold">{m.role}</div>
              <p>{m.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: Install AI SDK and OpenAI Provider Dependencies
DESCRIPTION: This command installs the core AI SDK package (ai), the OpenAI provider (@ai-sdk/openai), zod for type-safe schemas, and dotenv for environment variable management. It also includes development dependencies like @types/node, tsx, and typescript for running TypeScript code.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: bash
CODE:
```
pnpm add ai@alpha @ai-sdk/openai@alpha zod dotenv

pnpm add -D @types/node tsx typescript
```

----------------------------------------

TITLE: Implement AI Chat Route Handler (Next.js App Router)
DESCRIPTION: Create a Next.js Route Handler at `app/api/chat/route.ts` to handle incoming chat requests. This handler uses the AI SDK's `streamText` function with the OpenAI `gpt-4o` model to stream conversational responses back to the client.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Implement Basic AI Chat UI with AI SDK React and OpenAI
DESCRIPTION: This snippet demonstrates how to set up a basic chat interface using `@ai-sdk/react`'s `useChat` hook for the frontend and `@ai-sdk/openai` for the backend API. It shows how to handle user input, display AI responses, and stream text from an OpenAI model.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {

const { messages, input, handleInputChange, handleSubmit } = useChat({});

return (

<>

{messages.map(message => (

<div key={message.id}>

{message.role === 'user' ? 'User: ' : 'AI: '}

{message.parts.map((part, index) =>

part.type === 'text' ? <span key={index}>{part.text}</span> : null,

)}

</div>

))}

<form onSubmit={handleSubmit}>

<input name="prompt" value={input} onChange={handleInputChange} />

<button type="submit">Submit</button>

</form>

</>

);

}
```

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4.1'),

system: 'You are a helpful assistant.',

messages: convertToModelMessages(messages),

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Define AI SDK Add Resource Tool in Next.js Route Handler
DESCRIPTION: This TypeScript code defines a Next.js API route handler that uses the AI SDK to stream text responses. It includes a custom tool, `addResource`, which uses Zod for parameter validation and an asynchronous function to create a resource in a knowledge base. This tool allows the AI model to automatically add user-provided content.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: TypeScript
CODE:
```
import { createResource } from '@/lib/actions/resources';

import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';

import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();
const result = streamText({
model: openai('gpt-4o'),
system: "You are a helpful assistant. Check your knowledge base before answering any questions.\nOnly respond to questions using information from tool calls.\nif no relevant information is found in the tool calls, respond, \"Sorry, I don't know.\"",
messages: convertToModelMessages(messages),
tools: {
addResource: tool({
description: "add a resource to your knowledge base.\nIf the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.",
parameters: z.object({
content: z
.string()
.describe('the content or resource to add to the knowledge base'),
}),
execute: async ({ content }) => createResource({ content }),
}),
},
});
return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Integrate Weather Tool with AI SDK
DESCRIPTION: This TypeScript code snippet demonstrates how to integrate a custom weather tool into an AI chatbot using the @ai-sdk/openai package. It defines a 'weather' tool with a description, uses Zod for validating the 'location' parameter, and includes an 'execute' function that simulates fetching weather data. The tool allows the AI model to respond to weather-related queries by calling this defined tool.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool } from 'ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
input: process.stdin,
output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
while (true) {
const userInput = await terminal.question('You: ');
messages.push({ role: 'user', content: userInput });

const result = streamText({
model: openai('gpt-4o'),
messages,
tools: {
weather: tool({
description: 'Get the weather in a location (in Celsius)',
parameters: z.object({
location: z
.string()
.describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: Math.round((Math.random() * 30 + 5) * 10) / 10 // Random temp between 5°C and 35°C
}),
}),
},
});

let fullResponse = '';
process.stdout.write('\nAssistant: ');
for await (const delta of result.textStream) {
fullResponse += delta;
process.stdout.write(delta);
}
process.stdout.write('\n\n');
messages.push({ role: 'assistant', content: fullResponse });
}
}

main().catch(console.error);
```

----------------------------------------

TITLE: Define Type-Safe Message Metadata Schema with Zod
DESCRIPTION: This snippet illustrates how to define a type-safe schema for message metadata using Zod. This schema allows developers to attach structured, custom information (like duration, model, or total tokens) to individual messages, which can then be used to enrich the UI without embedding data directly into message content.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: TypeScript
CODE:
```
export const exampleMetadataSchema = z.object({
  duration: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});

export type ExampleMetadata = z.infer<typeof exampleMetadataSchema>;
```

----------------------------------------

TITLE: Implement AI Model Routing for Dynamic Workflow Execution with AI SDK
DESCRIPTION: This pattern allows an AI model to dynamically select workflow paths based on context and intermediate results. It demonstrates how the output of an initial LLM call can modify parameters, such as model size and system prompt, for subsequent LLM calls, enabling adaptive processing for varied inputs.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

async function handleCustomerQuery(query: string) {
  const model = openai('gpt-4o');

  // First step: Classify the query type
  const { object: classification } = await generateObject({
    model,
    schema: z.object({
      reasoning: z.string(),
      type: z.enum(['general', 'refund', 'technical']),
      complexity: z.enum(['simple', 'complex'])
    }),
    prompt: `Classify this customer query:
${query}
Determine:
1. Query type (general, refund, or technical)
2. Complexity (simple or complex)
3. Brief reasoning for classification`
  });

  // Route based on classification
  // Set model and system prompt based on query type and complexity
  const { text: response } = await generateText({
    model:
      classification.complexity === 'simple'
        ? openai('gpt-4o-mini')
        : openai('o3-mini'),
    system: {
      general:
        'You are an expert customer service agent handling general inquiries.',
      refund:
        'You are a customer service agent specializing in refund requests. Follow company policy and collect necessary information.',
      technical:
        'You are a technical support specialist with deep product knowledge. Focus on clear step-by-step troubleshooting.'
    }[classification.type],
    prompt: query
  });

  return { response, classification };
}
```

----------------------------------------

TITLE: Use System Prompts to Guide Model Behavior
DESCRIPTION: This snippet illustrates how to use the `system` property to provide initial instructions to the model. System prompts help constrain the model's responses and guide its behavior, working in conjunction with either `prompt` or `messages` properties for more controlled output.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
system:
`You help planning travel itineraries. ` +
`Respond to the users' request with a list ` +
`of the best stops to make in their destination.`,
prompt:
`I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
`Please suggest the best tourist activities for me to do.`,
});
```

----------------------------------------

TITLE: AI SDK Core: generateText Function
DESCRIPTION: Generates text and tool calls. This function is ideal for non-interactive use cases such as automation tasks (e.g., drafting email or summarizing web pages) and for agents that use tools.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/overview

LANGUAGE: APIDOC
CODE:
```
generateText: Generates text and tool calls. This function is ideal for non-interactive use cases such as automation tasks where you need to write text (e.g. drafting email or summarizing web pages) and for agents that use tools.
```

----------------------------------------

TITLE: Implement Chat UI with useChat Hook in Next.js
DESCRIPTION: Updates the Next.js root page (`app/page.tsx`) to integrate the `useChat` hook from `@ai-sdk/react`. This hook simplifies managing chat state, user input, form submission, and displaying AI and user messages in a dynamic interface.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {

const { messages, input, handleInputChange, handleSubmit, error } = useChat();

return (

<>

{messages.map(message => (

<div key={message.id}>

{message.role === 'user' ? 'User: ' : 'AI: '}

{message.content}

</div>

))}

<form onSubmit={handleSubmit}>

<input name="prompt" value={input} onChange={handleInputChange} />

<button type="submit">Submit</button>

</form>

</>

);

}
```

----------------------------------------

TITLE: AI SDK Core: streamText Function
DESCRIPTION: Streams text and tool calls. You can use the `streamText` function for interactive use cases such as chat bots and content streaming.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/overview

LANGUAGE: APIDOC
CODE:
```
streamText: Stream text and tool calls. You can use the `streamText` function for interactive use cases such as chat bots and content streaming.
```

----------------------------------------

TITLE: Displaying Chat Errors with AI SDK UI's useChat Hook
DESCRIPTION: This React component illustrates how to integrate error handling into a chat application using the `useChat` hook from `@ai-sdk/react`. It demonstrates accessing the `error` object to conditionally render an error message and a 'Retry' button, while also disabling the input field when an error is present. The `reload()` function is used to re-attempt the chat operation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/error-handling

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

export default function Chat() {
const { messages, input, handleInputChange, handleSubmit, error, reload } =
useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
}),
});

return (
<div>
{messages.map(m => (
<div key={m.id}>
{m.role}:{' '}
{m.parts
.filter(part => part.type === 'text')
.map(part => part.text)
.join('')}
</div>
))}
{error && (
<>
<div>An error occurred.</div>
<button type="button" onClick={() => reload()}>
Retry
</button>
</>
)}
<form onSubmit={handleSubmit}>
<input
value={input}
onChange={handleInputChange}
disabled={error != null}
/>
</form>
</div>
);
}
```

----------------------------------------

TITLE: Generate Text with OpenAI using AI SDK
DESCRIPTION: This snippet demonstrates how to use the AI SDK's `generateText` function with an OpenAI model (`o3-mini`) to produce a text response based on a given prompt. It highlights the SDK's ability to abstract away provider-specific complexities.
SOURCE: https://v5.ai-sdk.dev/index

LANGUAGE: JavaScript
CODE:
```
import { generateText } from "ai"

import { openai } from "@ai-sdk/openai"

const { text } = await generateText({
model: openai("o3-mini"),
prompt: "What is love?"
})
```

----------------------------------------

TITLE: API Route Implementation for Chatbot Tools
DESCRIPTION: This code snippet demonstrates an API route (`app/api/chat/route.ts`) for a chatbot application using `@ai-sdk/openai` and `ai`. It defines a `POST` endpoint that streams text and integrates three types of tools: `getWeatherInformation` (server-side, auto-executed), `askForConfirmation` (client-side, user-interactive), and `getLocation` (client-side, auto-executed). The `streamText` function processes incoming messages and generates tool calls based on the model's output.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { z } from 'zod';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

// server-side tool with execute function:

getWeatherInformation: {

description: 'show the weather in a given city to the user',

parameters: z.object({ city: z.string() }),

execute: async ({}: { city: string }) => {

const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];

return weatherOptions[

Math.floor(Math.random() * weatherOptions.length)

];

},

},

// client-side tool that starts user interaction:

askForConfirmation: {

description: 'Ask the user for confirmation.',

parameters: z.object({

message: z.string().describe('The message to ask for confirmation.'),

}),

},

// client-side tool that is automatically executed on the client:

getLocation: {

description:

'Get the user location. Always ask for confirmation before using this tool.',

parameters: z.object({}),

},

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Test streamText with Mock Language Model and Stream Simulation
DESCRIPTION: This example shows how to unit test the `streamText` function using `MockLanguageModelV2` and `simulateReadableStream`. It simulates a streaming text response with multiple chunks and a final finish event, useful for testing streaming AI outputs.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/testing

LANGUAGE: typescript
CODE:
```
import { streamText, simulateReadableStream } from 'ai';

import { MockLanguageModelV2 } from 'ai/test';

const result = streamText({
  model: new MockLanguageModelV2({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text', text: 'Hello' },
          { type: 'text', text: ', ' },
          { type: 'text', text: `world!` },
          {
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { inputTokens: 3, outputTokens: 10 },
          },
        ],
      }),
    }),
  }),
  prompt: 'Hello, test!',
});
```

----------------------------------------

TITLE: Implement Multi-Step Tool Calls in AI Chat Route Handler
DESCRIPTION: This code updates the `app/api/chat/route.ts` file to add a new tool, `convertFahrenheitToCelsius`, alongside the existing `weather` tool. This demonstrates how to enable the AI model to perform multi-step operations, such as first getting the weather in Fahrenheit and then converting it to Celsius, leading to more complete and accurate responses.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';

import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

weather: tool({

description: 'Get the weather in a location (fahrenheit)',

parameters: z.object({

location: z.string().describe('The location to get the weather for'),

}),

execute: async ({ location }) => {

const temperature = Math.round(Math.random() * (90 - 32) + 32);

return {

location,

temperature,

};

},

}),

convertFahrenheitToCelsius: tool({

description: 'Convert a temperature in fahrenheit to celsius',

parameters: z.object({

temperature: z

.number()

.describe('The temperature in fahrenheit to convert'),

}),

execute: async ({ temperature }) => {

const celsius = Math.round((temperature - 32) * (5 / 9));

return {

celsius,

};

},

}),

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Implement Next.js API Route for Streaming AI Chatbot
DESCRIPTION: This snippet demonstrates how to create a Next.js API route (`app/api/chat/route.ts`) that handles POST requests for a streaming AI chatbot. It uses `@ai-sdk/openai` and `ai` to process messages and stream text responses from an OpenAI model.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Implement Language Model Caching Middleware with Redis
DESCRIPTION: This TypeScript code defines a `cacheMiddleware` using `@upstash/redis` to cache responses from AI SDK language models. It includes `wrapGenerate` for caching full responses from `generateText` and `generateObject` calls, and `wrapStream` for caching stream parts from `streamText` and `streamObject` calls. For streamed responses, it uses `simulateReadableStream` to reconstruct the stream from cached parts, providing control over initial and chunk delays.
SOURCE: https://v5.ai-sdk.dev/advanced/caching

LANGUAGE: TypeScript
CODE:
```
import { Redis } from '@upstash/redis';

import {
  type LanguageModelV2,
  type LanguageModelV2Middleware,
  type LanguageModelV2StreamPart,
  simulateReadableStream,
} from 'ai';

const redis = new Redis({
  url: process.env.KV_URL,
  token: process.env.KV_TOKEN,
});

export const cacheMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);
    const cached = (await redis.get(cacheKey)) as Awaited<
      ReturnType<LanguageModelV2['doGenerate']>
    > | null;

    if (cached !== null) {
      return {
        ...cached,
        response: {
          ...cached.response,
          timestamp: cached?.response?.timestamp
            ? new Date(cached?.response?.timestamp)
            : undefined,
        },
      };
    }

    const result = await doGenerate();
    redis.set(cacheKey, result);

    return result;
  },

  wrapStream: async ({ doStream, params }) => {
    const cacheKey = JSON.stringify(params);

    // Check if the result is in the cache
    const cached = await redis.get(cacheKey);

    // If cached, return a simulated ReadableStream that yields the cached result
    if (cached !== null) {
      // Format the timestamps in the cached response
      const formattedChunks = (cached as LanguageModelV2StreamPart[]).map(p => {
        if (p.type === 'response-metadata' && p.timestamp) {
          return { ...p, timestamp: new Date(p.timestamp) };
        } else return p;
      });

      return {
        stream: simulateReadableStream({
          initialDelayInMs: 0,
          chunkDelayInMs: 10,
          chunks: formattedChunks,
        }),
      };
    }

    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV2StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV2StreamPart,
      LanguageModelV2StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        // Store the full response in the cache after streaming is complete
        redis.set(cacheKey, fullResponse);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
};
```

----------------------------------------

TITLE: Install AI SDK and OpenAI Provider for Next.js
DESCRIPTION: Instructions to install the core AI SDK, OpenAI provider, and React bindings using pnpm, essential for setting up a new Next.js application with AI capabilities.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: shell
CODE:
```
pnpm install ai@alpha @ai-sdk/openai@alpha @ai-sdk/react@alpha
```

----------------------------------------

TITLE: Implement Dynamic AI Model Routing for PDFs and Images (Next.js API Route)
DESCRIPTION: This TypeScript code modifies a Next.js API route handler to dynamically select an AI model based on message attachments. It routes PDF requests to Anthropic's Claude 3.5 Sonnet and other requests (like images) to OpenAI's GPT-4o, enabling intelligent content processing.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();

// check if user has sent a PDF
const messagesHavePDF = messages.some(message =>
message.attachments?.some(a => a.contentType === 'application/pdf'),
);

const result = streamText({
model: messagesHavePDF
? anthropic('claude-3-5-sonnet-latest')
: openai('gpt-4o'),
messages: convertToModelMessages(messages),
});

return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Sending System Messages with generateText in JavaScript
DESCRIPTION: This code demonstrates how to send system messages to an AI model using the `generateText` function. System messages are crucial for guiding the model's behavior, such as defining its role or purpose, before it processes user input. The example illustrates a system message instructing the model to act as a travel itinerary planner, followed by a user query for trip suggestions.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: javascript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    { role: 'system', content: 'You help planning travel itineraries.' },
    {
      role: 'user',
      content:
        'I am planning a trip to Berlin for 3 days. Please suggest the best tourist activities for me to do.',
    },
  ],
});
```

----------------------------------------

TITLE: Stream an object with a Zod schema using AI SDK
DESCRIPTION: Demonstrates how to stream a structured object (e.g., a recipe) from a language model using `streamObject` with a Zod schema for validation and type enforcement. It iterates over the `partialObjectStream` to display the incrementally generated object.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-object

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

const { partialObjectStream } = streamObject({
  model: openai('gpt-4.1'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      steps: z.array(z.string())
    })
  }),
  prompt: 'Generate a lasagna recipe.'
});

for await (const partialObject of partialObjectStream) {
  console.clear();
  console.log(partialObject);
}
```

----------------------------------------

TITLE: Implement Guardrails for Content Filtering with Language Model Middleware in TypeScript
DESCRIPTION: This example shows how to use `LanguageModelV2Middleware` to implement guardrails, ensuring generated text is safe and appropriate. It demonstrates a basic filtering approach, such as redacting specific 'badwords' from the model's output before it is returned.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import type { LanguageModelV2Middleware } from 'ai';

export const yourGuardrailMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate }) => {
    const { text, ...rest } = await doGenerate();
    // filtering approach, e.g. for PII or other sensitive information:
    const cleanedText = text?.replace(/badword/g, '<REDACTED>');
    return { text: cleanedText, ...rest };
  },
  // here you would implement the guardrail logic for streaming
  // Note: streaming guardrails are difficult to implement, because
  // you do not know the full content of the stream until it's finished.
};
```

----------------------------------------

TITLE: Define a Recipe Schema using jsonSchema in AI SDK
DESCRIPTION: This example demonstrates how to use the `jsonSchema` helper function from the AI SDK to define a complex JSON schema for a 'recipe' object. The schema includes nested properties for 'name', 'ingredients' (an array of objects), and 'steps' (an array of strings), with specified required fields. This approach enables the generation of structured data that is compatible with the AI SDK.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/json-schema

LANGUAGE: TypeScript
CODE:
```
import { jsonSchema } from 'ai';

const mySchema = jsonSchema<{
  recipe: {
    name: string;
    ingredients: { name: string; amount: string }[];
    steps: string[];
  };
}>({ 
  type: 'object',
  properties: {
    recipe: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'string' }
            },
            required: ['name', 'amount']
          }
        },
        steps: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['name', 'ingredients', 'steps']
    }
  },
  required: ['recipe']
});
```

----------------------------------------

TITLE: Implement Chat UI with AI SDK's useChat Hook in Next.js
DESCRIPTION: This React component (`app/page.tsx`) demonstrates how to build a chat interface using the `useChat` hook from `@ai-sdk/react`. It handles message display, user input, form submission, and shows how to access and render model reasoning tokens.
SOURCE: https://v5.ai-sdk.dev/guides/r1

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
const { messages, input, handleInputChange, handleSubmit, error } = useChat();

return (
<>
{messages.map(message => (
<div key={message.id}>
{message.role === 'user' ? 'User: ' : 'AI: '}
{message.reasoning && <pre>{message.reasoning}</pre>}
{message.content}
</div>
))}

<form onSubmit={handleSubmit}>
<input name="prompt" value={input} onChange={handleInputChange} />
<button type="submit">Submit</button>
</form>
</>
);
}
```

----------------------------------------

TITLE: Modify existing messages in AI chat history (React)
DESCRIPTION: This snippet demonstrates how to use the `setMessages` function from the `useChat` hook to directly modify or filter existing messages in the chat history. It allows for functionalities like adding a delete button to messages, treating `messages` and `setMessages` similarly to React's `state` and `setState`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JavaScript
CODE:
```
const { messages, setMessages, ... } = useChat()

const handleDelete = (id) => {
setMessages(messages.filter(message => message.id !== id))
}

return <>
{messages.map(message => (
<div key={message.id}>
{message.role === 'user' ? 'User: ' : 'AI: '}
{message.parts.map((part, index) => (
part.type === 'text' ? (
<span key={index}>{part.text}</span>
) : null
))}
<button onClick={() => handleDelete(message.id)}>Delete</button>
</div>
))}
...
</>
```

----------------------------------------

TITLE: Display AI Tool Invocations in Chat UI (React/TypeScript)
DESCRIPTION: This code updates the `app/page.tsx` file to render different message parts from the AI SDK's `useChat` hook. It shows how to display standard text messages and how to specifically handle and visualize `tool-invocation` parts by converting them into a JSON representation, making the AI's tool usage visible in the chat interface.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-app-router

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-invocation':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part.toolInvocation, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: Server-side Object Streaming with AI SDK streamObject
DESCRIPTION: This code illustrates how to implement server-side object streaming using `streamObject` from 'ai'. It sets up a Next.js API route to generate objects based on a provided context and schema, using an OpenAI model, and streams the result back to the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/object-generation

LANGUAGE: JavaScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamObject } from 'ai';

import { notificationSchema } from './schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const context = await req.json();

const result = streamObject({
model: openai('gpt-4.1'),
schema: notificationSchema,
prompt:
`Generate 3 notifications for a messages app in this context:` + context,
});

return result.toTextStreamResponse();
}
```

----------------------------------------

TITLE: Extracting and Defining AI SDK Tools with `tool` Helper
DESCRIPTION: This example illustrates how to extract AI SDK tools into separate files for better organization. It uses the `tool` helper function from the `ai` package, which is essential for ensuring correct type inference for the tool's description, parameters (defined with Zod), and execution logic.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { tool } from 'ai';
import { z } from 'zod';

// the `tool` helper function ensures correct type inference:
export const weatherTool = tool({
  description: 'Get the weather in a location',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});
```

----------------------------------------

TITLE: Implement Chained Tools in AI SDK TypeScript API Route
DESCRIPTION: This TypeScript snippet for an AI SDK API route shows how to define and integrate multiple tools, specifically 'weather' and 'convertFahrenheitToCelsius'. It uses `streamText` with `tools` to allow the model to execute these functions sequentially, enabling multi-step reasoning and data transformation within a single user query.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: TypeScript
CODE:
```
import { createOpenAI } from '@ai-sdk/openai';

import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';

import { z } from 'zod';

import { OPENAI_API_KEY } from '$env/static/private';

const openai = createOpenAI({

apiKey: OPENAI_API_KEY,

});

export async function POST({ request }) {

const { messages }: { messages: UIMessage[] } = await request.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

weather: tool({

description: 'Get the weather in a location (fahrenheit)',

parameters: z.object({

location: z.string().describe('The location to get the weather for'),

}),

execute: async ({ location }) => {

const temperature = Math.round(Math.random() * (90 - 32) + 32);

return {

location,

temperature,

};

},

}),

convertFahrenheitToCelsius: tool({

description: 'Convert a temperature in fahrenheit to celsius',

parameters: z.object({

temperature: z

.number()

.describe('The temperature in fahrenheit to convert'),

}),

execute: async ({ temperature }) => {

const celsius = Math.round((temperature - 32) * (5 / 9));

return {

celsius,

};

},

}),

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Server-Side Generative UI with AI SDK `streamUI` and Tools
DESCRIPTION: This example illustrates using `streamUI` in a Next.js server action to generate both text and React components. It defines a `displayWeather` tool with Zod-validated parameters, which yields a loading state and then returns a `Weather` component based on fetched data, all within a single server call.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: typescript
CODE:
```
import { z } from 'zod';

import { streamUI } from '@ai-sdk/rsc';

import { openai } from '@ai-sdk/openai';

import { getWeather } from '@/utils/queries';

import { Weather } from '@/components/weather';

const { value: stream } = await streamUI({

model: openai('gpt-4o'),

system: 'you are a friendly assistant!',

messages,

text: async function* ({ content, done }) {

// process text

},

tools: {

displayWeather: {

description: 'Display the weather for a location',

parameters: z.object({

latitude: z.number(),

longitude: z.number()

}),

generate: async function* ({ latitude, longitude }) {

yield <div>Loading weather...</div>;

const { value, unit } = await getWeather({ latitude, longitude });

return <Weather value={value} unit={unit} />;

}

}

}

});
```

----------------------------------------

TITLE: Generate Structured JSON Data with AI SDK Core
DESCRIPTION: This example shows how to use `generateObject` from AI SDK Core to produce type-safe JSON data conforming to a Zod schema. This functionality is useful for extracting information from text, classifying data, or generating synthetic data with constrained model outputs.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
model: openai('gpt-4.5-preview'),
schema: z.object({
recipe: z.object({
name: z.string(),
ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
steps: z.array(z.string()),
}),
}),
prompt: 'Generate a lasagna recipe.',
});
```

----------------------------------------

TITLE: Save AI State with onSetAIState Callback
DESCRIPTION: This snippet demonstrates how to save the AI state to a database using the `onSetAIState` callback provided by `createAI`. The state is saved when the AI generation is marked as `done`, ensuring persistence of chat history.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/saving-and-restoring-states

LANGUAGE: TypeScript
CODE:
```
export const AI = createAI<ServerMessage[], ClientMessage[]>({ actions: { continueConversation, }, onSetAIState: async ({ state, done }) => { 'use server'; if (done) { saveChatToDB(state); } }, });
```

----------------------------------------

TITLE: Implement API Rate Limiting in Next.js with Vercel KV and Upstash Ratelimit
DESCRIPTION: This TypeScript code defines a Next.js API route (`app/api/generate/route.ts`) that implements rate limiting. It uses `@vercel/kv` for Redis storage and `@upstash/ratelimit` to enforce a fixed window limit of 5 requests every 30 seconds per IP address. Incoming requests are checked against the ratelimit, and if exceeded, a 429 'Ratelimited!' response is returned. Otherwise, it processes the request to stream text using `@ai-sdk/openai`.
SOURCE: https://v5.ai-sdk.dev/advanced/rate-limiting

LANGUAGE: typescript
CODE:
```
import kv from '@vercel/kv';

import { openai } from '@ai-sdk/openai';

import { streamText } from 'ai';

import { Ratelimit } from '@upstash/ratelimit';

import { NextRequest } from 'next/server';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

// Create Rate limit

const ratelimit = new Ratelimit({

redis: kv,

limiter: Ratelimit.fixedWindow(5, '30s'),

});

export async function POST(req: NextRequest) {

// call ratelimit with request ip

const ip = req.ip ?? 'ip';

const { success, remaining } = await ratelimit.limit(ip);

// block the request if unsuccessfull

if (!success) {

return new Response('Ratelimited!', { status: 429 });

}

const { messages } = await req.json();

const result = streamText({

model: openai('gpt-3.5-turbo'),

messages,

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Integrate Custom AI Tool into Chat API Route
DESCRIPTION: This updated API route enhances the chat functionality by integrating custom tools, specifically the `displayWeather` tool. By passing the `tools` object to `streamText`, the AI model can now decide to call these functions to perform specialized tasks.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: ts
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { tools } from '@/ai/tools';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a friendly assistant!',
    messages: convertToModelMessages(messages),
    maxSteps: 5,
    tools,
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Define and Export Server Action for AI Text Generation
DESCRIPTION: This TypeScript code demonstrates how to define and export an asynchronous server action (`getAnswer`) that can be invoked from client components. It uses the `@ai-sdk/openai` library to interact with the OpenAI API, specifically the `gpt-3.5-turbo` model, to generate text based on a provided question. The `'use server'` directive at the top of the file and within the function ensures it executes on the server.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/server-actions-in-client-components

LANGUAGE: TypeScript
CODE:
```
'use server';

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function getAnswer(question: string) {
  'use server';
  const { text } = await generateText({
    model: openai.chat('gpt-3.5-turbo'),
    prompt: question,
  });
  return { answer: text };
}
```

----------------------------------------

TITLE: Update handleSubmit Function for Automatic Chart Generation
DESCRIPTION: This TypeScript code snippet updates the `handleSubmit` asynchronous function within `app/page.tsx`. It integrates calls to `generateQuery`, `runGeneratedSQLQuery`, and `generateChartConfig` to process user input, execute SQL queries, retrieve results, and then automatically generate and set chart configurations for immediate visualization. It also includes error handling and loading state management.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...other imports... */

import { getCompanies, generateQuery, generateChartConfig } from './actions';

/* ...rest of the file... */

const handleSubmit = async (suggestion?: string) => {

clearExistingData();

const question = suggestion ?? inputValue;

if (inputValue.length === 0 && !suggestion) return;

if (question.trim()) {

setSubmitted(true);

}

setLoading(true);

setLoadingStep(1);

setActiveQuery('');

try {

const query = await generateQuery(question);

if (query === undefined) {

toast.error('An error occurred. Please try again.');

setLoading(false);

return;

}

setActiveQuery(query);

setLoadingStep(2);

const companies = await runGeneratedSQLQuery(query);

const columns = companies.length > 0 ? Object.keys(companies[0]) : [];

setResults(companies);

setColumns(columns);

setLoading(false);

const { config } = await generateChartConfig(companies, question);

setChartConfig(config);

} catch (e) {

toast.error('An error occurred. Please try again.');

setLoading(false);

}

};

/* ...rest of the file... */
```

----------------------------------------

TITLE: Define Zod Schema for Notifications
DESCRIPTION: This TypeScript code defines a Zod schema named `notificationSchema` for structuring notification data. It specifies an array of objects, where each object contains a `name` (string, fictional person's name) and a `message` (string, without emojis or links). This schema is intended for use on both client and server sides to ensure consistent data validation and structure for streamed JSON objects.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/object-generation

LANGUAGE: TypeScript
CODE:
```
import { z } from 'zod';

// define a schema for the notifications
export const notificationSchema = z.object({
notifications: z.array(
z.object({
name: z.string().describe('Name of a fictional person.'),
message: z.string().describe('Message. Do not use emojis or links.'),
}),
),
});
```

----------------------------------------

TITLE: Enable Multi-Step AI Tool Calls in API Route with `stopWhen`
DESCRIPTION: This snippet modifies the `app/api/chat+api.ts` file to enable multi-step tool calls using the `stopWhen` option with `stepCountIs(5)`. It defines an `openai` model and a `weather` tool using `zod` for parameter validation, demonstrating how to execute a tool and return its results within the `streamText` function.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import {

streamText,

UIMessage,

convertToModelMessages,

tool,

stepCountIs,

} from 'ai';

import { z } from 'zod';

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

stopWhen: stepCountIs(5),

tools: {

weather: tool({

description: 'Get the weather in a location (fahrenheit)',

parameters: z.object({

location: z.string().describe('The location to get the weather for'),

}),

execute: async ({ location }) => {

const temperature = Math.round(Math.random() * (90 - 32) + 32);

return {

location,

temperature,

};

},

}),

},

});

return result.toUIMessageStreamResponse({

headers: {

'Content-Type': 'application/octet-stream',

'Content-Encoding': 'none',

},

});

}
```

----------------------------------------

TITLE: Extend AI SDK Chat with Custom Tools (TypeScript)
DESCRIPTION: This TypeScript code demonstrates how to add custom tools to an AI SDK chat application. It defines two tools: 'weather' to fetch weather information (in Fahrenheit) for a given location, and 'convertFahrenheitToCelsius' to convert temperatures. These tools are integrated into the 'streamText' function, allowing the AI model to perform multi-step interactions by calling these tools based on user queries.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        parameters: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none',
    },
  });
}
```

----------------------------------------

TITLE: React Client-Side AI Completion with useCompletion
DESCRIPTION: This React component demonstrates the fundamental usage of the @ai-sdk/react useCompletion hook. It sets up a form to capture user input, sends it to a /api/completion endpoint, and streams the AI-generated text completion back to be displayed in real-time within the UI.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/completion

LANGUAGE: tsx
CODE:
```
'use client';

import { useCompletion } from '@ai-sdk/react';

export default function Page() {

const { completion, input, handleInputChange, handleSubmit } = useCompletion({

api: '/api/completion',

});

return (

<form onSubmit={handleSubmit}>

<input

name="prompt"

value={input}

onChange={handleInputChange}

id="input"

/>

<button type="submit">Submit</button>

<div>{completion}</div>

</form>

);

}
```

----------------------------------------

TITLE: Next.js API Route for AI Text Streaming with OpenAI
DESCRIPTION: This Next.js API route (POST) serves as the backend for AI text completion. It uses @ai-sdk/openai to interact with the gpt-3.5-turbo model, streams the AI response based on the provided prompt, and returns it as a UI message stream, with a maximum duration of 30 seconds.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/completion

LANGUAGE: typescript
CODE:
```
import { streamText } from 'ai';

import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { prompt }: { prompt: string } = await req.json();

const result = streamText({

model: openai('gpt-3.5-turbo'),

prompt,

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: React Native Expo: Implement AI Chat UI with useChat Hook
DESCRIPTION: This code snippet demonstrates how to integrate the AI SDK's `useChat` hook into a React Native Expo application. It sets up a scrollable view to display chat messages, an input field for user messages, and handles input changes and form submissions, enabling real-time AI chatbot interaction.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: TypeScript
CODE:
```
import { generateAPIUrl } from '@/utils';
import { useChat } from '@ai-sdk/react';
import { fetch as expoFetch } from 'expo/fetch';
import { View, TextInput, ScrollView, Text, SafeAreaView } from 'react-native';

export default function App() {
const { messages, error, handleInputChange, input, handleSubmit } = useChat({
fetch: expoFetch as unknown as typeof globalThis.fetch,
api: generateAPIUrl('/api/chat'),
onError: error => console.error(error, 'ERROR'),
});

if (error) return <Text>{error.message}</Text>;

return (
<SafeAreaView style={{ height: '100%' }}>
<View
style={{
height: '95%',
display: 'flex',
flexDirection: 'column',
paddingHorizontal: 8,
}}
>
<ScrollView style={{ flex: 1 }}>
{messages.map(m => (
<View key={m.id} style={{ marginVertical: 8 }}>
<View>
<Text style={{ fontWeight: 700 }}>{m.role}</Text>
{m.parts.map((part, i) => {
switch (part.type) {
case 'text':
return <Text key={`${m.id}-${i}`}>{part.text}</Text>;
}
})}
</View>
</View>
))}
</ScrollView>
<View style={{ marginTop: 8 }}>
<TextInput
style={{ backgroundColor: 'white', padding: 8 }}
placeholder="Say something..."
value={input}
onChange={e =>
handleInputChange({
...e,
target: {
...e.target,
value: e.nativeEvent.text,
},
} as unknown as React.ChangeEvent<HTMLInputElement>)
}
onSubmitEditing={e => {
handleSubmit(e);
e.preventDefault();
}}
autoFocus={true}
/>
</View>
</View>
</SafeAreaView>
);
}
```

----------------------------------------

TITLE: Integrating a Tool with `streamUI` for Component Streaming
DESCRIPTION: This snippet expands on the basic `streamUI` example by demonstrating how to define and integrate a tool. The `getWeather` tool includes a description, Zod schema for parameters, and an asynchronous `generate` function that yields a loading component before returning a final `WeatherComponent` once the data is fetched, showcasing dynamic UI updates based on model-driven tool calls.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-react-components

LANGUAGE: JavaScript
CODE:
```
const result = await streamUI({
  model: openai('gpt-4o'),
  prompt: 'Get the weather for San Francisco',
  text: ({ content }) => <div>{content}</div>,
  tools: {
    getWeather: {
      description: 'Get the weather for a location',
      parameters: z.object({ location: z.string() }),
      generate: async function* ({ location }) {
        yield <LoadingComponent />;
        const weather = await getWeather(location);
        return <WeatherComponent weather={weather} location={location} />;
      }
    }
  }
});
```

----------------------------------------

TITLE: Stream Text with AI SDK Core
DESCRIPTION: Demonstrates how to use the `streamText` function from AI SDK Core for real-time text generation. It shows how to initiate a stream and iterate over `textStream` as an async iterable to process text parts as they become available, ideal for interactive applications.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: JavaScript
CODE:
```
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
});

// example: use textStream as an async iterable
for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

----------------------------------------

TITLE: Stream Structured Data with AI SDK's streamObject
DESCRIPTION: Illustrates how to use `streamObject` to stream structured data as it is generated, improving responsiveness for interactive use cases. It demonstrates iterating over the `partialObjectStream` to process partial objects.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: typescript
CODE:
```
import { streamObject } from 'ai';

const { partialObjectStream } = streamObject({
  // ...
});

// use partialObjectStream as an async iterable
for await (const partialObject of partialObjectStream) {
  console.log(partialObject);
}
```

----------------------------------------

TITLE: Stream Text with Structured Object Output using AI SDK
DESCRIPTION: Demonstrates how to use `streamText` with `experimental_output` to define a Zod schema for streaming structured data. This allows the AI model to generate output that conforms to a predefined object structure, including nested objects, nullable fields, and specific literal values.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: TypeScript
CODE:
```
// experimental_partialOutputStream contains generated partial objects:

const { experimental_partialOutputStream } = await streamText({
// ...
experimental_output: Output.object({
schema: z.object({
name: z.string(),
age: z.number().nullable().describe('Age of the person.'),
contact: z.object({
type: z.literal('email'),
value: z.string(),
}),
occupation: z.object({
type: z.literal('employed'),
company: z.string(),
position: z.string(),
}),
}),
}),
prompt: 'Generate an example person for testing.',
});
```

----------------------------------------

TITLE: Create Next.js Server Action for Streaming UI with AI SDK
DESCRIPTION: This Server Action defines a `streamComponent` function that uses `@ai-sdk/rsc` to stream React components. It includes a `getWeather` tool with a loading state and a final `WeatherComponent` to display dynamic content based on AI model output.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-react-components

LANGUAGE: TypeScript
CODE:
```
'use server';

import { streamUI } from '@ai-sdk/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const LoadingComponent = () => (
<div className="animate-pulse p-4">getting weather...</div>
);

const getWeather = async (location: string) => {
await new Promise(resolve => setTimeout(resolve, 2000));
return '82°F️ ☀️';
};

interface WeatherProps {
location: string;
weather: string;
}

const WeatherComponent = (props: WeatherProps) => (
<div className="border border-neutral-200 p-4 rounded-lg max-w-fit">
The weather in {props.location} is {props.weather}
</div>
);

export async function streamComponent() {
const result = await streamUI({
model: openai('gpt-4o'),
prompt: 'Get the weather for San Francisco',
text: ({ content }) => <div>{content}</div>,
tools: {
getWeather: {
description: 'Get the weather for a location',
parameters: z.object({
location: z.string(),
}),
generate: async function* ({ location }) {
yield <LoadingComponent />;
const weather = await getWeather(location);
return <WeatherComponent weather={weather} location={location} />;
},
},
},
});
return result.value;
}
```

----------------------------------------

TITLE: Create Next.js API Route Handler for AI Chat Endpoint
DESCRIPTION: This TypeScript code defines a Next.js API route handler (`app/api/chat/route.ts`) that processes incoming chat messages, uses the DeepSeek model to stream text responses, and converts them into UI messages. It also demonstrates forwarding model reasoning tokens to the client.
SOURCE: https://v5.ai-sdk.dev/guides/r1

LANGUAGE: TypeScript
CODE:
```
import { deepseek } from '@ai-sdk/deepseek';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();
const result = streamText({
model: deepseek('deepseek-reasoner'),
messages: convertToModelMessages(messages),
});
return result.toUIMessageStreamResponse({
sendReasoning: true,
});
}
```

----------------------------------------

TITLE: Create Next.js API Route for AI Chat Endpoint
DESCRIPTION: This TypeScript code defines a Next.js API route (`app/api/chat/route.ts`) that handles POST requests for chat interactions. It uses the AI SDK's `streamText` function with the Anthropic provider (Claude 4 Sonnet) to process messages and stream responses, including optional reasoning tokens.
SOURCE: https://v5.ai-sdk.dev/guides/claude-4

LANGUAGE: TypeScript
CODE:
```
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
const { messages } = await req.json();
const result = streamText({
model: anthropic('claude-4-sonnet-20250514'),
messages,
headers: {
'anthropic-beta': 'interleaved-thinking-2025-05-14',
},
providerOptions: {
anthropic: {
thinking: { type: 'enabled', budgetTokens: 15000 },
} satisfies AnthropicProviderOptions,
},
});
return result.toDataStreamResponse({
sendReasoning: true,
});
}
```

----------------------------------------

TITLE: Wrap Application with AI Context Provider
DESCRIPTION: This snippet demonstrates how to wrap the root layout of a React application with the `AI` context provider. This makes the AI and UI states, along with the defined server actions, accessible to all child components within the application.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
import { type ReactNode } from 'react';
import { AI } from './ai';

export default function RootLayout({
children,
}: Readonly<{ children: ReactNode }>) {
return (
<AI>
<html lang="en">
<body>{children}</body>
</html>
</AI>
);
}
```

----------------------------------------

TITLE: Restore AI State with initialAIState Prop
DESCRIPTION: This example illustrates how to restore the AI state when a component mounts. It uses the `initialAIState` prop of the `AI` context provider, populated by loading chat history from a database, to rehydrate the AI state.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/saving-and-restoring-states

LANGUAGE: TypeScript
CODE:
```
import { ReactNode } from 'react';
import { AI } from './ai';

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const chat = await loadChatFromDB();
  return (
    <html lang="en">
      <body>
        <AI initialAIState={chat}>{children}</AI>
      </body>
    </html>
  );
}
```

----------------------------------------

TITLE: Using Tools with AI SDK and Llama 3.1
DESCRIPTION: Demonstrates how to integrate and use custom tools like `getWeather` with the AI SDK's `generateText` function, allowing LLMs to interact with external systems and fetch real-time data.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: typescript
CODE:
```
import { generateText, tool } from 'ai';

import { deepinfra } from '@ai-sdk/deepinfra';

import { z } from 'zod';

const { text } = await generateText({
model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),
prompt: 'What is the weather like today?',
tools: {
getWeather: tool({
description: 'Get the weather in a location',
parameters: z.object({
location: z.string().describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: 72 + Math.floor(Math.random() * 21) - 10,
}),
}),
},
});
```

----------------------------------------

TITLE: Implement Chat UI with useChat Hook in Next.js
DESCRIPTION: Demonstrates how to use the `useChat` hook from `@ai-sdk/react` in a Next.js client component (`app/page.tsx`). This code manages chat state, displays messages (including text and reasoning parts), and handles user input for a real-time chat interface.
SOURCE: https://v5.ai-sdk.dev/guides/sonnet-3-7

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
const { messages, input, handleInputChange, handleSubmit, error } = useChat();

return (
<>
{messages.map(message => (
<div key={message.id}>
{message.role === 'user' ? 'User: ' : 'AI: '}
{message.parts.map((part, index) => {
// text parts:
if (part.type === 'text') {
return <div key={index}>{part.text}</div>;
}

// reasoning parts:
if (part.type === 'reasoning') {
return (
<pre key={index}>
{part.details.map(detail =>
detail.type === 'text' ? detail.text : '<redacted>',
)}
</pre>
);
}
})}
</div>
))}

<form onSubmit={handleSubmit}>
<input name="prompt" value={input} onChange={handleInputChange} />
<button type="submit">Submit</button>
</form>
</>
);
}
```

----------------------------------------

TITLE: React Component for Streaming Object Generation with useObject Hook
DESCRIPTION: This React client component utilizes the `useObject` hook from `@ai-sdk/react` to interact with a backend API (`/api/object`) for streaming object data. It defines a `notificationSchema` to type the incoming data. A button triggers the object generation, and the component dynamically renders the received notifications as they stream in and update the `object` state.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useObject } from '@ai-sdk/react';

import { notificationSchema } from '@/utils/schemas';

export default function Page() {
  const { object, submit } = useObject({
    api: '/api/object',
    schema: notificationSchema,
  });

  return (
    <div>
      <button onClick={() => submit('Messages during finals week.')}>
        Generate notifications
      </button>
      {object?.notifications?.map((notification, index) => (
        <div key={index}>
          <p>{notification?.name}</p>
          <p>{notification?.message}</p>
        </div>
      ))}
    </div>
  );
}
```

----------------------------------------

TITLE: Define and Integrate Weather Tool in AI Chatbot Route Handler
DESCRIPTION: This TypeScript code snippet demonstrates how to define and integrate a custom 'weather' tool within an AI chatbot's route handler (`app/api/chat/route.ts`). It utilizes `@ai-sdk/openai` for the model, `ai` for streaming and tool definition, and `zod` for schema validation of tool parameters. The tool simulates fetching weather data for a given location and is designed to be called by the AI model based on user queries.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';

import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages,

tools: {

weather: tool({

description: 'Get the weather in a location (fahrenheit)',

parameters: z.object({

location: z.string().describe('The location to get the weather for'),

}),

execute: async ({ location }) => {

const temperature = Math.round(Math.random() * (90 - 32) + 32);

return {

location,

temperature,

};

},

}),

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Handle Stream Chunks with `onChunk` Callback in AI SDK
DESCRIPTION: The `onChunk` callback for `streamText` is triggered for each chunk of the stream. It allows developers to implement custom logic based on various chunk types, including text, reasoning, source, and tool-related events. This enables real-time processing and display of streamed content.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: TypeScript
CODE:
```
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onChunk({ chunk }) {
    // implement your own logic here, e.g.:
    if (chunk.type === 'text') {
      console.log(chunk.text);
    }
  },
});
```

----------------------------------------

TITLE: Configuring Multi-Step Calls in AI SDK React `useChat`
DESCRIPTION: This snippet demonstrates how to enable multi-step tool calls in the AI SDK's `useChat` hook by setting the `maxSteps` option. When `maxSteps` is configured, the AI SDK automatically sends tool call results back to the model, allowing for follow-up responses. This configuration is applied within the `chatStore` options in `app/page.tsx`.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: TypeScript
CODE:
```
import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

const { messages, input, handleInputChange, handleSubmit } = useChat({

chatStore: defaultChatStoreOptions({

api: '/api/chat',

maxSteps: 3,

}),

});

// ... Rest of your code
```

----------------------------------------

TITLE: Implement Streaming AI Chatbot with AI SDK
DESCRIPTION: This TypeScript code sets up an interactive command-line chatbot. It initializes the OpenAI model, manages conversation history using an array of messages, and streams responses from the model back to the terminal, allowing for real-time interaction.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText } from 'ai';
import dotenv from 'dotenv';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
input: process.stdin,
output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
while (true) {
const userInput = await terminal.question('You: ');
messages.push({ role: 'user', content: userInput });

const result = streamText({
model: openai('gpt-4o'),
messages,
});

let fullResponse = '';
process.stdout.write('\nAssistant: ');
for await (const delta of result.textStream) {
fullResponse += delta;
process.stdout.write(delta);
}
process.stdout.write('\n\n');
messages.push({ role: 'assistant', content: fullResponse });
}
}

main().catch(console.error);
```

----------------------------------------

TITLE: Add AI SDK Response Messages to Conversation History
DESCRIPTION: Both `generateText` and `streamText` provide a `response.messages` property, an array of `ModelMessage` objects, which can be used to easily add generated assistant and tool messages to your conversation history. This is particularly useful for managing multi-step tool calls and maintaining conversational context.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';

const messages: ModelMessage[] = [
  // ...
];

const { response } = await generateText({
  // ...
  messages,
});

// add the response messages to your conversation history:
messages.push(...response.messages); // streamText: ...((await response).messages)
```

----------------------------------------

TITLE: Stream Text Generation using AI SDK with OpenAI
DESCRIPTION: This code snippet demonstrates how to implement a streaming UI for text generation using the AI SDK. It utilizes the `streamText` function to connect to OpenAI's `gpt-4.1` model and stream its response. The generated text parts are then logged to the console as they become available, showcasing the real-time display capability of streaming interfaces.
SOURCE: https://v5.ai-sdk.dev/advanced/why-streaming

LANGUAGE: JavaScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText } from 'ai';

const { textStream } = streamText({
  model: openai('gpt-4.1'),
  prompt: 'Write a poem about embedding models.',
});

for await (const textPart of textStream) {
  console.log(textPart);
}
```

----------------------------------------

TITLE: Define AI SDK Tools in Next.js API Route Handler
DESCRIPTION: This snippet updates the `app/api/chat/route.ts` file to define two new tools: `weather` and `convertFahrenheitToCelsius`. These tools are integrated with the `streamText` function, allowing the AI model to execute external logic for fetching weather data and converting temperatures, demonstrating how to expand the model's capabilities with real-world interactions.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-app-router

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';

import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

weather: tool({

description: 'Get the weather in a location (fahrenheit)',

parameters: z.object({

location: z.string().describe('The location to get the weather for'),

}),

execute: async ({ location }) => {

const temperature = Math.round(Math.random() * (90 - 32) + 32);

return {

location,

temperature,

};

},

}),

convertFahrenheitToCelsius: tool({

description: 'Convert a temperature in fahrenheit to celsius',

parameters: z.object({

temperature: z

.number()

.describe('The temperature in fahrenheit to convert'),

}),

execute: async ({ temperature }) => {

const celsius = Math.round((temperature - 32) * (5 / 9));

return {

celsius,

};

},

}),

},

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Implement Custom AI SDK Tools in Nuxt API Route
DESCRIPTION: This snippet updates the `server/api/chat.ts` file to define and integrate custom AI SDK tools within a Nuxt.js API route. It includes a 'weather' tool to fetch location-based temperature and a 'convertFahrenheitToCelsius' tool for temperature unit conversion, demonstrating how to extend the model's capabilities with external functions and multi-step reasoning.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: TypeScript
CODE:
```
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export default defineLazyEventHandler(async () => {
const apiKey = useRuntimeConfig().openaiApiKey;
if (!apiKey) throw new Error('Missing OpenAI API key');

const openai = createOpenAI({
apiKey: apiKey,
});

return defineEventHandler(async (event: any) => {
const { messages }: { messages: UIMessage[] } = await readBody(event);

const result = streamText({
model: openai('gpt-4o-preview'),
messages: convertToModelMessages(messages),
tools: {
weather: tool({
description: 'Get the weather in a location (fahrenheit)',
parameters: z.object({
location: z
.string()
.describe('The location to get the weather for'),
}),
execute: async ({ location }) => {
const temperature = Math.round(Math.random() * (90 - 32) + 32);
return {
location,
temperature,
};
},
}),

convertFahrenheitToCelsius: tool({
description: 'Convert a temperature in fahrenheit to celsius',
parameters: z.object({
temperature: z
.number()
.describe('The temperature in fahrenheit to convert'),
}),
execute: async ({ temperature }) => {
const celsius = Math.round((temperature - 32) * (5 / 9));
return {
celsius,
};
},
}),
},
});

return result.toUIMessageStreamResponse();
});
});
```

----------------------------------------

TITLE: Streaming React Components with createStreamableUI in AI SDK RSC
DESCRIPTION: This server action example illustrates how to use `createStreamableUI` to stream a React component from the server to the client. It initializes a streamable UI with a loading state and then updates it after a delay with the final content, demonstrating granular control over UI streaming.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-values

LANGUAGE: JavaScript
CODE:
```
'use server';

import { createStreamableUI } from '@ai-sdk/rsc';

export async function getWeather() {
  const weatherUI = createStreamableUI();

  weatherUI.update(<div style={{ color: 'gray' }}>Loading...</div>);

  setTimeout(() => {
    weatherUI.done(<div>It&apos;s a sunny day!</div>);
  }, 1000);

  return weatherUI.value;
}
```

----------------------------------------

TITLE: Create Next.js API Route for AI SDK Chat Endpoint
DESCRIPTION: This snippet defines a Next.js API route handler (`app/api/chat/route.ts`) that processes incoming chat messages. It uses the AI SDK's `streamText` function with the OpenAI o3-mini model and converts UI messages to model-compatible messages, streaming the response back to the client.
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai('o3-mini'),
    messages: convertToModelMessages(messages)
  });
  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Implementing Server-Side Multi-Step Tool Calls with AI SDK streamText
DESCRIPTION: This example illustrates how to enable multi-step tool calls on the server-side using the 'streamText' function from the AI SDK. It defines an API route that processes incoming messages, integrates an OpenAI model, and includes a 'getWeatherInformation' tool with an 'execute' function for server-side execution.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { z } from 'zod';

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

getWeatherInformation: {

description: 'show the weather in a given city to the user',

parameters: z.object({ city: z.string() }),

// tool has execute function:

execute: async ({}: { city: string }) => {

const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];

return weatherOptions[

Math.floor(Math.random() * weatherOptions.length)

];

},

},

},

maxSteps: 5,

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: React: Chat UI Component with useChat Hook
DESCRIPTION: This React component, `Chat`, uses the `@ai-sdk/react` `useChat` hook to manage chat state, input, and message handling. It integrates with a backend API (`/api/chat`) and displays messages, providing an input field for user interaction.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { defaultChatStoreOptions } from 'ai';

export default function Chat({
id,
initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
const { input, handleInputChange, handleSubmit, messages } = useChat({
chatId: id, // use the provided chat ID
chatStore: defaultChatStoreOptions({
api: '/api/chat',
chats:
initialMessages && id
? { [id]: { messages: initialMessages } }
: undefined,
}),
});

// simplified rendering code, extend as needed:
return (
<div>
{messages.map(m => (
<div key={m.id}>
{m.role === 'user' ? 'User: ' : 'AI: '}
{m.parts
.map(part => (part.type === 'text' ? part.text : ''))
.join('')}
</div>
))}
<form onSubmit={handleSubmit}>
<input value={input} onChange={handleInputChange} />
</form>
</div>
);
}
```

----------------------------------------

TITLE: Basic Tool Definition and Usage with generateText
DESCRIPTION: Demonstrates how to define a tool using `ai-sdk`'s `tool` helper, specifying its description, Zod-based parameters, and an asynchronous `execute` function. The tool is then registered with `generateText` to enable the model to invoke it based on the prompt, illustrating a single-step tool call.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { z } from 'zod';

import { generateText, tool } from 'ai';

const result = await generateText({
	model: yourModel,
	tools: {
		weather: tool({
			description: 'Get the weather in a location',
			parameters: z.object({
				location: z.string().describe('The location to get the weather for'),
			}),
			execute: async ({ location }) => ({
				location,
				temperature: 72 + Math.floor(Math.random() * 21) - 10,
			}),
		}),
	},
	prompt: 'What is the weather in San Francisco?',
});
```

----------------------------------------

TITLE: TypeScript: API Route Handler for AI Chat with Knowledge Base Tools
DESCRIPTION: This code modifies the chat API route handler (`api/chat/route.ts`) to integrate new tools for the AI model. It defines an `addResource` tool for adding content to the knowledge base and a `getInformation` tool for retrieving relevant information to answer user questions, leveraging the previously defined embedding logic. The handler uses OpenAI's GPT-4o model and streams text responses.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { createResource } from '@/lib/actions/resources';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
system: `You are a helpful assistant. Check your knowledge base before answering any questions.
Only respond to questions using information from tool calls.
if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
tools: {
addResource: tool({
description: `add a resource to your knowledge base.
If the user provides a random piece of knowledge unprompted, use this tool without asking for confirmation.`,
parameters: z.object({
content: z
.string()
.describe('the content or resource to add to the knowledge base'),
}),
execute: async ({ content }) => createResource({ content }),
}),

getInformation: tool({
description: `get information from your knowledge base to answer questions.`,
parameters: z.object({
question: z.string().describe('the users question'),
}),
execute: async ({ question }) => findRelevantContent(question),
}),
},
});

return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Test streamObject with Mock Language Model and Stream Simulation
DESCRIPTION: This example illustrates how to unit test the `streamObject` function, simulating a streaming object response using `MockLanguageModelV2` and `simulateReadableStream`. It demonstrates how to handle chunked JSON output and validate it with a Zod schema.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/testing

LANGUAGE: typescript
CODE:
```
import { streamObject, simulateReadableStream } from 'ai';

import { MockLanguageModelV2 } from 'ai/test';

import { z } from 'zod';

const result = streamObject({
  model: new MockLanguageModelV2({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text', text: '{ ' },
          { type: 'text', text: '"content": ' },
          { type: 'text', text: '"Hello, ' },
          { type: 'text', text: 'world' },
          { type: 'text', text: '!"' },
          { type: 'text', text: ' }' },
          {
            type: 'finish',
            finishReason: 'stop',
            logprobs: undefined,
            usage: { inputTokens: 3, outputTokens: 10 },
          },
        ],
      }),
    }),
  }),
  schema: z.object({ content: z.string() }),
  prompt: 'Hello, test!',
});
```

----------------------------------------

TITLE: Send Custom Data with AI SDK `createUIMessageStreamResponse` (TypeScript)
DESCRIPTION: Demonstrates how to send arbitrary custom data objects from a server-side route handler using `createUIMessageStreamResponse` and `streamText`. It shows writing initial status data and completion data to the stream, solving RAG issues.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/streaming-data

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // immediately start streaming (solves RAG issues with status, etc.)
  return createUIMessageStreamResponse({
    execute: ({ writer }) => {
      // write custom data parts to the stream:
      writer.write({
        type: 'data-status',
        id: 'call-status',
        data: { message: 'initialized call' },
      });

      const result = streamText({
        model: openai('gpt-4.1'),
        messages: convertToModelMessages(messages),
        onFinish() {
          // write completion data:
          writer.write({
            type: 'data-completion',
            id: 'call-completion',
            data: { message: 'call completed', timestamp: Date.now() },
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });
}
```

----------------------------------------

TITLE: Force Structured LLM Output with Answer Tool and toolChoice
DESCRIPTION: This snippet shows how to ensure an agent's final output is consistently structured using an 'answer tool' and the `toolChoice: 'required'` setting. The answer tool defines the desired schema for the output, and its invocation terminates the agent, making it suitable for tasks requiring specific data formats like mathematical analysis reports.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText, tool, stepCountIs } from 'ai';
import 'dotenv/config';
import { z } from 'zod';

const { toolCalls } = await generateText({
  model: openai('gpt-4o-2024-08-06'),
  tools: {
    calculate: tool({
      description:
        'A tool for evaluating mathematical expressions. Example expressions: ' +
        "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      parameters: z.object({ expression: z.string() }),
      execute: async ({ expression }) => mathjs.evaluate(expression),
    }),
    // answer tool: the LLM will provide a structured answer
    answer: tool({
      description: 'A tool for providing the final answer.',
      parameters: z.object({
        steps: z.array(
          z.object({
            calculation: z.string(),
            reasoning: z.string(),
          }),
        ),
        answer: z.string(),
      }),
      // no execute function - invoking it will terminate the agent
    }),
  },
  toolChoice: 'required',
  stopWhen: stepCountIs(10),
  system:
    'You are solving math problems. ' +
    'Reason step by step. ' +
    'Use the calculator when necessary. ' +
    'The calculator can only do simple additions, subtractions, multiplications, and divisions. ' +
    'When you give the final answer, provide an explanation for how you got it.',
  prompt:
    'A taxi driver earns $9461 per 1-hour work. ' +
    'If he works 12 hours a day and in 1 hour he uses 14-liters petrol with price $134 for 1-liter. ' +
    'How much money does he earn in one day?',
});

console.log(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);
```

----------------------------------------

TITLE: Implementing Server-Side Multi-Step Tool Calls with AI SDK
DESCRIPTION: This server-side API route demonstrates how to enable multi-step tool calls using `streamText` in the AI SDK. It requires all defined tools, such as `getWeatherInformation`, to have an `execute` function for server-side execution. The example shows a basic weather tool returning a random weather condition.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { z } from 'zod';

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

tools: {

getWeatherInformation: {

description: 'show the weather in a given city to the user',

parameters: z.object({ city: z.string() }),

// tool has execute function:

execute: async ({}: { city: string }) => {

const weatherOptions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];

return weatherOptions[

Math.floor(Math.random() * weatherOptions.length)

];

},

},

},

maxSteps: 5,

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Execute Parallel AI Model Processing for Concurrent Tasks with AI SDK
DESCRIPTION: This pattern utilizes parallel execution to boost efficiency by dividing tasks into independent subtasks. It illustrates concurrent processing of different aspects of a single input, such as a code review, using multiple specialized AI models, followed by the aggregation of their results.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

// Example: Parallel code review with multiple specialized reviewers
async function parallelCodeReview(code: string) {
  const model = openai('gpt-4o');

  // Run parallel reviews
  const [securityReview, performanceReview, maintainabilityReview] =
    await Promise.all([
      generateObject({
        model,
        system:
          'You are an expert in code security. Focus on identifying security vulnerabilities, injection risks, and authentication issues.',
        schema: z.object({
          vulnerabilities: z.array(z.string()),
          riskLevel: z.enum(['low', 'medium', 'high']),
          suggestions: z.array(z.string())
        }),
        prompt: `Review this code:
${code}`
      }),
      generateObject({
        model,
        system:
          'You are an expert in code performance. Focus on identifying performance bottlenecks, memory leaks, and optimization opportunities.',
        schema: z.object({
          issues: z.array(z.string()),
          impact: z.enum(['low', 'medium', 'high']),
          optimizations: z.array(z.string())
        }),
        prompt: `Review this code:
${code}`
      }),
      generateObject({
        model,
        system:
          'You are an expert in code quality. Focus on code structure, readability, and adherence to best practices.',
        schema: z.object({
          concerns: z.array(z.string()),
          qualityScore: z.number().min(1).max(10),
          recommendations: z.array(z.string())
        }),
        prompt: `Review this code:
${code}`
      })
    ]);

  const reviews = [
    { ...securityReview.object, type: 'security' },
    { ...performanceReview.object, type: 'performance' },
    { ...maintainabilityReview.object, type: 'maintainability' }
  ];

  // Aggregate results using another model instance
  const { text: summary } = await generateText({
    model,
    system: 'You are a technical lead summarizing multiple code reviews.',
    prompt: `Synthesize these code review results into a concise summary with key actions:
${JSON.stringify(reviews, null, 2)}`
  });

  return { reviews, summary };
}
```

----------------------------------------

TITLE: Cancel AI Text Generation with AbortSignal Timeout
DESCRIPTION: Demonstrates how to use `AbortSignal.timeout` to automatically cancel a `generateText` call after a specified duration (e.g., 5 seconds), preventing long-running operations.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/settings

LANGUAGE: TypeScript
CODE:
```
const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
  abortSignal: AbortSignal.timeout(5000), // 5 seconds
});
```

----------------------------------------

TITLE: Defining a Generic Error Handler Function for AI SDK
DESCRIPTION: This utility function, 'errorHandler', provides a robust way to convert various types of errors (null, string, Error instances, or other objects) into a user-friendly string message. It's designed to be used with AI SDK's error handling mechanisms to surface detailed error information.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: TypeScript
CODE:
```
export function errorHandler(error: unknown) {

if (error == null) {

return 'unknown error';

}

if (typeof error === 'string') {

return error;

}

if (error instanceof Error) {

return error.message;

}

return JSON.stringify(error);

}
```

----------------------------------------

TITLE: Implement SvelteKit API Route for AI Chat Streaming
DESCRIPTION: This TypeScript code defines a SvelteKit `POST` endpoint (`src/routes/api/chat/+server.ts`). It initializes an OpenAI provider, processes incoming chat messages, and streams text responses from the `gpt-4o` model using `streamText`.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: TypeScript
CODE:
```
import { createOpenAI } from '@ai-sdk/openai';

import { streamText, UIMessage, convertToModelMessages } from 'ai';

import { OPENAI_API_KEY } from '$env/static/private';

const openai = createOpenAI({
apiKey: OPENAI_API_KEY,
});

export async function POST({ request }) {
const { messages }: { messages: UIMessage[] } = await request.json();

const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
});

return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: createStreamableUI Function
DESCRIPTION: Facilitates the creation of a streamable UI component that can be rendered on the server and efficiently streamed to the client.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc

LANGUAGE: APIDOC
CODE:
```
createStreamableUI()
  Description: Create a streamable UI component that can be rendered on the server and streamed to the client.
```

----------------------------------------

TITLE: Next.js API: Stream AI Response and Save Chat Messages
DESCRIPTION: This Next.js API route (`/api/chat`) handles incoming chat messages from the frontend. It uses `streamText` with an OpenAI model to generate AI responses, converts messages to the model format, and then saves the updated chat messages via the `onFinish` callback.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { saveChat } from '@tools/chat-store';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
await req.json();

const result = streamText({
model: openai('gpt-4o-mini'),
messages: convertToModelMessages(messages),
});

return result.toUIMessageStreamResponse({
originalMessages: messages,
onFinish: ({ messages }) => {
saveChat({ chatId, messages });
},
});
}
```

----------------------------------------

TITLE: Client-side UI for Streamed Tool Call States
DESCRIPTION: This snippet illustrates how to consume and render streamed tool call states on the client-side. It shows how to check the state property (partial-call, call, result) of tool-invocation parts within messages from the useChat hook to provide real-time feedback to the user as tools are being processed.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
export default function Chat() {

// ...

return (

<>

{messages?.map(message => (

<div key={message.id}>

{message.parts.map(part => {

if (part.type === 'tool-invocation') {

switch (part.toolInvocation.state) {

case 'partial-call':

return <>render partial tool call</>;

case 'call':

return <>render full tool call</>;

case 'result':

return <>render tool result</>;

}

}

})}

</div>

))}

</>

);

}
```

----------------------------------------

TITLE: Generate Text with OpenAI Model using AI SDK Core
DESCRIPTION: This example demonstrates how to use the `generateText` function from the AI SDK Core to generate text using an OpenAI model. It shows a basic prompt and the expected output is a string containing the generated text.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/overview

LANGUAGE: TypeScript
CODE:
```
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const { text } = await generateText({
  model: openai("o3-mini"),
  prompt: "What is love?"
});
```

----------------------------------------

TITLE: Next.js API Route for AI SDK Chat with OpenAI
DESCRIPTION: This TypeScript code defines a Next.js API route (app/api/chat/route.ts) that processes incoming chat messages. It uses @ai-sdk/openai to interact with an OpenAI model (o1-mini) and streams text responses back to the UI, converting messages to a model-compatible format. The route is configured to allow responses up to 5 minutes.
SOURCE: https://v5.ai-sdk.dev/guides/o1

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow responses up to 5 minutes
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: openai('o1-mini'),
    messages: convertToModelMessages(messages),
  });
  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Render Chat Messages with PDF/Image Attachments and File Upload (React/Next.js)
DESCRIPTION: This React component, designed for Next.js, displays chat messages and handles the rendering of attached images and PDFs. It uses an <iframe> for PDFs and an <img> for images, and includes a file input for users to upload attachments, which are then sent with the chat message.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import Image from 'next/image';

export default function Chat() {
const { messages, input, handleInputChange, handleSubmit } = useChat();
const [files, setFiles] = useState<FileList | undefined>(undefined);
const fileInputRef = useRef<HTMLInputElement>(null);

return (
<div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
{messages.map(m => (
<div key={m.id} className="whitespace-pre-wrap">
{m.role === 'user' ? 'User: ' : 'AI: '}
{m.content}
<div>
{m?.attachments
?.filter(
attachment =>
attachment?.contentType?.startsWith('image/') ||
attachment?.contentType?.startsWith('application/pdf'),
)
.map((attachment, index) =>
attachment.contentType?.startsWith('image/') ? (
<Image
key={`${m.id}-${index}`}
src={attachment.url}
width={500}
height={500}
alt={attachment.name ?? `attachment-${index}`}
/>
) : attachment.contentType?.startsWith('application/pdf') ? (
<iframe
key={`${m.id}-${index}`}
src={attachment.url}
width={500}
height={600}
title={attachment.name ?? `attachment-${index}`}
/>
) : null,
)}
</div>
</div>
))}
<form
className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl space-y-2"
onSubmit={event => {
handleSubmit(event, {
attachments: files,
});
setFiles(undefined);
if (fileInputRef.current) {
fileInputRef.current.value = '';
}
}}
>
<input
type="file"
className=""
onChange={event => {
if (event.target.files) {
setFiles(event.target.files);
}
}}
multiple
ref={fileInputRef}
/>
<input
className="w-full p-2"
value={input}
placeholder="Say something..."
onChange={handleInputChange}
/>
</form>
</div>
);
}
```

----------------------------------------

TITLE: Configure Multi-Step Agentic Generations
DESCRIPTION: Illustrates how to enable multi-step generations for an AI model by specifying a `maxSteps` value with `streamText`. This allows the model to perform multiple actions without user intervention, automatically sending tool results back for subsequent generations.
SOURCE: https://v5.ai-sdk.dev/guides/computer-use

LANGUAGE: JavaScript
CODE:
```
const stream = streamText({
model: anthropic('claude-3-5-sonnet-20241022'),
prompt: 'Open the browser and navigate to vercel.com',
tools: { computer: computerTool },
maxSteps: 10, // experiment with this value based on your use case
});
```

----------------------------------------

TITLE: Implement Chat UI with AI SDK useChat Hook in Next.js
DESCRIPTION: This React component (`app/page.tsx`) demonstrates how to build a chat interface using the `@ai-sdk/react` `useChat` hook. It manages messages, input, and submission, displaying user and AI (Claude 4) responses, including a mechanism to view reasoning tokens.
SOURCE: https://v5.ai-sdk.dev/guides/claude-4

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
const { messages, input, handleInputChange, handleSubmit, error } = useChat();

return (
<div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
<div className="flex-1 overflow-y-auto space-y-4 mb-4">
{messages.map(message => (
<div
key={message.id}
className={`p-3 rounded-lg ${
message.role === 'user' ? 'bg-blue-50 ml-auto' : 'bg-gray-50'
}`}
>
<p className="font-semibold">
{message.role === 'user' ? 'You' : 'Claude 4'}
</p>
{message.parts.map((part, index) => {
if (part.type === 'text') {
return (
<div key={index} className="mt-1">
{part.text}
</div>
);
}
if (part.type === 'reasoning') {
return (
<pre
key={index}
className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-x-auto"
>
<details>
<summary className="cursor-pointer">
View reasoning
</summary>
{part.details.map(detail =>
detail.type === 'text' ? detail.text : '<redacted>',
)}
</details>
</pre>
);
}
})}
</div>
))}
</div>

<form onSubmit={handleSubmit} className="flex gap-2">
<input
name="prompt"
value={input}
onChange={handleInputChange}
className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Ask Claude 4 something..."
/>
<button
type="submit"
className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
Send
</button>
</form>
</div>
);
}
```

----------------------------------------

TITLE: Define and Integrate Weather Tool in AI SDK API Route
DESCRIPTION: This TypeScript code modifies the `server/api/chat.ts` file to define and integrate a new `weather` tool using `@ai-sdk/openai` and `zod`. The tool's `execute` function simulates fetching weather data, allowing the AI model to call it based on user queries and return structured results.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: TypeScript
CODE:
```
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export default defineLazyEventHandler(async () => {
const apiKey = useRuntimeConfig().openaiApiKey;
if (!apiKey) throw new Error('Missing OpenAI API key');

const openai = createOpenAI({
apiKey: apiKey,
});

return defineEventHandler(async (event: any) => {
const { messages }: { messages: UIMessage[] } = await readBody(event);
const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
tools: {
weather: tool({
description: 'Get the weather in a location (fahrenheit)',
parameters: z.object({
location: z
.string()
.describe('The location to get the weather for'),
}),
execute: async ({ location }) => {
const temperature = Math.round(Math.random() * (90 - 32) + 32);
return {
location,
temperature,
};
},
}),
},
});
return result.toUIMessageStreamResponse();
});
});
```

----------------------------------------

TITLE: Repair Tool Calls with Structured Outputs using experimental_repairToolCall
DESCRIPTION: Shows an experimental method to repair invalid tool calls by using `generateObject` with a stronger model (gpt-4o) and the tool's parameter schema to regenerate the arguments. It specifically avoids fixing `NoSuchToolError`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
model,
tools,
prompt,
experimental_repairToolCall: async ({
toolCall,
tools,
parameterSchema,
error,
}) => {
if (NoSuchToolError.isInstance(error)) {
return null; // do not attempt to fix invalid tool names
}

const tool = tools[toolCall.toolName as keyof typeof tools];

const { object: repairedArgs } = await generateObject({
model: openai('gpt-4o'),
schema: tool.parameters,
prompt: [
`The model tried to call the tool "${toolCall.toolName}"` +
` with the following arguments:`,
JSON.stringify(toolCall.args),
`The tool accepts the following schema:`,
JSON.stringify(parameterSchema(toolCall)),
'Please fix the arguments.',
].join('\n'),
});

return { ...toolCall, args: JSON.stringify(repairedArgs) };
},
});
```

----------------------------------------

TITLE: Call Llama 3.1 with DeepInfra using AI SDK Core
DESCRIPTION: This snippet demonstrates how to make a basic text generation call to the Llama 3.1 405B Instruct model via DeepInfra using the AI SDK Core's `generateText` function. It shows the necessary imports and the structure for defining the model and prompt.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
import { deepinfra } from '@ai-sdk/deepinfra';

import { generateText } from 'ai';

const { text } = await generateText({

model: deepinfra('meta-llama/Meta-Llama-3.1-405B-Instruct'),

prompt: 'What is love?',

});
```

----------------------------------------

TITLE: Send Multiple Files as Attachments using FileList (React)
DESCRIPTION: This React component demonstrates how to use the FileList object from a file input to send multiple files as experimental attachments with a chat message. The useChat hook automatically converts image/* and text/* content types into data URLs for multi-modal messages. Other content types require manual handling. It also includes logic to clear the file input after submission.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: tsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { useRef, useState } from 'react';

export default function Page() {

const { messages, input, handleSubmit, handleInputChange, status } =

useChat();

const [files, setFiles] = useState<FileList | undefined>(undefined);

const fileInputRef = useRef<HTMLInputElement>(null);

return (

<div>

<div>

{messages.map(message => (

<div key={message.id}>

<div>{`${message.role}: `}</div>

<div>

{message.parts.map((part, index) =>

part.type === 'text' ? (

<span key={index}>{part.text}</span>

) : null,

)}

<div>

{message.experimental_attachments

?.filter(attachment =>

attachment.contentType.startsWith('image/'),

)

.map((attachment, index) => (

<img

key={`${message.id}-${index}`}

src={attachment.url}

alt={attachment.name}

/>

))}

</div>

</div>

</div>

))}

</div>

<form

onSubmit={event => {

handleSubmit(event, {

experimental_attachments: files,

});

setFiles(undefined);

if (fileInputRef.current) {

fileInputRef.current.value = '';

}

}}

>

<input

type="file"

onChange={event => {

if (event.target.files) {

setFiles(event.target.files);

}

}}

multiple

ref={fileInputRef}

/>

<input

value={input}

placeholder="Send message..."

onChange={handleInputChange}

disabled={status !== 'ready'}

/>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Generate Image using AI SDK with OpenAI DALL-E 3
DESCRIPTION: This snippet demonstrates how to use the `experimental_generateImage` function from the AI SDK to generate an image. It utilizes the `@ai-sdk/openai` package to specify the 'dall-e-3' model and provides a text prompt for image creation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/image-generation

LANGUAGE: TypeScript
CODE:
```
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';

const { image } = await generateImage({
model: openai.image('dall-e-3'),
prompt: 'Santa Claus driving a Cadillac',
});
```

----------------------------------------

TITLE: Configure AI Model Step Control and Logging in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to integrate `stopWhen` with `stepCountIs` and `onStepFinish` into an AI application using `@ai-sdk/openai`. It limits the model to a maximum of 5 steps per generation and logs each step's details, providing insight into the model's tool usage and decision-making process. This setup replaces previous manual logging of tool calls and results.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');
    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: openai('gpt-4o'),
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (in Celsius)',
          parameters: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => ({
            location,
            temperature: Math.round((Math.random() * 30 + 5) * 10) / 10, // Random temp between 5°C and 35°C
          }),
        }),
      },
      stopWhen: stepCountIs(5),
      onStepFinish: step => {
        console.log(JSON.stringify(step, null, 2));
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');
    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

----------------------------------------

TITLE: AI SDK: Using Message Prompts for Conversational AI
DESCRIPTION: Demonstrates how to use an array of messages with different roles (user, assistant) as a prompt, suitable for chat interfaces. The `messages` property allows building conversational context, enabling the model to respond based on prior interactions.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
messages: [
{ role: 'user', content: 'Hi!' },
{ role: 'assistant', content: 'Hello, how can I help?' },
{ role: 'user', content: 'Where can I buy the best Currywurst in Berlin?' },
],
});
```

----------------------------------------

TITLE: Implement Custom Tools with AI SDK for External Interactions
DESCRIPTION: This snippet demonstrates how to integrate custom tools with the AI SDK's Responses API. It defines a `getWeather` tool with parameters and an `execute` function, allowing the language model to interact with external systems or perform specific tasks based on the prompt.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
model: openai.responses('gpt-4o'),
prompt: 'What is the weather like today in San Francisco?',
tools: {
getWeather: tool({
description: 'Get the weather in a location',
parameters: z.object({
location: z.string().describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: 72 + Math.floor(Math.random() * 21) - 10,
}),
}),
},
});
```

----------------------------------------

TITLE: Generate Object with Zod Schema using AI SDK
DESCRIPTION: Demonstrates how to use `generateObject` to create a structured object (a recipe) based on a Zod schema, ensuring the language model's output conforms to the defined structure.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-object

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
model: openai('gpt-4.1'),
schema: z.object({
recipe: z.object({
name: z.string(),
ingredients: z.array(z.string()),
steps: z.array(z.string()),
}),
}),
prompt: 'Generate a lasagna recipe.',
});

console.log(JSON.stringify(object, null, 2));
```

----------------------------------------

TITLE: AI Model Capabilities Reference
DESCRIPTION: A reference table listing various AI models from different providers and their supported capabilities, including image input, object generation, tool usage, and tool streaming. This table is not exhaustive and serves as a quick overview of available models.
SOURCE: https://v5.ai-sdk.dev/foundations/providers-and-models

LANGUAGE: APIDOC
CODE:
```
| Provider                                                                 | Model                                       | Image Input | Object Generation | Tool Usage | Tool Streaming |
| ------------------------------------------------------------------------ | ------------------------------------------- | ----------- | ----------------- | ---------- | -------------- |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-3`                                    |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-3-fast`                               |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-3-mini`                               |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-3-mini-fast`                          |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-2-1212`                               |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-2-vision-1212`                        |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-beta`                                 |             |                   |            |                |
| [xAI Grok](/providers/ai-sdk-providers/xai)                              | `grok-vision-beta`                          |             |                   |            |                |
| [Vercel](/providers/ai-sdk-providers/vercel)                             | `v0-1.0-md`                                 |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4.1`                                   |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4.1-mini`                              |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4.1-nano`                              |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4o`                                    |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4o-mini`                               |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4.1`                                   |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `gpt-4`                                     |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o3-mini`                                   |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o3`                                        |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o4-mini`                                   |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o1`                                        |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o1-mini`                                   |             |                   |            |                |
| [OpenAI](/providers/ai-sdk-providers/openai)                             | `o1-preview`                                |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-4-opus-20250514`                    |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-4-sonnet-20250514`                  |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-3-7-sonnet-20250219`                |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-3-5-sonnet-20241022`                |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-3-5-sonnet-20240620`                |             |                   |            |                |
| [Anthropic](/providers/ai-sdk-providers/anthropic)                       | `claude-3-5-haiku-20241022`                 |             |                   |            |                |
| [Mistral](/providers/ai-sdk-providers/mistral)                           | `pixtral-large-latest`                      |             |                   |            |                |
| [Mistral](/providers/ai-sdk-providers/mistral)                           | `mistral-large-latest`                      |             |                   |            |                |
| [Mistral](/providers/ai-sdk-providers/mistral)                           | `mistral-small-latest`                      |             |                   |            |                |
| [Mistral](/providers/ai-sdk-providers/mistral)                           | `pixtral-12b-2409`                          |             |                   |            |                |
| [Google Generative AI](/providers/ai-sdk-providers/google-generative-ai) | `gemini-2.0-flash-exp`                      |             |                   |            |                |
| [Google Generative AI](/providers/ai-sdk-providers/google-generative-ai) | `gemini-1.5-flash`                          |             |                   |            |                |
| [Google Generative AI](/providers/ai-sdk-providers/google-generative-ai) | `gemini-1.5-pro`                            |             |                   |            |                |
| [Google Vertex](/providers/ai-sdk-providers/google-vertex)               | `gemini-2.0-flash-exp`                      |             |                   |            |                |
| [Google Vertex](/providers/ai-sdk-providers/google-vertex)               | `gemini-1.5-flash`                          |             |                   |            |                |
| [Google Vertex](/providers/ai-sdk-providers/google-vertex)               | `gemini-1.5-pro`                            |             |                   |            |                |
| [DeepSeek](/providers/ai-sdk-providers/deepseek)                         | `deepseek-chat`                             |             |                   |            |                |
| [DeepSeek](/providers/ai-sdk-providers/deepseek)                         | `deepseek-reasoner`                         |             |                   |            |                |
| [Cerebras](/providers/ai-sdk-providers/cerebras)                         | `llama3.1-8b`                               |             |                   |            |                |
| [Cerebras](/providers/ai-sdk-providers/cerebras)                         | `llama3.1-70b`                              |             |                   |            |                |
| [Cerebras](/providers/ai-sdk-providers/cerebras)                         | `llama3.3-70b`                              |             |                   |            |                |
| [Groq](/providers/ai-sdk-providers/groq)                                 | `meta-llama/llama-4-scout-17b-16e-instruct` |             |                   |            |                |
| [Groq](/providers/ai-sdk-providers/groq)                                 | `llama-3.3-70b-versatile`                   |             |                   |            |                |
| [Groq](/providers/ai-sdk-providers/groq)                                 | `llama-3.1-8b-instant`                      |             |                   |            |                |
| [Groq](/providers/ai-sdk-providers/groq)                                 | `mixtral-8x7b-32768`                        |             |                   |            |                |
| [Groq](/providers/ai-sdk-providers/groq)                                 | `gemma2-9b-it`                              |             |                   |            |                |
```

----------------------------------------

TITLE: AI SDK: Stream and Display External Sources
DESCRIPTION: This snippet illustrates how to integrate and display external sources provided by models like Perplexity. The server-side code streams source information using `sendSources: true`, and the client-side code filters and renders these 'source' parts as clickable links.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: TypeScript
CODE:
```
import { perplexity } from '@ai-sdk/perplexity';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: perplexity('sonar-pro'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
  });
}
```

LANGUAGE: JSX
CODE:
```
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts
      .filter(part => part.type !== 'source')
      .map((part, index) => {
        if (part.type === 'text') {
          return <div key={index}>{part.text}</div>;
        }
      })}

    {message.parts
      .filter(part => part.type === 'source')
      .map(part => (
        <span key={`source-${part.source.id}`}>
          [
          <a href={part.source.url} target="_blank">
            {part.source.title ?? new URL(part.source.url).hostname}
          </a>
          ]
        </span>
      ))}
  </div>
));
```

----------------------------------------

TITLE: Orchestrator-Worker Pattern for Feature Implementation
DESCRIPTION: This pattern demonstrates how a primary AI model (orchestrator) can plan a complex task, such as feature implementation, by breaking it down into subtasks. Specialized worker models then execute these subtasks, ensuring overall context is maintained and coherent results are produced. It's ideal for tasks requiring diverse expertise.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

async function implementFeature(featureRequest: string) {
  // Orchestrator: Plan the implementation
  const { object: implementationPlan } = await generateObject({
    model: openai('o3-mini'),
    schema: z.object({
      files: z.array(
        z.object({
          purpose: z.string(),
          filePath: z.string(),
          changeType: z.enum(['create', 'modify', 'delete']),
        }),
      ),
      estimatedComplexity: z.enum(['low', 'medium', 'high']),
    }),
    system:
      'You are a senior software architect planning feature implementations.',
    prompt: `Analyze this feature request and create an implementation plan:
${featureRequest}`,
  });

  // Workers: Execute the planned changes
  const fileChanges = await Promise.all(
    implementationPlan.files.map(async file => {
      // Each worker is specialized for the type of change
      const workerSystemPrompt = {
        create:
          'You are an expert at implementing new files following best practices and project patterns.',
        modify:
          'You are an expert at modifying existing code while maintaining consistency and avoiding regressions.',
        delete:
          'You are an expert at safely removing code while ensuring no breaking changes.',
      }[file.changeType];

      const { object: change } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          explanation: z.string(),
          code: z.string(),
        }),
        system: workerSystemPrompt,
        prompt: `Implement the changes for ${file.filePath} to support:
${file.purpose}
Consider the overall feature context:
${featureRequest}`,
      });

      return {
        file,
        implementation: change,
      };
    }),
  );

  return {
    plan: implementationPlan,
    changes: fileChanges,
  };
}
```

----------------------------------------

TITLE: Set Up Initial Chat API Route with OpenAI StreamText
DESCRIPTION: This API route processes incoming chat messages using OpenAI's `gpt-4o` model via `streamText`. It converts client-side `UIMessage` objects to model-compatible messages and streams the AI's responses back to the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: ts
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'You are a friendly assistant!',
    messages: convertToModelMessages(messages),
    maxSteps: 5,
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Define Zod Schema for Recipe Data
DESCRIPTION: Example of defining a Zod object schema for structuring complex data like a recipe, including nested objects for ingredients and arrays for steps. This schema is crucial for validating tool call parameters or for structured output generation with AI SDK functions like `generateObject`.
SOURCE: https://v5.ai-sdk.dev/foundations/tools

LANGUAGE: TypeScript
CODE:
```
import z from 'zod';

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.string()
      })
    ),
    steps: z.array(z.string())
  })
});
```

----------------------------------------

TITLE: Handle Tool Calls and Results in AI SDK Messages
DESCRIPTION: Shows a complete message flow involving user input, an assistant's tool call, and a subsequent tool message with the result. This demonstrates how to manage single or parallel tool calls and their corresponding results within the `generateText` function.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: javascript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'How many calories are in this block of cheese?',
        },
        { type: 'image', image: fs.readFileSync('./data/roquefort.jpg') },
      ],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          args: { cheese: 'Roquefort' },
        },
        // there could be more tool calls here (parallel calling)
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          result: {
            name: 'Cheese, roquefort',
            calories: 369,
            fat: 31,
            protein: 22,
          },
        },
        // there could be more tool results here (parallel calling)
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Update POST Handler for Resumable Chat Completions
DESCRIPTION: This TypeScript code snippet updates the POST handler for chat completions to enable resumable streams. It outlines the process of generating a fresh `streamId`, persisting it alongside the `chatId`, initiating a `createUIMessageStream` to pipe tokens, and then handing this new stream to `streamContext.resumableStream()` to allow clients to gracefully resume ongoing conversations.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
import {
  convertToModelMessages,
  createDataStream,
  generateId,
  streamText,
  UIMessage
} from 'ai';
import { appendStreamId, saveChat } from '@/util/chat-store';
import { createResumableStreamContext } from 'resumable-stream';
import { openai } from '@ai-sdk/openai';

const streamContext = createResumableStreamContext({
  waitUntil: after,
});

async function POST(request: Request) {
  const { chatId, messages }: { chatId: string; messages: UIMessage[] } =
    await request.json();

  const streamId = generateId();

  // Record this new stream so we can resume later
  await appendStreamId({ chatId, streamId });

  // Build the data stream that will emit tokens
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const result = streamText({
        model: openai('gpt-4o'),
        messages: convertToModelMessages(messages),
      });

      // Return a resumable stream to the client
      writer.merge(result.toUIMessageStream());
    },
  });

  const resumableStream = await streamContext.resumableStream(
    streamId,
    () => stream,
  );

  return resumableStream.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      saveChat({ chatId, messages });
    },
  });
}
```

----------------------------------------

TITLE: Generate Text with Dynamic Template Literal Prompt
DESCRIPTION: This example shows how to create dynamic text prompts using template literals. Variables like `destination` and `lengthOfStay` can be injected directly into the prompt string, allowing for personalized or context-aware content generation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
prompt:
`I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
`Please suggest the best tourist activities for me to do.`,
});
```

----------------------------------------

TITLE: Generate Text with Claude 3.7 Sonnet using AI SDK
DESCRIPTION: Demonstrates how to use the AI SDK's `generateText` function to interact with Claude 3.7 Sonnet. The AI SDK provides a unified API to easily switch between different model providers like Anthropic directly or via Amazon Bedrock.
SOURCE: https://v5.ai-sdk.dev/guides/sonnet-3-7

LANGUAGE: TypeScript
CODE:
```
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text, reasoning, reasoningDetails } = await generateText({
  model: anthropic('claude-3-7-sonnet-20250219'),
  prompt: 'How many people will live in the world in 2040?',
});

console.log(text); // text response
```

LANGUAGE: TypeScript
CODE:
```
import { bedrock } from '@ai-sdk/amazon-bedrock';
import { generateText } from 'ai';

const { reasoning, text } = await generateText({
  model: bedrock('anthropic.claude-3-7-sonnet-20250219-v1:0'),
  prompt: 'How many people will live in the world in 2040?',
});
```

----------------------------------------

TITLE: AI SDK UI useChat() API Signature
DESCRIPTION: Documentation for the `useChat()` hook's API signature, which is used to create conversational user interfaces. This section indicates the presence of parameters, though their specific details are not provided in this excerpt.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-chat

LANGUAGE: APIDOC
CODE:
```
useChat()
  Parameters:
    (Details not provided in this excerpt)
```

----------------------------------------

TITLE: Stop streaming AI responses with useChat hook (React)
DESCRIPTION: This snippet demonstrates how to abort an ongoing streaming response from the AI provider by calling the `stop` function returned by the `useChat` hook. This functionality is crucial for improving user experience and preventing unnecessary resource consumption when a user decides to stop a response mid-stream.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JavaScript
CODE:
```
const { stop, status, ... } = useChat()

return <>
<button onClick={stop} disabled={!(status === 'streaming' || status === 'submitted')}>Stop</button>
...
</>
```

----------------------------------------

TITLE: Initial TypeScript Server Action for SQL Explanation
DESCRIPTION: Defines the `explainQuery` server action in TypeScript. This action takes user input and a SQL query, then uses an OpenAI model (`gpt-4o`) to generate an explanation. The system prompt is omitted for brevity but is based on the SQL expert persona.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...rest of the file... */

export const explainQuery = async (input: string, sqlQuery: string) => {

'use server';

try {

const result = await generateObject({

model: openai('gpt-4o'),

system: `You are a SQL (postgres) expert. ...`, // SYSTEM PROMPT AS ABOVE - OMITTED FOR BREVITY

prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

User Query:

${input}

Generated SQL Query:

${sqlQuery}`,

});

return result.object;

} catch (e) {

console.error(e);

throw new Error('Failed to generate query');

}

};
```

----------------------------------------

TITLE: Managing Client-Side Loading State with AI SDK RSC in Next.js
DESCRIPTION: This example demonstrates how to handle loading state in a Next.js application using AI SDK RSC. The client component (`app/page.tsx`) manages a local `loading` state, disables input during processing, and updates the UI as the streamed response arrives. The server action (`app/actions.ts`) generates text using `streamText` and wraps it in a `createStreamableValue` for client consumption.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/loading-state

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useState } from 'react';
import { generateResponse } from './actions';
import { readStreamableValue } from '@ai-sdk/rsc';

// Force the page to be dynamic and allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [generation, setGeneration] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  return (
    <div>
      <div>{generation}</div>
      <form
        onSubmit={async e => {
          e.preventDefault();
          setLoading(true);
          const response = await generateResponse(input);
          let textContent = '';
          for await (const delta of readStreamableValue(response)) {
            textContent = `${textContent}${delta}`;
            setGeneration(textContent);
          }
          setInput('');
          setLoading(false);
        }}
      >
        <input
          type="text"
          value={input}
          disabled={loading}
          className="disabled:opacity-50"
          onChange={event => {
            setInput(event.target.value);
          }}
        />
        <button>Send Message</button>
      </form>
    </div>
  );
}
```

LANGUAGE: TypeScript
CODE:
```
'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';

export async function generateResponse(prompt: string) {
  const stream = createStreamableValue();

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4o'),
      prompt,
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
  })();

  return stream.value;
}
```

----------------------------------------

TITLE: Refine AI Chatbot Prompt with System Instructions
DESCRIPTION: This snippet updates the Next.js API route to include a system prompt, guiding the AI model to use only retrieved information and respond with 'Sorry, I don't know' if no relevant information is found. This restricts the model's behavior for more controlled responses.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a helpful assistant. Check your knowledge base before answering any questions.
Only respond to questions using information from tool calls.
if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Basic `streamUI` Function Call with Text Fallback
DESCRIPTION: This example demonstrates the fundamental usage of the `streamUI` function. It shows how to initialize `streamUI` with an OpenAI model and a prompt, and how to handle the model's plain text responses by rendering them as a React `div` component, even without defining any specific tools.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-react-components

LANGUAGE: JavaScript
CODE:
```
const result = await streamUI({
  model: openai('gpt-4o'),
  prompt: 'Get the weather for San Francisco',
  text: ({ content }) => <div>{content}</div>,
  tools: {},
});
```

----------------------------------------

TITLE: Catching UI Errors in AI SDK Server Actions
DESCRIPTION: This server action demonstrates how to use `createStreamableUI` from `@ai-sdk/rsc` to stream UI updates. It includes an error handling mechanism using a `.catch()` block on the asynchronous operation, which calls `ui.error()` to send an error UI to the client in case of failure during data fetching or UI generation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/error-handling

LANGUAGE: TypeScript
CODE:
```
'use server';

import { createStreamableUI } from '@ai-sdk/rsc';

export async function getStreamedUI() {

const ui = createStreamableUI();

(async () => {

ui.update(<div>loading</div>);

const data = await fetchData();

ui.done(<div>{data}</div>);

})().catch(e => {

ui.error(<div>Error: {e.message}</div>);

});

return ui.value;

}
```

----------------------------------------

TITLE: Set Up AI SDK Provider Registry
DESCRIPTION: Explains how to create a provider registry using `createProviderRegistry` to manage multiple AI providers (e.g., Anthropic, OpenAI) and their models in a centralized manner.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/provider-management

LANGUAGE: TypeScript
CODE:
```
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic,
  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
});
```

----------------------------------------

TITLE: generateText() API Signature
DESCRIPTION: Detailed API documentation for the `generateText` function, outlining all its parameters, their types, and descriptions, including complex message structures and tool definitions.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
generateText() API Signature:
  Parameters:
    model: LanguageModel
      Description: The language model to use. Example: openai('gpt-4o')
    system: string
      Description: The system prompt to use that specifies the behavior of the model.
    prompt: string
      Description: The input prompt to generate the text from.
    messages: Array<SystemModelMessage | UserModelMessage | AssistantModelMessage | ToolModelMessage> | Array<UIMessage>
      Description: A list of messages that represent a conversation. Automatically converts UI messages from the useChat hook.
      SystemModelMessage:
        role: 'system'
          Description: The role for the system message.
        content: string
          Description: The content of the message.
      UserModelMessage:
        role: 'user'
          Description: The role for the user message.
        content: string | Array<TextPart | ImagePart | FilePart>
          Description: The content of the message.
          TextPart:
            type: 'text'
              Description: The type of the message part.
            text: string
              Description: The text content of the message part.
          ImagePart:
            type: 'image'
              Description: The type of the message part.
            image: string | Uint8Array | Buffer | ArrayBuffer | URL
              Description: The image content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.
            mediaType?: string
              Description: The IANA media type of the image. Optional.
          FilePart:
            type: 'file'
              Description: The type of the message part.
            data: string | Uint8Array | Buffer | ArrayBuffer | URL
              Description: The file content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.
            mediaType: string
              Description: The IANA media type of the file.
      AssistantModelMessage:
        role: 'assistant'
          Description: The role for the assistant message.
        content: string | Array<TextPart | FilePart | ReasoningPart | ToolCallPart>
          Description: The content of the message.
          TextPart:
            type: 'text'
              Description: The type of the message part.
            text: string
              Description: The text content of the message part.
          ReasoningPart:
            type: 'reasoning'
              Description: The type of the message part.
            text: string
              Description: The reasoning text.
          FilePart:
            type: 'file'
              Description: The type of the message part.
            data: string | Uint8Array | Buffer | ArrayBuffer | URL
              Description: The file content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.
            mediaType: string
              Description: The IANA media type of the file.
            filename?: string
              Description: The name of the file.
          ToolCallPart:
            type: 'tool-call'
              Description: The type of the message part.
            toolCallId: string
              Description: The id of the tool call.
            toolName: string
              Description: The name of the tool, which typically would be the name of the function.
            args: object based on zod schema
              Description: Parameters generated by the model to be used by the tool.
      ToolModelMessage:
        role: 'tool'
          Description: The role for the assistant message.
        content: Array<ToolResultPart>
          Description: The content of the message.
          ToolResultPart:
            type: 'tool-result'
              Description: The type of the message part.
            toolCallId: string
              Description: The id of the tool call the result corresponds to.
            toolName: string
              Description: The name of the tool the result corresponds to.
            result: unknown
              Description: The result returned by the tool after execution.
            isError?: boolean
              Description: Whether the result is an error or an error message.
    tools: ToolSet
      Description: Tools that are accessible to and can be called by the model. The model needs to support calling tools.
      Tool:
        description?: string
          Description: Information about the purpose of the tool including details on how and when it can be used by the model.
```

----------------------------------------

TITLE: Generate Structured JSON Data with AI SDK and Zod Schema
DESCRIPTION: This example illustrates how to generate structured JSON data using `generateObject` from the AI SDK. It leverages Zod for schema definition, ensuring the model's output conforms to a specified type-safe structure, useful for extracting or classifying information.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { object } = await generateObject({
model: openai.responses('gpt-4o'),
schema: z.object({
recipe: z.object({
name: z.string(),
ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
steps: z.array(z.string()),
}),
}),
prompt: 'Generate a lasagna recipe.',
});
```

----------------------------------------

TITLE: Implement Chat UI with Status and Stop Functionality
DESCRIPTION: This example extends the basic chat UI to incorporate the `status` property from the `useChat` hook. It demonstrates how to display a loading spinner during submission/streaming and how to provide a "Stop" button to abort the current AI response.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {

const { messages, input, handleInputChange, handleSubmit, status, stop } =

useChat({});

return (

<>

{messages.map(message => (

<div key={message.id}>

{message.role === 'user' ? 'User: ' : 'AI: '}

{message.parts.map((part, index) =>

part.type === 'text' ? <span key={index}>{part.text}</span> : null,

)}

</div>

))}

{(status === 'submitted' || status === 'streaming') && (

<div>

{status === 'submitted' && <Spinner />}

<button type="button" onClick={() => stop()}>

Stop

</button>

</div>

)}

<form onSubmit={handleSubmit}>

<input

name="prompt"

value={input}

onChange={handleInputChange}

disabled={status !== 'ready'}

/>

<button type="submit">Submit</button>

</form>

</>

);

}
```

----------------------------------------

TITLE: AI SDK: Full Tool Message Exchange
DESCRIPTION: Explains how to integrate tool calls and tool results within the `generateText` flow. It shows a complete conversation turn involving a user query, an assistant's tool call, and the subsequent tool message containing the tool's result. It also notes the possibility of parallel tool calls/results.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: javascript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'How many calories are in this block of cheese?',
        },
        { type: 'image', image: fs.readFileSync('./data/roquefort.jpg') },
      ],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          args: { cheese: 'Roquefort' },
        },
        // there could be more tool calls here (parallel calling)
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          result: {
            name: 'Cheese, roquefort',
            calories: 369,
            fat: 31,
            protein: 22,
          },
        },
        // there could be more tool results here (parallel calling)
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Send Image URL in AI SDK User Message
DESCRIPTION: Demonstrates sending an image by providing its URL in a user message. The AI model will fetch the image from the specified URL.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image:
            'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',
        },
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Send Base64 Encoded Image in AI SDK User Message
DESCRIPTION: Shows how to send a base64-encoded image string in a user message. The image data is read from a file and converted to a base64 string before being sent.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png').toString('base64'),
        },
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Multi-Step Tool Calling with maxSteps in generateText
DESCRIPTION: Illustrates how to enable multi-step tool interactions by setting the `maxSteps` parameter in `generateText`. This allows the AI SDK to perform subsequent generations after a tool call, enabling the model to process tool results or make multiple tool calls within a single interaction flow.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { z } from 'zod';

import { generateText, tool } from 'ai';

const { text, steps } = await generateText({
	model: yourModel,
	tools: {
		weather: tool({
			description: 'Get the weather in a location',
			parameters: z.object({
				location: z.string().describe('The location to get the weather for'),
			}),
			execute: async ({ location }) => ({
				location,
				temperature: 72 + Math.floor(Math.random() * 21) - 10,
			}),
		}),
	},
	maxSteps: 5, // allow up to 5 steps
	prompt: 'What is the weather in San Francisco?',
});
```

----------------------------------------

TITLE: Implement Svelte Frontend for AI Chat with AI SDK UI
DESCRIPTION: This Svelte component (`src/routes/+page.svelte`) integrates the AI SDK's `Chat` class to create a reactive chat interface. It displays messages, binds user input, and handles form submissions to interact with the backend API.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: Svelte
CODE:
```
<script>

import { Chat } from '@ai-sdk/svelte';

const chat = new Chat();

</script>

<main>

<ul>

{#each chat.messages as message, messageIndex (messageIndex)}

<li>

<div>{message.role}</div>

<div>

{#each message.parts as part, partIndex (partIndex)}

{#if part.type === 'text'}

<div>{part.text}</div>

{if}

{/each}

</div>

</li>

{/each}

</ul>

<form onsubmit={chat.handleSubmit}>

<input bind:value={chat.input} />

<button type="submit">Send</button>

</form>

</main>
```

----------------------------------------

TITLE: Enhancing AI with Tools (Weather & Web Search) in AI SDK
DESCRIPTION: Extends the `generateResponse` function by integrating `getWeather` and `searchWeb` tools. Shows tool definition with Zod schemas, asynchronous execution, and enabling multi-step agentic flows with `maxSteps` for dynamic interactions.
SOURCE: https://v5.ai-sdk.dev/guides/slackbot

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { exa } from './utils';

export const generateResponse = async (
  messages: ModelMessage[],
  updateStatus?: (status: string) => void,
) => {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `You are a Slack bot assistant. Keep your responses concise and to the point.
- Do not tag users.
- Current date is: ${new Date().toISOString().split('T')[0]}
- Always include sources in your final response if you use web search.`,
    messages,
    maxSteps: 10,
    tools: {
      getWeather: tool({
        description: 'Get the current weather at a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
          city: z.string(),
        }),
        execute: async ({ latitude, longitude, city }) => {
          updateStatus?.(`is getting weather for ${city}...`);
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relativehumidity_2m&timezone=auto`,
          );
          const weatherData = await response.json();
          return {
            temperature: weatherData.current.temperature_2m,
            weatherCode: weatherData.current.weathercode,
            humidity: weatherData.current.relativehumidity_2m,
            city,
          };
        },
      }),
      searchWeb: tool({
        description: 'Use this to search the web for information',
        parameters: z.object({
          query: z.string(),
          specificDomain: z
            .string()
            .nullable()
            .describe(
              'a domain to search if the user specifies e.g. bbc.com. Should be only the domain name without the protocol',
            ),
        }),
        execute: async ({ query, specificDomain }) => {
          updateStatus?.(`is searching the web for ${query}...`);
          const { results } = await exa.searchAndContents(query, {
            livecrawl: 'always',
            numResults: 3,
            includeDomains: specificDomain ? [specificDomain] : undefined,
          });
          return {
            results: results.map(result => ({
              title: result.title,
              url: result.url,
              snippet: result.text.slice(0, 1000),
            })),
          };
        },
      }),
    },
  });

  // Convert markdown to Slack mrkdwn format
  return text.replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>').replace(/\*\*/g, '*');
};
```

----------------------------------------

TITLE: Handling Multi-modal Tool Results with AI SDK
DESCRIPTION: This snippet demonstrates how to convert multi-modal tool results, such as screenshots, into a format consumable by the AI model using the `experimental_toToolResultContent` function. It shows an example of a `computer` tool executing a 'screenshot' action and mapping its binary data to an image content part for the LLM.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
const result = await generateText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  tools: {
    computer: anthropic.tools.computer_20241022({
      // ...
      async execute({ action, coordinate, text }) {
        switch (action) {
          case 'screenshot': {
            return {
              type: 'image',
              data: fs
                .readFileSync('./data/screenshot-editor.png')
                .toString('base64'),
            };
          }
          default: {
            return `executed ${action}`;
          }
        }
      },

      // map to tool result content for LLM consumption:
      experimental_toToolResultContent(result) {
        return typeof result === 'string'
          ? [{ type: 'text', text: result }]
          : [{ type: 'image', data: result.data, mediaType: 'image/png' }];
      },
    }),
  },
  // ...
});
```

----------------------------------------

TITLE: Send and Update Custom Data Parts with AI SDK `UIMessageStreamWriter` (TypeScript)
DESCRIPTION: Shows how to send and dynamically update custom data parts (e.g., weather information) to the client using `writer.write` within an AI SDK stream. This allows for real-time updates of specific data elements.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/streaming-data

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createUIMessageStreamResponse({
    execute: ({ writer }) => {
      // write custom data part:
      writer.write({
        type: 'data-weather',
        id: 'weather-1',
        data: { city: 'San Francisco', status: 'loading' },
      });

      const result = streamText({
        model: openai('gpt-4.1'),
        messages: convertToModelMessages(messages),
        onFinish() {
          // update the data part:
          writer.write({
            type: 'data-weather',
            id: 'weather-1',
            data: {
              city: 'San Francisco',
              weather: 'sunny',
              status: 'success',
            },
          });
        },
      });

      writer.merge(result.toUIMessageStream());
    },
  });
}
```

----------------------------------------

TITLE: Send Custom URL Sources with AI SDK `UIMessageStreamWriter` (TypeScript)
DESCRIPTION: Illustrates how to send custom source objects, such as URLs, to the client using the `writer.write` method on the `UIMessageStreamWriter` within an AI SDK stream. This allows for rich content display on the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/streaming-data

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import {
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
} from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createUIMessageStreamResponse({
    execute: ({ writer }) => {
      // write a custom url source to the stream:
      writer.write({
        type: 'source',
        value: {
          type: 'source',
          sourceType: 'url',
          id: 'source-1',
          url: 'https://example.com',
          title: 'Example Source',
        },
      });

      const result = streamText({
        model: openai('gpt-4.1'),
        messages: convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
  });
}
```

----------------------------------------

TITLE: Handling Multiple Tool Calls and Dynamic UI Rendering in React
DESCRIPTION: This React JSX snippet illustrates a pattern for rendering different UI components based on the name of the tool called by the language model. It uses conditional rendering to display specific components like `<Courses/>`, `<People/>`, or `<Meetings/>` depending on the `message.name` property, managing complexity for applications with multiple AI-driven functionalities.
SOURCE: https://v5.ai-sdk.dev/advanced/rendering-ui-with-language-models

LANGUAGE: TypeScript
CODE:
```
{
  message.role === 'tool' ? (
    message.name === 'api-search-course' ? (
      <Courses courses={message.content} />
    ) : message.name === 'api-search-profile' ? (
      <People people={message.content} />
    ) : message.name === 'api-meetings' ? (
      <Meetings meetings={message.content} />
    ) : message.name === 'api-search-building' ? (
      <Buildings buildings={message.content} />
    ) : message.name === 'api-events' ? (
      <Events events={message.content} />
    ) : message.name === 'api-meals' ? (
      <Meals meals={message.content} />
    ) : null
  ) : (
    <div>{message.content}</div>
  );
}
```

----------------------------------------

TITLE: Call Server Action to Stream Generative UI in Next.js Frontend
DESCRIPTION: This client-side React component demonstrates how to call a server action (`streamComponent`) to trigger the streaming of a generative UI. It uses `useState` to manage the dynamically streamed React component and displays it upon button submission, integrating server-side AI logic with the client-side UI.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useState } from 'react';
import { streamComponent } from './actions';

export default function Page() {
const [component, setComponent] = useState<React.ReactNode>();

return (
<div>
<form
onSubmit={async e => {
e.preventDefault();
setComponent(await streamComponent());
}}
>
<button>Stream Component</button>
</form>
<div>{component}</div>
</div>
);
}
```

----------------------------------------

TITLE: AI SDK UI: Route Handler for Streaming Text (After Migration)
DESCRIPTION: This code snippet shows the migration to AI SDK UI, separating text generation from UI rendering. It uses a Next.js route handler with `streamText` to stream AI-generated text, which is then converted into a UI message stream response for the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request) {
const { messages } = await request.json();

const result = streamText({
model: openai('gpt-4o'),
system: 'you are a friendly assistant!',
messages,
tools: {
// tool definitions
},
});

return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Generate Text with Message Prompts for Chat Interfaces
DESCRIPTION: This example demonstrates using an array of messages with different roles (`user`, `assistant`) as a prompt. Message prompts are ideal for building chat interfaces or handling complex, multi-turn conversations, allowing for a structured dialogue history.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
messages: [
{ role: 'user', content: 'Hi!' },
{ role: 'assistant', content: 'Hello, how can I help?' },
{ role: 'user', content: 'Where can I buy the best Currywurst in Berlin?' },
],
});
```

----------------------------------------

TITLE: Create AI SDK Chat API Route with OpenAI
DESCRIPTION: This TypeScript code defines an asynchronous POST request handler for a chat API route (`/api/chat`). It uses the AI SDK to stream text responses from the OpenAI `gpt-4o` model, converting incoming UI messages to model messages and streaming the result back to the client.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({
model: openai('gpt-4o'),
messages: convertToModelMessages(messages),
});

return result.toUIMessageStreamResponse({
headers: {
'Content-Type': 'application/octet-stream',
'Content-Encoding': 'none',
},
});
}
```

----------------------------------------

TITLE: Convert UIMessage to ModelMessage for Streaming Text (AI SDK 5)
DESCRIPTION: This code demonstrates how to handle incoming UIMessages from a client, convert them to ModelMessages using `convertToModelMessages`, and then stream text responses from an OpenAI model. The `toUIMessageStreamResponse()` utility ensures the output is compatible with the UI message stream, highlighting the necessary explicit conversion for model interaction.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Update AI State in Server Actions using getMutableAIState
DESCRIPTION: This snippet demonstrates how to update the AI state from within a Server Action using the `getMutableAIState` function. It provides methods like `.update()` and `.done()` to modify the conversation history, ensuring the state remains synchronized with new user messages and model responses.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
import { getMutableAIState } from '@ai-sdk/rsc';

export async function sendMessage(message: string) {
  'use server';
  const history = getMutableAIState();

  // Update the AI state with the new user message.
  history.update([...history.get(), { role: 'user', content: message }]);

  const response = await generateText({
    model: openai('gpt-3.5-turbo'),
    messages: history.get(),
  });

  // Update the AI state again with the response from the model.
  history.done([...history.get(), { role: 'assistant', content: response }]);

  return response;
}
```

----------------------------------------

TITLE: AI SDK: Stream Text with convertToModelMessages in Next.js API Route
DESCRIPTION: This code snippet demonstrates how to set up a Next.js API route to handle chat messages. It uses `convertToModelMessages` to prepare incoming UI messages for `streamText` with an OpenAI model, then streams the response back to the UI.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/convert-to-model-messages

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText } from 'ai';

export async function POST(req: Request) {

const { messages } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: API: Streaming Object Generation with `createStreamableValue` and `streamObject`
DESCRIPTION: Describes the functionality of `createStreamableValue` and `streamObject` in the AI SDK. `createStreamableValue` enables streaming any serializable data from the server to the client, while `streamObject` facilitates streaming structured object generations, allowing for real-time updates of complex data structures.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: APIDOC
CODE:
```
Function: createStreamableValue
  Purpose: Streams any serializable data from server to client.

Function: streamObject
  Purpose: Streams object generations from the server to the client.
  Usage: Paired with `createStreamableValue` for real-time object streaming.
```

----------------------------------------

TITLE: Add Weather Tool to Chatbot API Route (TypeScript)
DESCRIPTION: This snippet modifies the `src/routes/api/chat/+server.ts` file to introduce a 'weather' tool. It uses `@ai-sdk/openai` for model interaction and `zod` for defining tool parameters, allowing the LLM to invoke external actions like fetching weather data. The `execute` function simulates fetching data, which can be replaced with a real API call.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: TypeScript
CODE:
```
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { OPENAI_API_KEY } from '$env/static/private';

const openai = createOpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST({ request }) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Update API route to add weather tool
DESCRIPTION: Modify your `app/api/chat+api.ts` file to include a new weather tool. This code imports `tool` and `zod` for schema validation, defines a `weather` tool with a description and parameters (using Zod for `location`), and includes an `execute` function that simulates fetching weather data. The model will use this tool when it determines it needs weather information, extracting parameters from the conversation.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for')
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature
          };
        }
      })
    }
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none'
    }
  });
}
```

----------------------------------------

TITLE: TypeScript: Define and Use a Weather Tool with generateText
DESCRIPTION: This TypeScript snippet demonstrates how to define a `getWeather` tool with `zod` for parameter validation and integrate it with `generateText` from the AI SDK. It shows how a language model can deterministically call this tool based on user prompts, or not call any function if the query is out of scope.
SOURCE: https://v5.ai-sdk.dev/advanced/model-as-router

LANGUAGE: typescript
CODE:
```
const sendMessage = (prompt: string) =>
generateText({
model: 'gpt-3.5-turbo',
system: 'you are a friendly weather assistant!',
prompt,
tools: {
getWeather: {
description: 'Get the weather in a location',
parameters: z.object({
location: z.string().describe('The location to get the weather for'),
}),
execute: async ({ location }: { location: string }) => ({
location,
temperature: 72 + Math.floor(Math.random() * 21) - 10,
}),
},
},
});
sendMessage('What is the weather in San Francisco?'); // getWeather is called
sendMessage('What is the weather in New York?'); // getWeather is called
sendMessage('What events are happening in London?'); // No function is called
```

----------------------------------------

TITLE: Authenticating a Server Action in AI SDK RSC
DESCRIPTION: This TypeScript snippet demonstrates how to secure a Server Action (`getWeather`) in an AI SDK RSC application. It checks for a valid authentication token from cookies using a `validateToken` utility. If the token is missing or invalid, an error is returned. Otherwise, it proceeds to create and update a streamable UI component, showcasing how to handle UI streaming within an authenticated context.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/authentication

LANGUAGE: tsx
CODE:
```
'use server';

import { cookies } from 'next/headers';

import { createStreamableUI } from '@ai-sdk/rsc';

import { validateToken } from '../utils/auth';

export const getWeather = async () => {

const token = cookies().get('token');

if (!token || !validateToken(token)) {

return {

error: 'This action requires authentication',

};

}

const streamableDisplay = createStreamableUI(null);

streamableDisplay.update(<Skeleton />);

streamableDisplay.done(<Weather />);

return {

display: streamableDisplay.value,

};

};
```

----------------------------------------

TITLE: Client-Side UI Rendering from Server Stream
DESCRIPTION: This snippet illustrates the client-side React component responsible for rendering the streamed UI. It iterates over a `messages` array, displaying the `display` property of each message, which contains the React component streamed from the server, simplifying client-side logic.
SOURCE: https://v5.ai-sdk.dev/advanced/rendering-ui-with-language-models

LANGUAGE: TypeScript
CODE:
```
return (

<div>

{messages.map(message => (

<div>{message.display}</div>

))}

</div>

);
```

----------------------------------------

TITLE: Integrating Custom Error Handling with AI SDK Streamed Responses
DESCRIPTION: This snippet demonstrates how to pass a custom `onError` function, such as the `errorHandler` utility, to `result.toUIMessageStreamResponse()`. This allows the application to display specific error messages to the user instead of the default masked 'An error occurred' message, improving debugging and user feedback.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
const result = streamText({

// ...

});

return result.toUIMessageStreamResponse({

onError: errorHandler,

});
```

----------------------------------------

TITLE: Import streamUI from AI SDK RSC
DESCRIPTION: This snippet shows how to import the `streamUI` function from the `@ai-sdk/rsc` package, which is essential for using its UI streaming capabilities.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/stream-ui

LANGUAGE: TypeScript
CODE:
```
import { streamUI } from "@ai-sdk/rsc"
```

----------------------------------------

TITLE: Add HTTP Headers for Streaming Response
DESCRIPTION: This code snippet demonstrates how to add 'Transfer-Encoding: chunked' and 'Connection: 'keep-alive'' headers to the UI message stream response. These headers are often necessary to ensure proper streaming behavior when an AI SDK application is deployed, preventing the full response from being returned at once.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/streaming-not-working-when-deployed

LANGUAGE: JavaScript
CODE:
```
return result.toUIMessageStreamResponse({
  headers: {
    'Transfer-Encoding': 'chunked',
    Connection: 'keep-alive'
  }
});
```

----------------------------------------

TITLE: Advanced AI Provider and Model Configuration with Registry and Middleware
DESCRIPTION: Illustrates a comprehensive setup for managing AI providers and models, including passing through full providers, configuring OpenAI-compatible providers with custom settings, defining model name aliases, pre-configuring model settings, validating provider-specific options, using fallback providers, and limiting available models. It also shows how to define a custom separator for the provider registry.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/provider-management

LANGUAGE: javascript
CODE:
```
import { anthropic, AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { xai } from '@ai-sdk/xai';
import { groq } from '@ai-sdk/groq';
import {
  createProviderRegistry,
  customProvider,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from 'ai';

export const registry = createProviderRegistry(
  {
    // pass through a full provider with a namespace prefix
    xai,

    // access an OpenAI-compatible provider with custom setup
    custom: createOpenAICompatible({
      name: 'provider-name',
      apiKey: process.env.CUSTOM_API_KEY,
      baseURL: 'https://api.custom.com/v1',
    }),

    // setup model name aliases
    anthropic: customProvider({
      languageModels: {
        fast: anthropic('claude-3-haiku-20240307'),
        // simple model
        writing: anthropic('claude-3-7-sonnet-20250219'),
        // extended reasoning model configuration:
        reasoning: wrapLanguageModel({
          model: anthropic('claude-3-7-sonnet-20250219'),
          middleware: defaultSettingsMiddleware({
            settings: {
              maxOutputTokens: 100000, // example default setting
              providerMetadata: {
                anthropic: {
                  thinking: {
                    type: 'enabled',
                    budgetTokens: 32000,
                  },
                } satisfies AnthropicProviderOptions,
              },
            },
          }),
        }),
      },
      fallbackProvider: anthropic,
    }),

    // limit a provider to certain models without a fallback
    groq: customProvider({
      languageModels: {
        'gemma2-9b-it': groq('gemma2-9b-it'),
        'qwen-qwq-32b': groq('qwen-qwq-32b'),
      },
    }),
  },
  { separator: ' > ' },
);

// usage:
const model = registry.languageModel('anthropic > reasoning');
```

----------------------------------------

TITLE: Implement Chat Route Handler (Next.js App Router)
DESCRIPTION: Defines a Next.js App Router POST handler (`app/api/chat/route.ts`) that receives chat messages, converts them for the model, and streams responses from the OpenAI `gpt-4o` model using the AI SDK.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { streamText, convertToModelMessages, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Handle Errors in `streamText` with `onError` Callback
DESCRIPTION: Illustrates how to implement an `onError` callback with the `streamText` function to gracefully handle and log errors that occur during streaming. This prevents server crashes by integrating error handling directly into the stream processing.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: JavaScript
CODE:
```
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onError({ error }) {
    console.error(error); // your error logging logic here
  },
});
```

----------------------------------------

TITLE: Complete AI SDK React Chat with Custom Data Parts
DESCRIPTION: This example provides a full-fledged chat component using '@ai-sdk/react' that integrates custom data parts. It showcases how to set up 'useChat' with 'dataPartSchemas' for 'weather' data, handle user input, submit messages, and render both text and custom data parts dynamically within the chat interface.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/streaming-data

LANGUAGE: tsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

import { z } from 'zod';

export default function Chat() {
const { messages, input, handleInputChange, handleSubmit } = useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
dataPartSchemas: {
weather: z.object({
city: z.string(),
weather: z.string().optional(),
status: z.enum(['loading', 'success']),
}),
},
}),
});

return (
<>
{messages?.map(message => (
<div key={message.id}>
{message.role === 'user' ? 'User: ' : 'AI: '}
{message.parts
.filter(part => part.type === 'data-weather')
.map((part, index) => (
<span
key={index}
style={{ border: '1px solid blue', padding: '4px' }}
>
{part.data.status === 'loading' ? (
<>Getting weather for {part.data.city}...</>
) : (
<>
Weather in {part.data.city}: {part.data.weather}
</>
)}
</span>
))}
{message.parts
.filter(part => part.type === 'text')
.map((part, index) => (
<div key={index}>{part.text}</div>
))}
</div>
))}

<form onSubmit={handleSubmit}>
<input value={input} onChange={handleInputChange} />
</form>
</>
);
}
```

----------------------------------------

TITLE: Stream Text Error Handling with toUIMessageStreamResponse
DESCRIPTION: Demonstrates how to use the `getErrorMessage` function within `toUIMessageStreamResponse` to extract and forward specific error messages from `streamText` error parts, handling different error types like `NoSuchToolError`, `InvalidToolArgumentsError`, and `ToolExecutionError`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
const result = streamText({
// ...
});

return result.toUIMessageStreamResponse({
getErrorMessage: error => {
if (NoSuchToolError.isInstance(error)) {
return 'The model tried to call a unknown tool.';
} else if (InvalidToolArgumentsError.isInstance(error)) {
return 'The model called a tool with invalid arguments.';
} else if (ToolExecutionError.isInstance(error)) {
return 'An error occurred during tool execution.';
} else {
return 'An unknown error occurred.';
}
},
});
```

----------------------------------------

TITLE: Call Abort Signal
DESCRIPTION: An optional abort signal that can be used to cancel the overall API call.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
AbortSignal

An optional abort signal that can be used to cancel the call.
```

----------------------------------------

TITLE: Read AI State in Client Components using useAIState
DESCRIPTION: This snippet demonstrates how to read the AI state in a Client Component using the `useAIState` hook provided by `@ai-sdk/rsc`. The hook returns the current AI state, which can be used to display the conversation history.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useAIState } from '@ai-sdk/rsc';

export default function Page() {
  const [messages, setMessages] = useAIState();

  return (
    <ul>
      {messages.map(message => (
        <li key={message.id}>{message.content}</li>
      ))}
    </ul>
  );
}
```

----------------------------------------

TITLE: AI SDK `embed()` Function API Reference
DESCRIPTION: Detailed API documentation for the `embed()` function, outlining its parameters (model, value, retries, abort signal, headers, experimental telemetry) and the structure of its return values (embedding, usage, response details).
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/embed

LANGUAGE: APIDOC
CODE:
```
embed(options: object): Promise<{ embedding: number[], value: VALUE, usage: EmbeddingModelUsage, response?: Response }>

Parameters:
  model: EmbeddingModel
    The embedding model to use. Example: openai.embedding('text-embedding-3-small')
  value: VALUE
    The value to embed. The type depends on the model.
  maxRetries?: number
    Maximum number of retries. Set to 0 to disable retries. Default: 2.
  abortSignal?: AbortSignal
    An optional abort signal that can be used to cancel the call.
  headers?: Record<string, string>
    Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
  experimental_telemetry?: TelemetrySettings
    Telemetry configuration. Experimental feature.
    TelemetrySettings:
      isEnabled?: boolean
        Enable or disable telemetry. Disabled by default while experimental.
      recordInputs?: boolean
        Enable or disable input recording. Enabled by default.
      recordOutputs?: boolean
        Enable or disable output recording. Enabled by default.
      functionId?: string
        Identifier for this function. Used to group telemetry data by function.
      metadata?: Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>
        Additional information to include in the telemetry data.
      tracer?: Tracer
        A custom tracer to use for the telemetry data.

Returns:
  value: VALUE
    The value that was embedded.
  embedding: number[]
    The embedding of the value.
  usage: EmbeddingModelUsage
    The token usage for generating the embeddings.
    EmbeddingModelUsage:
      tokens: number
        The number of tokens used in the embedding.
  response?: Response
    Optional response data.
    Response:
      headers?: Record<string, string>
        Response headers.
      body?: unknown
        The response body.
```

----------------------------------------

TITLE: TypeScript: Embedding Logic for Knowledge Base Search
DESCRIPTION: This code updates the embedding logic file (`lib/ai/embedding.ts`) to enable semantic search. It includes `generateEmbeddings` for creating embeddings from text chunks, `generateEmbedding` for single string embeddings, and `findRelevantContent` to query the database for semantically similar items based on a user's query. It uses OpenAI's embedding model and Drizzle ORM for database interaction.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from '../db';
import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { embeddings } from '../db/schema/embeddings';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
return input
.trim()
.split('.')
.filter(i => i !== '');
};

export const generateEmbeddings = async (
value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
const chunks = generateChunks(value);
const { embeddings } = await embedMany({
model: embeddingModel,
values: chunks,
});
return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
const input = value.replaceAll('\n', ' ');
const { embedding } = await embed({
model: embeddingModel,
value: input,
});
return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
const userQueryEmbedded = await generateEmbedding(userQuery);
const similarity = sql<number>`1 - (${cosineDistance(
embeddings.embedding,
userQueryEmbedded,
)})`;

const similarGuides = await db
.select({ name: embeddings.content, similarity })
.from(embeddings)
.where(gt(similarity, 0.5))
.orderBy(t => desc(t.similarity))
.limit(4);

return similarGuides;
};
```

----------------------------------------

TITLE: Implement Basic Chat UI with AI SDK useChat Hook (Next.js)
DESCRIPTION: Sets up `app/page.tsx` for a chat interface using `@ai-sdk/react`'s `useChat` hook. It displays messages and provides an input field, connecting to the `/api/chat` route. Requires the `'use client'` directive for interactivity.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit } = useChat();

return (

<div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">

{messages.map(m => (

<div key={m.id} className="whitespace-pre-wrap">

{m.role === 'user' ? 'User: ' : 'AI: '}

{m.content}

</div>

))}

<form

onSubmit={handleSubmit}

className="fixed bottom-0 w-full max-w-md mb-8 border border-gray-300 rounded shadow-xl"

>

<input

className="w-full p-2"

value={input}

placeholder="Say something..."

onChange={handleInputChange}

/>

</form>

</div>

);

}
```

----------------------------------------

TITLE: API Parameters for streamUI Function
DESCRIPTION: Defines the input parameters for the `streamUI` function, including callbacks for UI generation, tool choices, text handling, and provider-specific options.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/stream-ui

LANGUAGE: APIDOC
CODE:
```
streamUI Parameters:
  generate?: (async (parameters) => ReactNode) | AsyncGenerator<ReactNode, ReactNode, void>
    A function or a generator function that is called with the arguments from the tool call and yields React nodes as the UI.
  toolChoice?: "auto" | "none" | "required" | { "type": "tool", "toolName": string }
    The tool choice setting. It specifies how tools are selected for execution. The default is "auto". "none" disables tool execution. "required" requires tools to be executed. { "type": "tool", "toolName": string } specifies a specific tool to execute.
  text?: (Text) => ReactNode
    Callback to handle the generated tokens from the model.
  providerOptions?: Record<string,Record<string,JSONValue>> | undefined
    Provider-specific options. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.
  onFinish?: (result: OnFinishResult) => void
    Callback that is called when the LLM response and all request tool executions (for tools that have a `generate` function) are finished.
```

----------------------------------------

TITLE: Implement Retrieval Augmented Generation (RAG) with Language Model Middleware in TypeScript
DESCRIPTION: This example illustrates how to integrate RAG functionality as `LanguageModelV2Middleware`. It transforms the model parameters by adding relevant source information to the last user message, based on helper functions like `getLastUserMessageText` and `findSources` (which are external to the AI SDK).
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import type { LanguageModelV2Middleware } from 'ai';

export const yourRagMiddleware: LanguageModelV2Middleware = {
  transformParams: async ({ params }) => {
    const lastUserMessageText = getLastUserMessageText({
      prompt: params.prompt,
    });

    if (lastUserMessageText == null) {
      return params; // do not use RAG (send unmodified parameters)
    }

    const instruction =
      'Use the following information to answer the question:\n' +
      findSources({ text: lastUserMessageText })
        .map(chunk => JSON.stringify(chunk))
        .join('\n');

    return addToLastUserMessage({ params, text: instruction });
  },
};
```

----------------------------------------

TITLE: Regenerate last AI message with useChat hook (React)
DESCRIPTION: This example shows how to request the AI provider to reprocess and regenerate the last message using the `reload` function from the `useChat` hook. This allows users to easily get an alternative response if the previous one was unsatisfactory, replacing the current message in the chat UI.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JavaScript
CODE:
```
const { reload, status, ... } = useChat()

return <>
<button onClick={reload} disabled={!(status === 'ready' || status === 'error')}>Regenerate</button>
...
</>
```

----------------------------------------

TITLE: Basic Text Generation with Claude 4 Sonnet using AI SDK
DESCRIPTION: This code demonstrates a fundamental text generation call to Claude 4 Sonnet via the AI SDK. It imports necessary modules from @ai-sdk/anthropic and ai, then uses generateText to query the model and log the output. This snippet showcases the minimal setup for interacting with Anthropic models.
SOURCE: https://v5.ai-sdk.dev/guides/claude-4

LANGUAGE: TypeScript
CODE:
```
import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const { text, reasoning, reasoningDetails } = await generateText({
model: anthropic('claude-4-sonnet-20250514'),
prompt: 'How will quantum computing impact cryptography by 2050?',
});
console.log(text);
```

----------------------------------------

TITLE: AI SDK useChat Hook API Reference
DESCRIPTION: Details the properties and functions provided by the `@ai-sdk/react` `useChat` hook, essential for managing chat state and user interactions in a frontend application.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: APIDOC
CODE:
```
useChat Hook:
  messages: Array<{id: string, role: 'user' | 'AI', content: string, attachments?: Array<{url: string, contentType: string, name?: string}>}> - The current chat messages.
  input: string - The current value of the user's input field.
  handleInputChange: Function - Handles changes to the user input field.
  handleSubmit: Function - Handles form submission, optionally accepting attachments (FileList or array of URLs).
  status: string - The status of the API request.
```

----------------------------------------

TITLE: Call Llama 3.1 with Amazon Bedrock using AI SDK Core
DESCRIPTION: This example illustrates the flexibility of the AI SDK Core, allowing easy switching between different model providers. It shows how to call the Llama 3.1 405B Instruct model through Amazon Bedrock by simply changing the provider import and model identifier.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';

import { bedrock } from '@ai-sdk/amazon-bedrock';

const { text } = await generateText({

model: bedrock('meta.llama3-1-405b-instruct-v1'),

prompt: 'What is love?',

});
```

----------------------------------------

TITLE: Wrap React Application with AI Context Provider
DESCRIPTION: This snippet shows how to integrate the `AI` context provider into the application's root layout. Wrapping the `children` with `<AI>` makes the AI and UI state accessible throughout the entire application, enabling state management across components.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
import { type ReactNode } from 'react';
import { AI } from './ai';

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <AI>
      <html lang="en">
        <body>{children}</body>
      </html>
    </AI>
  );
}
```

----------------------------------------

TITLE: Handle Errors in Streamed Objects with onError Callback
DESCRIPTION: Explains how to provide an `onError` callback to `streamObject` to log errors that occur during streaming. This prevents the server from crashing by handling errors as part of the stream.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: typescript
CODE:
```
import { streamObject } from 'ai';

const result = streamObject({
  // ...
  onError({ error }) {
    console.error(error); // your error logging logic here
  }
});
```

----------------------------------------

TITLE: Custom Error Handling for AI SDK UI Message Creation
DESCRIPTION: This example shows how to directly define an `onError` callback within the `createUIMessageResponse` function. This provides a flexible way to handle errors during the creation of UI messages, allowing for custom error messages or logging based on the specific error encountered.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
const response = createUIMessageResponse({

// ...

async execute(dataStream) {

// ...

},

onError: error => `Custom error: ${error.message}`,

});
```

----------------------------------------

TITLE: Configure AI SDK Chat Client with maxSteps Option
DESCRIPTION: This snippet modifies the client-side `app/page.tsx` file to configure the `useChat` hook from `@ai-sdk/react`. It sets the `maxSteps` option to 5 within the `chatStore` configuration, allowing the AI model to perform up to 5 sequential steps for a single generation, enabling more complex interactions.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-app-router

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit } = useChat({

chatStore: defaultChatStoreOptions({

api: '/api/chat',

maxSteps: 5,

}),

});

// ... rest of your component code

}
```

----------------------------------------

TITLE: Configure Multi-Step Tool Calls in Svelte Chat UI
DESCRIPTION: This Svelte snippet demonstrates how to initialize the `Chat` class from `@ai-sdk/svelte` with the `maxSteps` option. Setting `maxSteps` to a value like 5 enables the AI model to perform multiple sequential tool calls and process their results before generating a final response, facilitating more complex conversational flows.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: Svelte
CODE:
```
<script>

import { Chat } from '@ai-sdk/svelte';

const chat = new Chat({ maxSteps: 5 });

</script>

<!-- ... rest of your component code -->

```

----------------------------------------

TITLE: Handle Chat Errors with onError Callback in AI SDK React
DESCRIPTION: Illustrates the use of the `onError` callback function available in `useChat` and `useCompletion` hooks. This callback receives an error object, allowing for custom error processing, such as logging or displaying user-friendly messages.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/error-handling

LANGUAGE: typescript
CODE:
```
import { useChat } from '@ai-sdk/react';
import { defaultChatStoreOptions } from 'ai';

export default function Page() {
const {
/* ... */
} = useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
// handle error:
onError: error => {
console.error(error);
},
}),
});
}
```

----------------------------------------

TITLE: Defining Agent Stopping Conditions with AI SDK's stopWhen
DESCRIPTION: The `stopWhen` parameter allows you to specify when an AI agent should terminate its execution. This can be based on reaching a maximum number of steps, detecting a specific tool call, or satisfying a custom condition like total token usage. This feature is crucial for building controllable and reliable AI systems.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: JavaScript
CODE:
```
const result = generateText({
// ...
// stop loop at 5 steps
stopWhen: stepCountIs(5),
});

const result = generateText({
// ...
// stop loop when weather tool called
stopWhen: hasToolCall('weather'),
});

const result = generateText({
// ...
// stop loop at your own custom condition
stopWhen: maxTotalTokens(20000),
});
```

----------------------------------------

TITLE: Create AI Context Provider with createAI in AI SDK RSC
DESCRIPTION: This code demonstrates how to create the AI context provider using `createAI` from `@ai-sdk/rsc`. It defines the `AIState` and `UIState` types and initializes the provider with empty states and the `sendMessage` server action, enabling global state management.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
import { createAI } from '@ai-sdk/rsc';
import { ClientMessage, ServerMessage, sendMessage } from './actions';

export type AIState = ServerMessage[];
export type UIState = ClientMessage[];

// Create the AI provider with the initial states and allowed actions
export const AI = createAI<AIState, UIState>({
  initialAIState: [],
  initialUIState: [],
  actions: {
    sendMessage,
  },
});
```

----------------------------------------

TITLE: Logging a Meal using Tool Interaction
DESCRIPTION: This snippet demonstrates a basic interaction flow where a user requests to log a meal. The language model identifies the appropriate tool (`log_meal`), generates its parameters based on the user's input, and provides a confirmation response to the user.
SOURCE: https://v5.ai-sdk.dev/advanced/multistep-interfaces

LANGUAGE: Tool Interaction
CODE:
```
User: Log a chicken shawarma for lunch.

Tool: log_meal("chicken shawarma", "250g", "12:00 PM")

Model: Chicken shawarma has been logged for lunch.
```

----------------------------------------

TITLE: Embedding a Single Value with AI SDK
DESCRIPTION: The AI SDK provides the `embed` function to embed single values, which is useful for tasks such as finding similar words or phrases or clustering text. You can use it with embeddings models, e.g. `openai.embedding('text-embedding-3-large')` or `mistral.embedding('mistral-embed')`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/embeddings

LANGUAGE: TypeScript
CODE:
```
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// 'embedding' is a single embedding object (number[])
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach'
});
```

----------------------------------------

TITLE: Define and Execute AI Tool in Route Handler (TypeScript)
DESCRIPTION: This snippet demonstrates how to define a custom tool, specifically a 'weather' tool, within an AI SDK route handler (`app/api/chat/route.ts`). It uses `@ai-sdk/openai` for model interaction and `zod` for parameter validation. The tool includes a description for model understanding, a `location` parameter, and an `execute` function that simulates fetching weather data, enabling the AI to perform external actions.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-app-router

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for')
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature
          };
        }
      })
    }
  });

  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Extracting Images from Multi-Modal Language Model Responses
DESCRIPTION: Shows how to use `generateText` with a multi-modal language model like Google `gemini-2.0-flash-exp` to generate text and images. It demonstrates iterating through the `files` property of the response to identify and access image data in various formats (base64, Uint8Array).
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/image-generation

LANGUAGE: javascript
CODE:
```
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
model: google('gemini-2.0-flash-exp'),
providerOptions: {
google: { responseModalities: ['TEXT', 'IMAGE'] },
},
prompt: 'Generate an image of a comic cat',
});

for (const file of result.files) {
if (file.mediaType.startsWith('image/')) {
// The file object provides multiple data formats:
// Access images as base64 string, Uint8Array binary data, or check type
// - file.base64: string (data URL format)
// - file.uint8Array: Uint8Array (binary data)
// - file.mediaType: string (e.g. "image/png")
}
}
```

----------------------------------------

TITLE: Save Chats: AI SDK UI `streamText` `onFinish` Callback
DESCRIPTION: Illustrates saving chat messages using the `onFinish` callback of the `streamText` function in an AI SDK UI route handler. This approach captures the complete conversation, including user input and AI responses, after the streaming process is finished.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { saveChat } from '@/utils/queries';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(request) {
  const { id, messages } = await request.json();
  const coreMessages = convertToModelMessages(messages);

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'you are a friendly assistant!',
    messages: coreMessages,
    onFinish: async ({ response }) => {
      try {
        await saveChat({
          id,
          messages: [...coreMessages, ...response.messages]
        });
      } catch (error) {
        console.error('Failed to save chat');
      }
    }
  });
  return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Calculate Cosine Similarity with AI SDK Embeddings
DESCRIPTION: This code snippet demonstrates how to use the `cosineSimilarity` function from the 'ai' package in conjunction with `@ai-sdk/openai` to compare two embedding vectors. It shows the process of generating embeddings for two different text inputs and then calculating their cosine similarity.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/cosine-similarity

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { cosineSimilarity, embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['sunny day at the beach', 'rainy afternoon in the city'],
});

console.log(
  `cosine similarity: ${cosineSimilarity(embeddings[0], embeddings[1])}`,
);
```

----------------------------------------

TITLE: Create Next.js API Route for AI Chat Endpoint
DESCRIPTION: Defines a Next.js API route (`app/api/chat/route.ts`) that handles incoming chat messages. It uses the OpenAI model to process messages and streams text responses back to the UI, ensuring efficient communication with the AI provider.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4.5-preview'),

messages: convertToModelMessages(messages),

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Sending System Messages to Guide AI Model Behavior (JavaScript)
DESCRIPTION: This code snippet demonstrates how to send a system message to an AI model using `generateText`. The system message, defined with `role: 'system'`, instructs the model to act as a travel itinerary planner, influencing its subsequent responses to user queries.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({

model: yourModel,

messages: [

{ role: 'system', content: 'You help planning travel itineraries.' },

{

role: 'user',

content:

'I am planning a trip to Berlin for 3 days. Please suggest the best tourist activities for me to do.',

},

],

});
```

----------------------------------------

TITLE: Abort Image Generation with Timeout in AI SDK
DESCRIPTION: Demonstrates how to use an `AbortSignal` with `generateImage` to cancel the image generation process or set a timeout. This example shows aborting the request after 1 second.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/image-generation

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { experimental_generateImage as generateImage } from 'ai';
const { image } = await generateImage({
model: openai.image('dall-e-3'),
prompt: 'Santa Claus driving a Cadillac',
abortSignal: AbortSignal.timeout(1000), // Abort after 1 second
});
```

----------------------------------------

TITLE: Import useChat Hook for AI SDK React Applications
DESCRIPTION: This snippet demonstrates how to import the `useChat` hook from the `@ai-sdk/react` package, which is essential for integrating conversational AI capabilities into React-based chatbot applications.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-chat

LANGUAGE: TypeScript
CODE:
```
import { useChat } from '@ai-sdk/react'
```

----------------------------------------

TITLE: JavaScript Lazy Stream Consumption for Cancellation and Back-pressure
DESCRIPTION: This JavaScript code provides a corrected implementation for wrapping a generator into a `ReadableStream` using the `pull` method. By implementing `pull`, the stream requests new values from the generator only when a consumer is ready to read, effectively tying the generator's lifetime to the reader's and preventing excessive buffering and memory issues. This approach addresses both back-pressure and cancellation, ensuring resources are freed when the consumer stops reading.
SOURCE: https://v5.ai-sdk.dev/advanced/backpressure

LANGUAGE: javascript
CODE:
```
// Wraps a generator into a ReadableStream
function createStream(iterator) {
return new ReadableStream({
async pull(controller) {
const { value, done } = await iterator.next();
if (done) {
controller.close();
} else {
controller.enqueue(value);
}
},
});
}
```

----------------------------------------

TITLE: Convert to UI Message Stream
DESCRIPTION: Converts the stream result into a UI message stream, offering extensive options for customization. These options include setting new message IDs, providing original messages, defining callbacks for stream completion, extracting message metadata, and controlling which stream parts (reasoning, sources, start/finish events) are sent to the client.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
toUIMessageStream: (options?: UIMessageStreamOptions) => ReadableStream<UIMessageStreamPart>
  Converts the result to a UI message stream.
UIMessageStreamOptions
  newMessageId?: string
    Message ID that is sent to the client if a new message is created.
  originalMessages?: UIMessage[]
    The original messages.
  onFinish?: (options: { messages: UIMessage[]; isContinuation: boolean; responseMessage: UIMessage; }) => void
    Callback function called when the stream finishes. Provides the updated list of UI messages, whether the response is a continuation, and the response message.
  messageMetadata?: (options: { part: TextStreamPart<TOOLS> & { type: "start" | "finish" | "start-step" | "finish-step"; }; }) => unknown
    Extracts message metadata that will be sent to the client. Called on start and finish events.
  sendReasoning?: boolean
    Send reasoning parts to the client. Defaults to false.
  sendSources?: boolean
    Send source parts to the client. Defaults to false.
  sendFinish?: boolean
    Send the finish event to the client. Defaults to true.
  sendStart?: boolean
    Send the message start event to the client. Set to false if you are using additional streamText calls and the message start event has already been sent. Defaults to true. Note: this setting is currently not used, but you should already set it to false if you are using additional streamText calls that send additional data to prevent the message start event from being sent multiple times.
  onError?: (error: unknown) => string
    Process an error, e.g. to log it. Returns error message to include in the data stream. Defaults to () => "An error occurred."
```

----------------------------------------

TITLE: Send Binary Image Content to AI Model (AI SDK)
DESCRIPTION: Illustrates sending an image as a binary Buffer (e.g., read from a file system) to an AI model. The image content is included as an `image` type part within the user message.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model,
messages: [
{
role: 'user',
content: [
{ type: 'text', text: 'Describe the image in detail.' },
{
type: 'image',
image: fs.readFileSync('./data/comic-cat.png'),
},
],
},
],
});
```

----------------------------------------

TITLE: Generate Array with Zod Schema using AI SDK
DESCRIPTION: Illustrates generating an array of structured objects (hero descriptions) by specifying an array output type and a Zod schema for individual array items, useful for synthetic data generation.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-object

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
model: openai('gpt-4.1'),
output: 'array',
schema: z.object({
name: z.string(),
class: z
.string()
.describe('Character class, e.g. warrior, mage, or thief.'),
description: z.string(),
}),
prompt: 'Generate 3 hero descriptions for a fantasy role playing game.',
});
```

----------------------------------------

TITLE: AI SDK Common Model Configuration Parameters
DESCRIPTION: Details various parameters for configuring AI model behavior, including output token limits, sampling strategies (temperature, topP, topK), and penalties. These settings allow fine-grained control over the model's generation process.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-object

LANGUAGE: APIDOC
CODE:
```
maxOutputTokens?: number
  Maximum number of tokens to generate.
temperature?: number
  Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.
topP?: number
  Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.
topK?: number
  Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.
presencePenalty?: number
  Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.
frequencyPenalty?: number
  Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.
seed?: number
  The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.
maxRetries?: number
  Maximum number of retries. Set to 0 to disable retries. Default: 2.
abortSignal?: AbortSignal
  An optional abort signal that can be used to cancel the call.
headers?: Record<string, string>
  Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
```

----------------------------------------

TITLE: APIDOC: streamUI Function
DESCRIPTION: Calls a model and allows it to respond with React Server Components, enabling generative UI.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/overview

LANGUAGE: APIDOC
CODE:
```
streamUI(): Calls a model and allows it to respond with React Server Components.
```

----------------------------------------

TITLE: Implement Server-side GET Handler for Chat Stream Resumption
DESCRIPTION: This code snippet provides the implementation for the `GET` handler at `/api/chat`, which is essential for resuming chat streams. It demonstrates how to read the `chatId` from the query string, validate its presence, load stored stream IDs, and return the most recent active stream using `streamContext.resumableStream()`, falling back to an empty stream if none are found or active.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: ts
CODE:
```
import { loadStreams } from '@/util/chat-store';
import { createUIMessageStream, JsonToSseTransformStream } from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';

export async function GET(request: Request) {
const streamContext = createResumableStreamContext({
waitUntil: after,
});
const { searchParams } = new URL(request.url);
const chatId = searchParams.get('chatId');

if (!chatId) {
return new Response('id is required', { status: 400 });
}

const streamIds = await loadStreams(chatId);
if (!streamIds.length) {
return new Response('No streams found', { status: 404 });
}

const recentStreamId = streamIds.at(-1);
if (!recentStreamId) {
return new Response('No recent stream found', { status: 404 });
}

const emptyDataStream = createUIMessageStream({
execute: () => {},
});

return new Response(
await streamContext.resumableStream(recentStreamId, () =>
emptyDataStream.pipeThrough(new JsonToSseTransformStream()),
),
);
}
```

----------------------------------------

TITLE: Using onStepFinish Callback for Step Completion Notifications
DESCRIPTION: The `onStepFinish` callback is triggered when a generation step is finished, meaning all text deltas, tool calls, and tool results for that step are available. It allows developers to implement custom logic, such as saving chat history or recording usage, based on the completed step's data.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: JavaScript
CODE:
```
import { generateText, stepCountIs } from 'ai';

const result = await generateText({
  model: yourModel,
  stopWhen: stepCountIs(10),
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    // your own logic, e.g. for saving the chat history or recording usage
  },
  // ...
});
```

----------------------------------------

TITLE: AI SDK Structured Output Generation
DESCRIPTION: Provides experimental settings and methods for generating structured outputs, including plain text and JSON objects based on a defined schema.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
experimental_output?: Output
  Experimental setting for generating structured outputs.
Output:
  Output.text(): Output
    Forward text output.
  Output.object(): Output
    Generate a JSON object of type OBJECT.
Options:
  schema: Schema<OBJECT>
    The schema of the JSON object to generate.
```

----------------------------------------

TITLE: Filter and Render Specific Data Parts in React Chat
DESCRIPTION: This snippet demonstrates how to filter and render specific data parts, such as 'data-weather', from the 'messages' array in an AI SDK React chat application. It uses Zod for schema validation and conditionally displays content based on the data part's status (e.g., 'loading' or 'success').
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/streaming-data

LANGUAGE: tsx
CODE:
```
import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

import { z } from 'zod';

const { messages } = useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
dataPartSchemas: {
weather: z.object({
city: z.string(),
weather: z.string().optional(),
status: z.enum(['loading', 'success']),
}),
},
}),
});

const result = (
<>
{messages?.map(message => (
<div key={message.id}>
{message.parts
.filter(part => part.type === 'data-weather')
.map((part, index) => (
<div key={index}>
{part.data.status === 'loading' ? (
<>Getting weather for {part.data.city}...</>
) : (
<>
Weather in {part.data.city}: {part.data.weather}
</>
)}
</div>
))}
{message.parts
.filter(part => part.type === 'text')
.map((part, index) => (
<div key={index}>{part.text}</div>
))}
</div>
))}
</>
);
```

----------------------------------------

TITLE: AI SDK Vue `useChat` Hook API Reference
DESCRIPTION: Documentation for the `useChat` hook from `@ai-sdk/vue`, detailing its provided state variables and utility functions for building chat interfaces.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: APIDOC
CODE:
```
useChat Hook:
  messages: Array<Object>
    description: The current chat messages.
    properties:
      id: string
      role: 'user' | 'AI'
      parts: Array<Object>
        description: An ordered array of parts representing the model's output.
        properties:
          id: string
          type: string (e.g., 'text')
          text: string (if type is 'text')
  input: string
    description: The current value of the user's input field.
  handleSubmit: Function
    description: Function to handle form submission.
```

----------------------------------------

TITLE: Update Client with AI SDK React useChat Hook and Tool Invocations
DESCRIPTION: This snippet demonstrates how to use the `useChat` hook from `@ai-sdk/react` to manage chat messages and render UI components based on `toolInvocations`. It shows how to display a `Weather` component when a 'displayWeather' tool returns a result, or a loading state while it's in progress.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: jsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { Weather } from '@/components/weather';

export default function Page() {

const { messages, input, setInput, handleSubmit } = useChat();

return (

<div>

{messages.map(message => (

<div key={message.id}>

<div>{message.role}</div>

<div>{message.content}</div>

<div>

{message.toolInvocations.map(toolInvocation => {

const { toolName, toolCallId, state } = toolInvocation;

if (state === 'result') {

const { result } = toolInvocation;

return (

<div key={toolCallId}>

{toolName === 'displayWeather' ? (

<Weather weatherAtLocation={result} />

) : null}

</div>

);

} else {

return (

<div key={toolCallId}>

{toolName === 'displayWeather' ? (

<div>Loading weather...</div>

) : null}

</div>

);

})}

</div>

</div>

))}

<form onSubmit={handleSubmit}>

<input

type="text"

value={input}

onChange={event => {

setInput(event.target.value);

}}

/>

<button type="submit">Send</button>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Handling Errors with generateObject
DESCRIPTION: When `generateObject` fails to produce a valid object, it throws an `AI_NoObjectGeneratedError`. This error indicates that the AI provider could not generate a parsable object conforming to the schema, potentially due to model failure, parsing issues, or validation failures. The error object provides details like the generated text, response metadata, token usage, and the underlying cause for debugging.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: TypeScript
CODE:
```
import { generateObject, NoObjectGeneratedError } from 'ai';

try {
  await generateObject({ model, schema, prompt });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.log('NoObjectGeneratedError');
    console.log('Cause:', error.cause);
    console.log('Text:', error.text);
    console.log('Response:', error.response);
    console.log('Usage:', error.usage);
  }
}
```

LANGUAGE: APIDOC
CODE:
```
AI_NoObjectGeneratedError:
  Description: Thrown when `generateObject` cannot generate a valid object that conforms to the schema.
  Properties:
    text:
      Type: string
      Description: The text generated by the model (raw or tool call text).
    response:
      Type: object
      Description: Metadata about the language model response (id, timestamp, model).
    usage:
      Type: object
      Description: Request token usage.
    cause:
      Type: any
      Description: The underlying cause of the error (e.g., a JSON parsing error).
  Static Method:
    isInstance(error: any): boolean
      Description: Checks if a given error object is an instance of `NoObjectGeneratedError`.
```

----------------------------------------

TITLE: Create .env File for API Key
DESCRIPTION: This command creates an empty .env file in the project's root directory. This file will be used to store sensitive environment variables, such as the OpenAI API key, which are necessary for authenticating with the OpenAI service.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: bash
CODE:
```
touch .env
```

----------------------------------------

TITLE: Handling Non-UI Streaming Errors in AI SDK Server Actions
DESCRIPTION: This server action illustrates how to manage errors that occur during data streaming using `createStreamableValue`. Instead of sending UI, it streams data. The `try...catch` block wraps the asynchronous data fetching and updating process, allowing the server action to return a structured error object (`{ error: e.message }`) to the client if any part of the streaming process fails, providing clear failure reasons.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/error-handling

LANGUAGE: TypeScript
CODE:
```
'use server';

import { createStreamableValue } from '@ai-sdk/rsc';

import { fetchData, emptyData } from '../utils/data';

export const getStreamedData = async () => {

const streamableData = createStreamableValue<string>(emptyData);

try {

(() => {

const data1 = await fetchData();

streamableData.update(data1);

const data2 = await fetchData();

streamableData.update(data2);

const data3 = await fetchData();

streamableData.done(data3);

})();

return { data: streamableData.value };

} catch (e) {

return { error: e.message };

}

};
```

----------------------------------------

TITLE: Customize useCompletion Hook Request Options
DESCRIPTION: This JavaScript code demonstrates how to customize the `useCompletion` hook's HTTP request. It sets a custom API endpoint (`/api/custom-completion`), adds an `Authorization` header, includes a `user_id` in the request body, and specifies `same-origin` credentials for the fetch request. This allows for more flexible server-side handling of AI completion requests.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/completion

LANGUAGE: JavaScript
CODE:
```
const { messages, input, handleInputChange, handleSubmit } = useCompletion({
api: '/api/custom-completion',
headers: {
Authorization: 'your_token',
},
body: {
user_id: '123',
},
credentials: 'same-origin',
});
```

----------------------------------------

TITLE: Define AI Tools and Server Action for Flight Booking
DESCRIPTION: This snippet defines `searchFlights` and `lookupFlight` utility functions, then exposes `submitUserMessage` as a server action. It uses `@ai-sdk/rsc` to stream UI components based on AI model interactions, integrating Zod for parameter validation and dynamically generating UI based on tool outputs.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
import { streamUI } from '@ai-sdk/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const searchFlights = async (
source: string,
destination: string,
date: string,
) => {
return [
{
id: '1',
flightNumber: 'AA123',
},
{
id: '2',
flightNumber: 'AA456',
},
];
};

const lookupFlight = async (flightNumber: string) => {
return {
flightNumber: flightNumber,
departureTime: '10:00 AM',
arrivalTime: '12:00 PM',
};
};

export async function submitUserMessage(input: string) {
'use server';

const ui = await streamUI({
model: openai('gpt-4o'),
system: 'you are a flight booking assistant',
prompt: input,
text: async ({ content }) => <div>{content}</div>,
tools: {
searchFlights: {
description: 'search for flights',
parameters: z.object({
source: z.string().describe('The origin of the flight'),
destination: z.string().describe('The destination of the flight'),
date: z.string().describe('The date of the flight'),
}),
generate: async function* ({ source, destination, date }) {
yield `Searching for flights from ${source} to ${destination} on ${date}...`;

const results = await searchFlights(source, destination, date);

return (
<div>
{results.map(result => (
<div key={result.id}>
<div>{result.flightNumber}</div>
</div>
))}
</div>
);
},
},
lookupFlight: {
description: 'lookup details for a flight',
parameters: z.object({
flightNumber: z.string().describe('The flight number'),
}),
generate: async function* ({ flightNumber }) {
yield `Looking up details for flight ${flightNumber}...`;

const details = await lookupFlight(flightNumber);

return (
<div>
<div>Flight Number: {details.flightNumber}</div>
<div>Departure Time: {details.departureTime}</div>
<div>Arrival Time: {details.arrivalTime}</div>
</div>
);
},
},
},
});

return ui.value;
}
```

----------------------------------------

TITLE: Implement `generateQuery` with AI SDK and Zod for Structured Output
DESCRIPTION: Full implementation of the `generateQuery` Server Action. It uses `generateObject` from the AI SDK to constrain the model's output to a Zod schema, ensuring only the SQL query is returned. The function handles errors and returns the generated query.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...other imports... */

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

/* ...rest of the file... */

export const generateQuery = async (input: string) => {
'use server';
try {
const result = await generateObject({
model: openai('gpt-4o'),
system: `You are a SQL (postgres) ...`, // SYSTEM PROMPT AS ABOVE - OMITTED FOR BREVITY
prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
schema: z.object({
query: z.string(),
}),
});
return result.object.query;
} catch (e) {
console.error(e);
throw new Error('Failed to generate query');
}
};
```

----------------------------------------

TITLE: AI SDK Tool Call Repair and Error Handling
DESCRIPTION: Describes mechanisms for repairing malformed tool calls and handling errors that occur during tool call parsing or execution, including access to system prompts, messages, and error details.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
experimental_repairToolCall?: (options: ToolCallRepairOptions) => Promise<LanguageModelV2ToolCall | null>
  A function that attempts to repair a tool call that failed to parse. Return either a repaired tool call or null if the tool call cannot be repaired.
  Type: ToolCallRepairOptions
ToolCallRepairOptions:
  system: string | undefined
    The system prompt.
  messages: ModelMessage[]
    The messages in the current generation step.
  toolCall: LanguageModelV2ToolCall
    The tool call that failed to parse.
  tools: TOOLS
    The tools that are available.
  parameterSchema: (options: { toolName: string }) => JSONSchema7
    A function that returns the JSON Schema for a tool.
  error: NoSuchToolError | InvalidToolArgumentsError
    The error that occurred while parsing the tool call.
```

----------------------------------------

TITLE: Define Simulated Weather Tool for AI Model Integration
DESCRIPTION: This TypeScript file defines `weatherTool` using `ai`'s `createTool` and `zod` for schema validation. It simulates a weather lookup, demonstrating how to create custom functions that an AI model can invoke based on conversation context.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: ts
CODE:
```
import { tool as createTool } from 'ai';
import { z } from 'zod';

export const weatherTool = createTool({
  description: 'Display the weather for a location',
  parameters: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async function ({ location }) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { weather: 'Sunny', temperature: 75, location };
  },
});

export const tools = {
  displayWeather: weatherTool,
};
```

----------------------------------------

TITLE: Sequential Tool Calls for Event Planning
DESCRIPTION: This snippet demonstrates a sequence of function calls a language model might generate to fulfill a user's request to schedule an event. Each call represents a distinct step in the process, from searching contacts and events to finding locations and creating the final event.
SOURCE: https://v5.ai-sdk.dev/advanced/model-as-router

LANGUAGE: JavaScript
CODE:
```
searchContacts("Max")
```

LANGUAGE: JavaScript
CODE:
```
getEvents("2023-10-18", ["jrmy", "mleiter"])
```

LANGUAGE: JavaScript
CODE:
```
searchNearby("Bar")
```

LANGUAGE: JavaScript
CODE:
```
createEvent("2023-10-18", ["jrmy", "mleiter"])
```

----------------------------------------

TITLE: Backend Text Stream Generation with streamText (Next.js API Route)
DESCRIPTION: This Next.js API route demonstrates how to generate a text stream using `streamText` from the `ai` library and `openai` model. It sets a maximum duration for streaming responses and returns the result as a text stream HTTP response.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/stream-protocol

LANGUAGE: ts
CODE:
```
import { streamText } from 'ai';

import { openai } from '@ai-sdk/openai';

// Allow streaming responses up to 30 seconds

export const maxDuration = 30;

export async function POST(req: Request) {

const { prompt }: { prompt: string } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

prompt,

});

return result.toTextStreamResponse();

}
```

----------------------------------------

TITLE: Handle AI chat lifecycle events with useChat callbacks (React)
DESCRIPTION: This example showcases the optional event callbacks provided by the `useChat` hook, including `onFinish`, `onError`, and `onResponse`. These callbacks allow developers to execute custom logic at different stages of the chatbot's lifecycle, such as logging, analytics, or dynamic UI adjustments. It also notes that throwing an error in `onResponse` can abort processing and trigger `onError`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JavaScript
CODE:
```
import { UIMessage } from 'ai';

const {
/* ... */
} = useChat({
onFinish: (message, { usage, finishReason }) => {
console.log('Finished streaming message:', message);
console.log('Token usage:', usage);
console.log('Finish reason:', finishReason);
},
onError: error => {
console.error('An error occurred:', error);
},
onResponse: response => {
console.log('Received HTTP response from server:', response);
},
});
```

----------------------------------------

TITLE: Closing createStreamableUI Streams in TypeScript
DESCRIPTION: This TypeScript example illustrates the correct way to close a stream created with `createStreamableUI` from `@ai-sdk/rsc`. The `stream.done()` method is crucial for preventing slow UI updates and ensuring the stream is properly finalized after all content has been appended or updated.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/unclosed-streams

LANGUAGE: TypeScript
CODE:
```
import { createStreamableUI } from '@ai-sdk/rsc';

const submitMessage = async () => {
'use server';
const stream = createStreamableUI('1');
stream.update('2');
stream.append('3');
stream.done('4'); // [!code ++]
return stream.value;
};
```

----------------------------------------

TITLE: Update Next.js UI to Display AI SDK Tool Calls
DESCRIPTION: This React component, using the `@ai-sdk/react` hook, updates the chat interface to conditionally render information about tool calls. Instead of a typical text response, it displays 'calling tool: [toolName]' when the AI model invokes a tool, providing real-time feedback to the user.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

export default function Chat() {
const { messages, input, handleInputChange, handleSubmit } = useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
}),
});

return (
<div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
<div className="space-y-4">
{messages.map(m => (
<div key={m.id} className="whitespace-pre-wrap">
<div>
<div className="font-bold">{m.role}</div>
<div>
{m.parts.map((part, index) => {
if (part.type === 'text') {
return <p key={index}>{part.text}</p>;
} else if (part.type === 'tool-call') {
return (
<span key={index} className="italic font-light">
{'calling tool: ' + part.toolName}
</span>
);
}
return null;
})}
</div>
</div>
</div>
))}
</div>
<form onSubmit={handleSubmit}>
<input
className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl"
value={input}
placeholder="Say something..."
onChange={handleInputChange}
/>
</form>
</div>
);
}
```

----------------------------------------

TITLE: Add OpenAI API Key to .env.local Configuration
DESCRIPTION: This snippet shows the format for adding your OpenAI API key to the `.env.local` file. Replace `xxxxxxxxx` with your actual key to authenticate your application with the OpenAI service.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: dotenv
CODE:
```
OPENAI_API_KEY=xxxxxxxxx
```

----------------------------------------

TITLE: API Reference for AI SDK useCompletion Hook
DESCRIPTION: This section outlines the full API signature for the `useCompletion` hook, including all available parameters for configuring text completion requests and the properties and functions returned by the hook for managing the completion state, handling user input, and controlling the API call lifecycle.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-completion

LANGUAGE: APIDOC
CODE:
```
useCompletion Hook API Reference:

Parameters:
  api: string
    The API endpoint that is called to generate text. It can be a relative path (starting with /) or an absolute URL.
  id: string
    An unique identifier for the completion. If not provided, a random one will be generated. When provided, the `useCompletion` hook with the same `id` will have shared states across components. This is useful when you have multiple components showing the same chat stream
  initialInput: string
    An optional string for the initial prompt input.
  initialCompletion: string
    An optional string for the initial completion result.
  onResponse: (response: Response) => void
    An optional callback function that is called with the response from the API endpoint. Useful for throwing customized errors or logging.
  onFinish: (prompt: string, completion: string) => void
    An optional callback function that is called when the completion stream ends.
  onError: (error: Error) => void
    An optional callback that will be called when the chat stream encounters an error.
  headers: Record<string, string> | Headers
    An optional object of headers to be passed to the API endpoint.
  body: any
    An optional, additional body object to be passed to the API endpoint.
  credentials: 'omit' | 'same-origin' | 'include'
    An optional literal that sets the mode of credentials to be used on the request. Defaults to same-origin.
  streamProtocol?: 'text' | 'data'
    An optional literal that sets the type of stream to be used. Defaults to `data`. If set to `text`, the stream will be treated as a text stream.
  fetch?: FetchFunction
    Optional. A custom fetch function to be used for the API call. Defaults to the global fetch function.
  experimental_throttle?: number
    React only. Custom throttle wait time in milliseconds for the completion and data updates. When specified, throttles how often the UI updates during streaming. Default is undefined, which disables throttling.

Returns:
  completion: string
    The current text completion.
  complete: (prompt: string, options: { headers, body }) => void
    Function to execute text completion based on the provided prompt.
  error: undefined | Error
    The error thrown during the completion process, if any.
  setCompletion: (completion: string) => void
    Function to update the `completion` state.
  stop: () => void
    Function to abort the current API request.
  input: string
    The current value of the input field.
  setInput: React.Dispatch<React.SetStateAction<string>>
    The current value of the input field.
  handleInputChange: (event: any) => void
    Handler for the `onChange` event of the input field to control the input's value.
  handleSubmit: (event?: { preventDefault?: () => void }) => void
    Form submission handler that automatically resets the input field and appends a user message.
  isLoading: boolean
    Boolean flag indicating whether a fetch operation is currently in progress.
```

----------------------------------------

TITLE: API Documentation for appendResponseMessages()
DESCRIPTION: Documents the `appendResponseMessages` function, which appends AI response messages to a UI message array, handling ID reuse, timestamp generation, and tool-call merging for unified chat history.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/append-response-messages

LANGUAGE: APIDOC
CODE:
```
appendResponseMessages():
  Description: Appends an array of ResponseMessage objects (from the AI response) to an existing array of UI messages.
  Behavior: Reuses existing IDs from response messages, generates new timestamps, and merges tool-call results with the previous assistant message (if any).
  Purpose: Useful for maintaining a unified message history when working with AI responses in a client-side chat application.
```

----------------------------------------

TITLE: Repairing Invalid or Malformed JSON
DESCRIPTION: The `repairText` function, currently experimental, allows you to attempt to fix invalid or malformed JSON generated by the model. It takes the error (either `JSONParseError` or `TypeValidationError`) and the problematic text, enabling custom logic to return a repaired version of the text.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';

const { object } = await generateObject({
  model,
  schema,
  prompt,
  experimental_repairText: async ({ text, error }) => {
    // example: add a closing brace to the text
    return text + '}';
  },
});
```

----------------------------------------

TITLE: Transform and Smooth AI SDK Text Streams with `experimental_transform`
DESCRIPTION: The `experimental_transform` option enables modification of the stream content before callbacks are invoked or promises resolved, allowing for operations like filtering, changing, or smoothing. The `smoothStream` function, provided by AI SDK Core, is a practical example of such a transformation, designed to improve the fluidity of text streaming.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: TypeScript
CODE:
```
import { smoothStream, streamText } from 'ai';

const result = streamText({
  model,
  prompt,
  experimental_transform: smoothStream(),
});
```

----------------------------------------

TITLE: Define AI State Types and Server Action for AI SDK RSC
DESCRIPTION: This snippet defines the `ServerMessage` and `ClientMessage` types for AI and UI state respectively, and outlines the `sendMessage` server action. These types are crucial for structuring the conversation history and displayable messages within the AI application.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/generative-ui-state

LANGUAGE: TypeScript
CODE:
```
// Define the AI state and UI state types
export type ServerMessage = {
  role: 'user' | 'assistant';
  content: string;
};
export type ClientMessage = {
  id: string;
  role: 'user' | 'assistant';
  display: ReactNode;
};
export const sendMessage = async (input: string): Promise<ClientMessage> => {
  "use server"
  ...
}
```

----------------------------------------

TITLE: AI SDK Response Object API Reference
DESCRIPTION: Detailed API documentation for the AI SDK response object, outlining its core properties and asynchronous return values, including nested data structures for usage, reasoning, sources, and generated files. This reference covers identifiers, model details, timestamps, message arrays, step-by-step information, and various promise-based results like content, token usage, and tool interactions.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
AI SDK Response Object:
  id: string
    description: The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
  model: string
    description: The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.
  timestamp: Date
    description: The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.
  headers?: Record<string, string>
    description: Optional response headers.
  messages: Array<ResponseMessage>
    description: The response messages that were generated during the call. It consists of an assistant message, potentially containing tool calls. When there are tool results, there is an additional tool message with the tool results that are available. If there are tools that do not have execute functions, they are not included in the tool results and need to be added separately.
  steps: Array<StepResult>
    description: Response information for every step. You can use this to get information about intermediate steps, such as the tool calls or the response headers.

  [Returns] (Promise-based properties):
    content: Promise<Array<ContentPart<TOOLS>>>
      description: The content that was generated in the last step. Resolved when the response is finished.
    finishReason: Promise<'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other' | 'unknown'>
      description: The reason why the generation finished. Resolved when the response is finished.
    usage: Promise<LanguageModelUsage>
      description: The token usage of the last step. Resolved when the response is finished.
      LanguageModelUsage:
        promptTokens: number
          description: The total number of tokens in the prompt.
        completionTokens: number
          description: The total number of tokens in the completion.
        totalTokens: number
          description: The total number of tokens generated.
    totalUsage: Promise<LanguageModelUsage>
      description: The total token usage of the generated response. When there are multiple steps, the usage is the sum of all step usages. Resolved when the response is finished.
      LanguageModelUsage:
        promptTokens: number
          description: The total number of tokens in the prompt.
        completionTokens: number
          description: The total number of tokens in the completion.
        totalTokens: number
          description: The total number of tokens generated.
    providerMetadata: Promise<ProviderMetadata | undefined>
      description: Additional provider-specific metadata from the last step. Metadata is passed through from the provider to the AI SDK and enables provider-specific results that can be fully encapsulated in the provider.
    text: Promise<string>
      description: The full text that has been generated. Resolved when the response is finished.
    reasoning: Promise<Array<ReasoningPart>>
      description: The full reasoning that the model has generated in the last step. Resolved when the response is finished.
      ReasoningPart:
        type: 'reasoning'
          description: The type of the reasoning part.
        text: string
          description: The reasoning text.
    reasoningText: Promise<string | undefined>
      description: The reasoning text that the model has generated in the last step. Can be undefined if the model has only generated text. Resolved when the response is finished.
    sources: Promise<Array<Source>>
      description: Sources that have been used as input to generate the response. For multi-step generation, the sources are accumulated from all steps. Resolved when the response is finished.
      Source:
        sourceType: 'url'
          description: A URL source. This is return by web search RAG models.
        id: string
          description: The ID of the source.
        url: string
          description: The URL of the source.
        title?: string
          description: The title of the source.
        providerMetadata?: SharedV2ProviderMetadata
          description: Additional provider metadata for the source.
    files: Promise<Array<GeneratedFile>>
      description: Files that were generated in the final step. Resolved when the response is finished.
      GeneratedFile:
        base64: string
          description: File as a base64 encoded string.
        uint8Array: Uint8Array
          description: File as a Uint8Array.
        mediaType: string
          description: The IANA media type of the file.
    toolCalls: Promise<ToolCallUnion<TOOLS>[]>
      description: The tool calls that have been executed. Resolved when the response is finished.
    toolResults: Promise<ToolResultUnion<TOOLS>[]>
      description: The tool results that have been generated. Resolved when the all tool executions are finished.
    request: Promise<LanguageModelRequestMetadata>
      description: Additional request information from the last step.
      LanguageModelRequestMetadata:
        body: string
          description: Raw request HTTP body that was sent to the provider API as a string (JSON should be stringified).
    response: Promise<LanguageModelResponseMetadata & { messages: Array<ResponseMessage>; }>
      description: Additional response information from the last step.
      LanguageModelResponseMetadata:
        id: string
          description: The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
```

----------------------------------------

TITLE: AI SDK Common LLM Settings Reference
DESCRIPTION: Reference documentation for common settings available across AI SDK functions to control Large Language Model (LLM) output.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/settings

LANGUAGE: APIDOC
CODE:
```
Common LLM Settings:
  maxOutputTokens:
    Type: number
    Description: Maximum number of tokens to generate.
  temperature:
    Type: number
    Description: Temperature setting for randomness. The value is passed through to the provider. The range depends on the provider and model. For most providers, 0 means almost deterministic results, and higher values mean more randomness. It is recommended to set either temperature or topP, but not both.
```

----------------------------------------

TITLE: AI SDK Tool Object Structure
DESCRIPTION: Defines the essential properties of a tool object in the AI SDK, which enables models to perform specific tasks. Each tool can have a description, a schema for its parameters, and an optional execution function.
SOURCE: https://v5.ai-sdk.dev/foundations/tools

LANGUAGE: APIDOC
CODE:
```
Tool:
  description: An optional description of the tool that can influence when the tool is picked.
  parameters: A Zod schema or a JSON schema that defines the parameters. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
  execute: An optional async function that is called with the arguments from the tool call.
```

----------------------------------------

TITLE: createStreamableValue API Definition
DESCRIPTION: Defines the createStreamableValue function, which creates a special streamable value that can be returned from Actions to the client. This value holds data internally and can be updated via its update method.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/create-streamable-value

LANGUAGE: APIDOC
CODE:
```
createStreamableValue(value: any): streamable

Parameters:
  value: any
    Description: Any data that RSC supports. Example, JSON.

Returns:
  streamable
    Description: This creates a special value that can be returned from Actions to the client. It holds the data inside and can be updated via the update method.
```

----------------------------------------

TITLE: Generate Text with a Simple Prompt
DESCRIPTION: This snippet demonstrates how to use a basic text prompt with the `generateText` function in the AI SDK. It sets a static string as the prompt to guide the model's output, ideal for straightforward content generation tasks.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
prompt: 'Invent a new holiday and describe its traditions.',
});
```

----------------------------------------

TITLE: Logging streamText errors with onError callback
DESCRIPTION: This code snippet demonstrates how to integrate an `onError` callback into the `streamText` function. This callback is triggered when an error occurs during streaming, allowing you to implement custom error logging logic, such as `console.error(error)`, to capture and handle errors that would otherwise fail silently within the stream.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/stream-text-not-working

LANGUAGE: TypeScript
CODE:
```
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onError({ error }) {
    console.error(error); // your error logging logic here
  },
});
```

----------------------------------------

TITLE: Add Dynamic Message Metadata to Streamed Responses (AI SDK 5)
DESCRIPTION: This example shows how to dynamically attach metadata to streamed messages using the `messageMetadata` property within `toUIMessageStreamResponse()`. It demonstrates adding different metadata based on the stream part type ('start', 'finish-step', 'finish'), allowing for real-time updates of information like model ID, duration, and total tokens as the message streams to the client.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { ExampleMetadata } from './example-metadata-schema';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const startTime = Date.now();

  const result = streamText({
    model: openai('gpt-4o'),
    prompt: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }): ExampleMetadata | undefined => {
      // send custom information to the client on start:
      if (part.type === 'start') {
        return {
          model: 'gpt-4o' // initial model id
        };
      }

      // send additional model information on finish-step:
      if (part.type === 'finish-step') {
        return {
          model: part.response.modelId, // update with the actual model id
          duration: Date.now() - startTime
        };
      }

      // when the message is finished, send additional information:
      if (part.type === 'finish') {
        return {
          totalTokens: part.totalUsage.totalTokens
        };
      }
    }
  });
}
```

----------------------------------------

TITLE: AI SDK: Dynamic Text Prompts with Template Literals
DESCRIPTION: Illustrates how to create dynamic text prompts using JavaScript template literals. This allows injecting variables like `destination` and `lengthOfStay` into the prompt string, enabling personalized or context-aware content generation.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
prompt:
`I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
`Please suggest the best tourist activities for me to do.`,
});
```

----------------------------------------

TITLE: AI SDK Core API: streamText and StreamTextResult
DESCRIPTION: Documentation for the `streamText` function and its `StreamTextResult` return object from the `ai` package. `streamText` initiates a streaming text generation from a language model, configured with a model and conversation messages. The `StreamTextResult` object provides methods to convert the streamed output into various response formats suitable for client consumption.
SOURCE: https://v5.ai-sdk.dev/getting-started/expo

LANGUAGE: APIDOC
CODE:
```
streamText(config: object): StreamTextResult
  Purpose: Initiates streaming text generation from a language model.
  Parameters:
    config: object - Configuration for the streaming process.
      model: ModelProvider - The language model to use (e.g., openai('gpt-4o')).
      messages: UIMessage[] - An array of conversation messages, converted to model messages.
      settings: object (optional) - Additional settings to customize model behavior.

StreamTextResult:
  Purpose: Represents the result of a streaming text operation.
  Methods:
    toUIMessageStreamResponse(options: object): Response
      Purpose: Converts the streamed result into a UI message stream response.
      Parameters:
        options: object - Configuration for the response.
          headers: object - HTTP headers to include in the response (e.g., 'Content-Type', 'Content-Encoding').
```

----------------------------------------

TITLE: API: streamText() function
DESCRIPTION: Streams text and allows calling tools from a language model.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core

LANGUAGE: APIDOC
CODE:
```
streamText(): Stream text and call tools from a language model.
```

----------------------------------------

TITLE: APIDOC: createAI Function
DESCRIPTION: Creates a client-server context provider to wrap application parts, facilitating easy management of both UI and AI states.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/overview

LANGUAGE: APIDOC
CODE:
```
createAI(): Creates a client-server context provider that can be used to wrap parts of your application tree to easily manage both UI and AI states of your application.
```

----------------------------------------

TITLE: Render Partial Tool Call Streaming on Client
DESCRIPTION: This snippet illustrates how to render different states of tool invocations, including `partial-call`, `call`, and `result`, on the client-side when `toolCallStreaming` is enabled. It shows how to use the `state` property of `toolInvocation` to update the UI dynamically.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: tsx
CODE:
```
export default function Chat() {

// ...

return (

<>

{messages?.map(message => (

<div key={message.id}>

{message.parts.map(part => {

if (part.type === 'tool-invocation') {

switch (part.toolInvocation.state) {

case 'partial-call':

return <>render partial tool call</>;

case 'call':

return <>render full tool call</>;

case 'result':

return <>render tool result</>;

}

}

})}

</div>

))}

</>

);

}
```

----------------------------------------

TITLE: Implementing Agents for Math Problem Solving with AI SDK
DESCRIPTION: Illustrates how to create an AI agent using the AI SDK's `maxSteps` parameter, enabling the model to perform multi-step reasoning and utilize tools like a calculator to solve complex problems.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: typescript
CODE:
```
import { generateText, tool } from 'ai';

import { deepinfra } from '@ai-sdk/deepinfra';

import * as mathjs from 'mathjs';

import { z } from 'zod';

const problem =
'Calculate the profit for a day if revenue is $5000 and expenses are $3500.';

const { text: answer } = await generateText({
model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),
system:
'You are solving math problems. Reason step by step. Use the calculator when necessary.',
prompt: problem,
tools: {
calculate: tool({
description: 'A tool for evaluating mathematical expressions.',
parameters: z.object({ expression: z.string() }),
execute: async ({ expression }) => mathjs.evaluate(expression),
}),
},
maxSteps: 5,
});
```

----------------------------------------

TITLE: Configure Common LLM Settings with AI SDK
DESCRIPTION: This snippet demonstrates how to apply common settings like `maxOutputTokens`, `temperature`, and `maxRetries` when using the `generateText` function in AI SDK. These settings influence the LLM's output, and warnings are generated if a setting is not supported by the chosen provider.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/settings

LANGUAGE: javascript
CODE:
```
const result = await generateText({
  model: yourModel,
  maxOutputTokens: 512,
  temperature: 0.3,
  maxRetries: 5,
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

----------------------------------------

TITLE: AI SDK `useChat` Hook Status Property API
DESCRIPTION: This section documents the `status` property returned by the `useChat` hook, detailing its possible values (`submitted`, `streaming`, `ready`, `error`) and their meanings. It also provides examples of how to use the status for UI feedback like loading indicators or disabling controls.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: APIDOC
CODE:
```
useChat Hook Status Property:
  status: string
    Description: Reflects the current state of the chat interaction.
    Possible Values:
      - "submitted": Message has been sent to the API, awaiting response stream start.
      - "streaming": Response is actively streaming from the API, receiving data chunks.
      - "ready": Full response received and processed; new user message can be submitted.
      - "error": An error occurred during the API request, preventing successful completion.
```

----------------------------------------

TITLE: usage Property
DESCRIPTION: Provides information about the token usage of the generated text, encapsulated within a LanguageModelUsage object.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
usage: LanguageModelUsage
```

----------------------------------------

TITLE: Query OpenAI Model with AI SDK Core in Route Handler
DESCRIPTION: This refactored example shows how to query an OpenAI model using the unified AI SDK Core API alongside the `@ai-sdk/openai` provider. It utilizes the `streamText` function and returns the response using `toUIMessageStreamResponse()` for simplified streaming UI building.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-3-1

LANGUAGE: javascript
CODE:
```
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
const { messages } = await req.json();
const result = await streamText({
model: openai('gpt-4.1'),
messages,
});

return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: LLM Query with RAG Context
DESCRIPTION: This snippet demonstrates how Retrieval Augmented Generation (RAG) enhances an LLM's response. By providing relevant context alongside the user's prompt, the model can accurately answer questions outside its original training data.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: Text
CODE:
```
input

Respond to the user's prompt using only the provided context.

user prompt: 'What is my favorite food?'

context: user loves chicken nuggets

generation

Your favorite food is chicken nuggets!
```

----------------------------------------

TITLE: Send Image URL Content to AI Model (AI SDK)
DESCRIPTION: Demonstrates sending an image to an AI model by providing its public URL. The model will fetch the image directly from the specified URL.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
messages: [
{
role: 'user',
content: [
{ type: 'text', text: 'Describe the image in detail.' },
{
type: 'image',
image:
'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',
},
],
},
],
});
```

----------------------------------------

TITLE: Cancel AI SDK Core Stream with AbortSignal (Server-side)
DESCRIPTION: The AI SDK Core allows server-side stream cancellation by forwarding an `abortSignal`. This example demonstrates how to pass `req.signal` from a Next.js API route to the `streamText` function, effectively stopping the stream from the server to the LLM API.
SOURCE: https://v5.ai-sdk.dev/advanced/stopping-streams

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
const { prompt } = await req.json();
const result = streamText({
model: openai('gpt-4.1'),
prompt,
// forward the abort signal:
abortSignal: req.signal,
});
return result.toTextStreamResponse();
}
```

----------------------------------------

TITLE: AI SDK Core API: streamText Function Reference
DESCRIPTION: Documentation for the `streamText` function from the `ai` package. It's used to generate and stream text responses from large language models, accepting a configuration object with model and message history.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: APIDOC
CODE:
```
streamText(config: object): StreamTextResult
  config:
    model: LLMProvider (e.g., openai('gpt-4o'))
    messages: UIMessage[] (converted to ModelMessages)
    settings?: object (optional, for model customization)
```

----------------------------------------

TITLE: Install AI SDK and OpenAI Provider Dependencies
DESCRIPTION: Install the core AI SDK, its OpenAI provider, and other necessary packages using pnpm. The AI SDK offers a unified interface for various large language models, allowing easy provider changes.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: pnpm
CODE:
```
pnpm add ai@alpha @ai-sdk/openai@alpha @ai-sdk/vue@alpha zod
```

----------------------------------------

TITLE: Create .env.local File for Environment Variables
DESCRIPTION: Create an empty `.env.local` file in the project's root directory. This file is used by Next.js to load local environment variables, typically for sensitive information like API keys.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: shell
CODE:
```
touch .env.local
```

----------------------------------------

TITLE: Define and Use Tool for Weather Data with AI SDK
DESCRIPTION: This snippet demonstrates how to define and use a tool (`getWeather`) with the AI SDK's `generateText` function. It shows how to specify tool parameters using Zod and implement the tool's execution logic to interact with external systems (simulated weather data).
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: TypeScript
CODE:
```
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { text } = await generateText({
  model: openai('o3-mini'),
  prompt: 'What is the weather like today in San Francisco?',
  tools: {
    getWeather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for')
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10
      })
    })
  }
});
```

----------------------------------------

TITLE: APIDOC: useUIState Hook
DESCRIPTION: Returns the current UI state and a function to update it, similar to React's `useState`, representing the visual state of the AI application.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/overview

LANGUAGE: APIDOC
CODE:
```
useUIState(): [currentState, updateFunction] - Returns the current UI state and a function to update the UI State (like React's `useState`). UI State is the visual representation of the AI state.
```

----------------------------------------

TITLE: Throttle useCompletion updates in React AI SDK
DESCRIPTION: Example demonstrating how to apply `experimental_throttle` to the `useCompletion` hook. This option limits the frequency of UI updates for completion and data, preventing the 'Maximum update depth exceeded' error by re-rendering only every 50 milliseconds.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/react-maximum-update-depth-exceeded

LANGUAGE: tsx
CODE:
```
const { completion, ... } = useCompletion({
// Throttle the completion and data updates to 50ms:
experimental_throttle: 50
})
```

----------------------------------------

TITLE: Define Zod Schema for Chart Configuration
DESCRIPTION: This TypeScript code defines a Zod schema (`configSchema`) for chart configurations. It specifies properties like chart type, axis keys, colors, and descriptive fields, providing strong typing and validation for AI-generated outputs. The `.describe()` function is used extensively to give the AI model additional context for each field.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...rest of the file... */

export const configSchema = z
.object({
description: z
.string()
.describe(
'Describe the chart. What is it showing? What is interesting about the way the data is displayed?',
),
takeaway: z.string().describe('What is the main takeaway from the chart?'),
type: z.enum(['bar', 'line', 'area', 'pie']).describe('Type of chart'),
title: z.string(),
xKey: z.string().describe('Key for x-axis or category'),
yKeys: z
.array(z.string())
.describe(
'Key(s) for y-axis values this is typically the quantitative column',
),
multipleLines: z
.boolean()
.describe(
'For line charts only: whether the chart is comparing groups of data.',
)
.optional(),
measurementColumn: z
.string()
.describe(
'For line charts only: key for quantitative y-axis column to measure against (eg. values, counts etc.)',
)
.optional(),
lineCategories: z
.array(z.string())
.describe(
'For line charts only: Categories used to compare different lines or data series. Each category represents a distinct line in the chart.',
)
.optional(),
colors: z
.record(
z.string().describe('Any of the yKeys'),
z.string().describe('Color value in CSS format (e.g., hex, rgb, hsl)'),
)
.describe('Mapping of data keys to color values for chart elements')
.optional(),
legend: z.boolean().describe('Whether to show legend'),
})
.describe('Chart configuration object');

export type Config = z.infer<typeof configSchema>;
```

----------------------------------------

TITLE: Send Binary Image (Buffer) in AI SDK User Message
DESCRIPTION: Illustrates sending a binary image (read from a file as a Buffer) as part of a user message. The `type` is 'image' and the `image` property holds the binary data.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
  model,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png'),
        },
      ],
    },
  ],
});
```

----------------------------------------

TITLE: APIDOC: createStreamableUI Function
DESCRIPTION: Creates a stream to send UI components from the server to the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/overview

LANGUAGE: APIDOC
CODE:
```
createStreamableUI(): Creates a stream that sends UI from the server to the client.
```

----------------------------------------

TITLE: Ensuring Stream Completion on Client Disconnects with consumeStream
DESCRIPTION: This snippet demonstrates how to use `result.consumeStream()` with `streamText` to ensure that the language model stream completes and `onFinish` is triggered, even if the client disconnects. This is crucial for persisting conversation state reliably on the backend, preventing data loss or broken conversations.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
import { convertToModelMessages, streamText, UIMessage } from 'ai';

import { saveChat } from '@tools/chat-store';

export async function POST(req: Request) {
const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
await req.json();

const result = streamText({
model,
messages: convertToModelMessages(messages)
});

// consume the stream to ensure it runs to completion & triggers onFinish
// even when the client response is aborted:
result.consumeStream(); // no await

return result.toUIMessageStreamResponse({
originalMessages: messages,
onFinish: ({ messages }) => {
saveChat({ chatId, messages });
}
});
}
```

----------------------------------------

TITLE: Test generateText with Mock Language Model
DESCRIPTION: This snippet demonstrates how to unit test the `generateText` function from the AI SDK using `MockLanguageModelV2`. It simulates a text generation response, including finish reason and token usage, for testing purposes.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/testing

LANGUAGE: typescript
CODE:
```
import { generateText } from 'ai';

import { MockLanguageModelV2 } from 'ai/test';

const result = await generateText({
  model: new MockLanguageModelV2({
    doGenerate: async () => ({
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20 },
      text: `Hello, world!`,
    }),
  }),
  prompt: 'Hello, test!',
});
```

----------------------------------------

TITLE: Persist Chat History Across Requests with AI SDK
DESCRIPTION: This example illustrates how to maintain chat history across multiple `generateText` calls using the AI SDK's persistence feature. By passing the `previousResponseId` from a prior response, OpenAI can access the full conversation context, allowing for more coherent follow-up interactions.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result1 = await generateText({
model: openai.responses('gpt-4o-mini'),
prompt: 'Invent a new holiday and describe its traditions.',
});

const result2 = await generateText({
model: openai.responses('gpt-4o-mini'),
prompt: 'Summarize in 2 sentences',
providerOptions: {
openai: {
previousResponseId: result1.providerMetadata?.openai.responseId as string,
},
},
});
```

----------------------------------------

TITLE: Enable Tool Call Streaming in Server-side API
DESCRIPTION: This snippet shows how to enable `toolCallStreaming` in the `streamText` function on the server-side (Next.js API route). This allows partial tool calls to be streamed to the client, enabling real-time UI updates during tool generation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: ts
CODE:
```
export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

toolCallStreaming: true,

// ...

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Client Component for AI Conversation Interaction
DESCRIPTION: This client-side component manages user input and displays the conversation history. It uses `useUIState` to access and update the UI state and `useActions` to call the `submitUserMessage` server action, rendering the AI's responses dynamically.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useState } from 'react';
import { AI } from './ai';
import { useActions, useUIState } from '@ai-sdk/rsc';

export default function Page() {
const [input, setInput] = useState<string>('');
const [conversation, setConversation] = useUIState<typeof AI>();
const { submitUserMessage } = useActions();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();
setInput('');
setConversation(currentConversation => [
...currentConversation,
<div>{input}</div>,
]);

const message = await submitUserMessage(input);
setConversation(currentConversation => [...currentConversation, message]);
};

return (
<div>
<div>
{conversation.map((message, i) => (
<div key={i}>{message}</div>
))}
</div>
<div>
<form onSubmit={handleSubmit}>
<input
type="text"
value={input}
onChange={e => setInput(e.target.value)}
/>
<button>Send Message</button>
</form>
</div>
</div>
);
}
```

----------------------------------------

TITLE: AI SDK `tool()` API Signature
DESCRIPTION: Detailed API documentation for the `tool` function, including its parameters (`description`, `parameters`, `execute`) and their types, purpose, and usage. It also defines related types like `ToolExecutionOptions`, `TextToolResultContent`, and `ImageToolResultContent`, which are used within the tool's execution context.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/tool

LANGUAGE: APIDOC
CODE:
```
tool:
  description: The tool definition.
  parameters:
    description?: string
      Information about the purpose of the tool including details on how and when it can be used by the model.
    parameters: Zod Schema | JSON Schema
      The schema of the input that the tool expects. The language model will use this to generate the input. It is also used to validate the output of the language model. Use descriptions to make the input understandable for the language model. You can either pass in a Zod schema or a JSON schema (using the `jsonSchema` function).
    execute?: async (parameters: T, options: ToolExecutionOptions) => RESULT
      An async function that is called with the arguments from the tool call and produces a result. If not provided, the tool will not be executed automatically.
  returns: The tool that was passed in.

ToolExecutionOptions:
  toolCallId: string
    The ID of the tool call. You can use it e.g. when sending tool-call related information with stream data.
  messages: ModelMessage[]
    Messages that were sent to the language model to initiate the response that contained the tool call. The messages do not include the system prompt nor the assistant response that contained the tool call.
  abortSignal: AbortSignal
    An optional abort signal that indicates that the overall operation should be aborted.
  experimental_toToolResultContent?: (result: RESULT) => TextToolResultContent | ImageToolResultContent
    An optional function that converts the result of the tool call to a content object that can be used in LLM messages.

TextToolResultContent:
  type: 'text'
    The type of the tool result content.
  text: string
    The content of the message.

ImageToolResultContent:
  type: 'image'
    The type of the tool result content.
  data: string
    The base64 encoded png image.
  mediaType?: string
    The IANA media type of the image.
```

----------------------------------------

TITLE: Synchronizing AI SDK Instances in Svelte using createAIContext
DESCRIPTION: Unlike React's automatic hook synchronization, Svelte requires explicit context creation for AI SDK instances with the same `id` to share state (e.g., `messages`, `status`). This can be achieved by calling `createAIContext()` in a root layout file, ensuring all child components or subsequent hooks benefit from synchronized state.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: Svelte
CODE:
```
<script>

import { createAIContext } from '@ai-sdk/svelte';

let { children } = $props();

createAIContext();

// all hooks created after this or in components that are children of this component

// will have synchronized state

</script>

{@render children()}
```

----------------------------------------

TITLE: AI SDK: Stream and Display Reasoning Tokens
DESCRIPTION: This snippet demonstrates how to enable and display reasoning tokens from models like DeepSeek. The server-side code streams reasoning tokens using `sendReasoning: true`, while the client-side code accesses and renders these 'reasoning' parts, showing details or redacting them.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: TypeScript
CODE:
```
import { deepseek } from '@ai-sdk/deepseek';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: deepseek('deepseek-reasoner'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
```

LANGUAGE: JSX
CODE:
```
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts.map((part, index) => {
      // text parts:
      if (part.type === 'text') {
        return <div key={index}>{part.text}</div>;
      }

      // reasoning parts:
      if (part.type === 'reasoning') {
        return (
          <pre key={index}>
            {part.details.map(detail =>
              detail.type === 'text' ? detail.text : '<redacted>',
            )}
          </pre>
        );
      }
    })}
  </div>
));
```

----------------------------------------

TITLE: Example Server Action for Text Generation in Client Components
DESCRIPTION: This TypeScript code demonstrates a server action (`getAnswer`) that uses the `@ai-sdk/openai` library to generate text based on a user question. It's designed to be exported from a separate file with `'use server'` at the top, making it callable from client components.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/common-issues/server-actions-in-client-components

LANGUAGE: TypeScript
CODE:
```
'use server';

import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';

export async function getAnswer(question: string) {

'use server';

const { text } = await generateText({

model: openai.chat('gpt-3.5-turbo'),

prompt: question,

});

return { answer: text };

}
```

----------------------------------------

TITLE: Reading Streamable Values on the Client with AI SDK RSC
DESCRIPTION: This client-side React component demonstrates how to read a streamable value using `readStreamableValue` from `@ai-sdk/rsc`. When the button is clicked, it calls a server action that returns a streamable status, and then asynchronously iterates over the incoming values, logging each update to the console.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-values

LANGUAGE: JavaScript
CODE:
```
import { readStreamableValue } from '@ai-sdk/rsc';
import { runThread } from '@/actions';

export default function Page() {
  return (
    <button
      onClick={async () => {
        const { status } = await runThread();
        for await (const value of readStreamableValue(status)) {
          console.log(value);
        }
      }}
    >
      Ask
    </button>
  );
}
```

----------------------------------------

TITLE: Server: Streaming React Components with `streamUI`
DESCRIPTION: This server action leverages `streamUI` from `@ai-sdk/rsc` to stream React components directly to the client. It yields a 'loading...' component while the AI model processes the prompt, then returns the final content as a React component, simplifying client-side loading management. Requires the file to be `.tsx`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/loading-state

LANGUAGE: tsx
CODE:
```
'use server';

import { openai } from '@ai-sdk/openai';

import { streamUI } from '@ai-sdk/rsc';

export async function generateResponse(prompt: string) {

const result = await streamUI({

model: openai('gpt-4o'),

prompt,

text: async function* ({ content }) {

yield <div>loading...</div>;

return <div>{content}</div>;

},

});

return result.value;

}
```

----------------------------------------

TITLE: API Reference for createStreamableUI
DESCRIPTION: This section details the `createStreamableUI` function, including its parameters, the structure of the object it returns, and the methods available for managing the streamable UI.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/create-streamable-ui

LANGUAGE: APIDOC
CODE:
```
createStreamableUI:
  Parameters:
    initialValue?: ReactNode
      Description: The initial value of the streamable UI.
  Returns:
    value: ReactNode
      Description: The value of the streamable UI. This can be returned from a Server Action and received by the client.
  Methods:
    update(ReactNode): void
      Description: Updates the current UI node. It takes a new UI node and replaces the old one.
    append(ReactNode): void
      Description: Appends a new UI node to the end of the old one. Once appended a new UI node, the previous UI node cannot be updated anymore.
    done(ReactNode | null): void
      Description: Marks the UI node as finalized and closes the stream. Once called, the UI node cannot be updated or appended anymore. This method is always required to be called, otherwise the response will be stuck in a loading state.
    error(Error): void
      Description: Signals that there is an error in the UI stream. It will be thrown on the client side and caught by the nearest error boundary component.
```

----------------------------------------

TITLE: Replace Last Message on Error in AI SDK React Chat
DESCRIPTION: Demonstrates how to implement a custom submit handler for the `useChat` hook to automatically remove the last user message from the chat state if an error occurs after submission. This provides a clean way to retry or correct input.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/error-handling

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';
import { defaultChatStoreOptions } from 'ai';

export default function Chat() {
const {
handleInputChange,
handleSubmit,
error,
input,
messages,
setMessages,
} = useChat({
chatStore: defaultChatStoreOptions({
api: '/api/chat',
}),
});

function customSubmit(event: React.FormEvent<HTMLFormElement>) {
if (error != null) {
setMessages(messages.slice(0, -1)); // remove last message
}
handleSubmit(event);
}

return (
<div>
{messages.map(m => (
<div key={m.id}>
{m.role}:{' '}
{m.parts
.filter(part => part.type === 'text')
.map(part => part.text)
.join('')}
</div>
))}
{error && <div>An error occurred.</div>}
<form onSubmit={customSubmit}>
<input value={input} onChange={handleInputChange} />
</form>
</div>
);
}
```

----------------------------------------

TITLE: Abort AI SDK Speech Generation with Timeout
DESCRIPTION: This snippet demonstrates how to use an `AbortSignal` to set a timeout for the `generateSpeech` process. The speech generation will automatically abort if it exceeds the specified duration, preventing long-running or stuck operations.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/speech

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { experimental_generateSpeech as generateSpeech } from 'ai';

import { readFile } from 'fs/promises';

const audio = await generateSpeech({
model: openai.speech('tts-1'),
text: 'Hello, world!',
abortSignal: AbortSignal.timeout(1000), // Abort after 1 second
});
```

----------------------------------------

TITLE: AI SDK: Assistant Message with Tool Call
DESCRIPTION: Demonstrates how to construct an assistant message that includes a tool call. This snippet shows the structure for invoking a tool like 'get-nutrition-data' with specific arguments within the `generateText` function.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: javascript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    { role: 'user', content: 'How many calories are in this block of cheese?' },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          args: { cheese: 'Roquefort' },
        },
      ],
    },
  ],
});
```

----------------------------------------

TITLE: Client-side Tool Result Handling with `useChat` `onToolCall`
DESCRIPTION: Illustrates how to provide tool results client-side using the `onToolCall` callback within `useChat`. This callback is invoked when a tool is called by the model, allowing you to execute logic and return the result.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/tool-invocation-missing-result

LANGUAGE: TypeScript
CODE:
```
const { messages } = useChat({
  // Option 1: Handle using onToolCall
  onToolCall: async ({ toolCall }) => {
    if (toolCall.toolName === 'getLocation') {
      const result = await getLocationData();
      return result; // This becomes the tool result
    }
  },
});
}
```

----------------------------------------

TITLE: Configure useChat Hook with Custom HTTP Options (Headers, Body, Credentials)
DESCRIPTION: This snippet demonstrates how to customize the HTTP POST request made by the `useChat` hook. It shows how to set a custom API endpoint, add authorization headers, include additional fields in the request body, and specify credentials for the fetch request.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: TypeScript
CODE:
```
const { messages, input, handleInputChange, handleSubmit } = useChat({
api: '/api/custom-chat',
headers: {
Authorization: 'your_token',
},
body: {
user_id: '123',
},
credentials: 'same-origin',
});
```

----------------------------------------

TITLE: Initialize Node.js Project with pnpm
DESCRIPTION: This snippet demonstrates how to create a new directory for your AI application, navigate into it, and initialize a new Node.js project using pnpm, which generates a package.json file.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: Shell
CODE:
```
mkdir my-ai-app
cd my-ai-app
pnpm init
```

----------------------------------------

TITLE: Create Next.js Application
DESCRIPTION: Command to initialize a new Next.js project named `multi-modal-chatbot` using `pnpm`.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: bash
CODE:
```
pnpm create next-app@latest multi-modal-chatbot
```

----------------------------------------

TITLE: Route Handler for Streaming Tool Data with AI SDK `streamText`
DESCRIPTION: This snippet shows how to replace server actions with a Next.js route handler using `streamText` to stream tool invocation data. The `displayWeather` tool executes a query and returns props, which are then streamed to the client via `toUIMessageStreamResponse()` for client-side rendering by `useChat`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: typescript
CODE:
```
import { z } from 'zod';

import { openai } from '@ai-sdk/openai';

import { getWeather } from '@/utils/queries';

import { streamText } from 'ai';

export async function POST(request) {

const { messages } = await request.json();

const result = streamText({

model: openai('gpt-4o'),

system: 'you are a friendly assistant!',

messages,

tools: {

displayWeather: {

description: 'Display the weather for a location',

parameters: z.object({

latitude: z.number(),

longitude: z.number()

}),

execute: async function ({ latitude, longitude }) {

const props = await getWeather({ latitude, longitude });

return props;

}

}

}

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Dynamically Control Agent Steps with prepareStep (JavaScript)
DESCRIPTION: Demonstrates the use of experimental_prepareStep within generateText to gain fine-grained control over multi-step agents. It shows how to dynamically change models, force tool choices, or limit available tools based on the step number.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
// ...
experimental_prepareStep: async ({ model, stepNumber, maxSteps, steps }) => {
if (stepNumber === 0) {
return {
// use a different model for this step:
model: modelForThisParticularStep,
// force a tool choice for this step:
toolChoice: { type: 'tool', toolName: 'tool1' },
// limit the tools that are available for this step:
experimental_activeTools: ['tool1'],
};
}
// when nothing is returned, the default settings are used
},
});
```

----------------------------------------

TITLE: Enable Function Calls with Gemma Models using AI SDK Tool Parser
DESCRIPTION: This snippet demonstrates how to use the `gemmaToolMiddleware` from `@ai-sdk-tool/parser` to enable function calling for Gemma models that do not natively support OpenAI-style `tools` parameters. It wraps an existing language model with the middleware to provide consistent function calling capabilities.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import { wrapLanguageModel } from 'ai';

import { gemmaToolMiddleware } from '@ai-sdk-tool/parser';

const model = wrapLanguageModel({

model: openrouter('google/gemma-3-27b-it'),

middleware: gemmaToolMiddleware,

});
```

----------------------------------------

TITLE: Client: Manual Loading State for Streamed Text
DESCRIPTION: This React client component demonstrates how to manage a loading state and display streamed text responses from a server action. It uses `readStreamableValue` to process both the AI response and a separate loading state, updating the UI dynamically and disabling input during generation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/loading-state

LANGUAGE: tsx
CODE:
```
'use client';

import { useState } from 'react';

import { generateResponse } from './actions';

import { readStreamableValue } from '@ai-sdk/rsc';

// Force the page to be dynamic and allow streaming responses up to 30 seconds

export const maxDuration = 30;

export default function Home() {

const [input, setInput] = useState<string>('');

const [generation, setGeneration] = useState<string>('');

const [loading, setLoading] = useState<boolean>(false);

return (

<div>

<div>{generation}</div>

<form

onSubmit={async e => {

e.preventDefault();

setLoading(true);

const { response, loadingState } = await generateResponse(input);

let textContent = '';

for await (const responseDelta of readStreamableValue(response)) {

textContent = `${textContent}${responseDelta}`;

setGeneration(textContent);

}

for await (const loadingDelta of readStreamableValue(loadingState)) {

if (loadingDelta) {

setLoading(loadingDelta.loading);

}

}

setInput('');

setLoading(false);

}}

>

<input

type="text"

value={input}

disabled={loading}

className="disabled:opacity-50"

onChange={event => {

setInput(event.target.value);

}}

/>

<button>Send Message</button>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Embed Multiple Values using AI SDK embedMany
DESCRIPTION: Demonstrates how to use the `embedMany` function from the AI SDK to generate embeddings for a list of string values. It utilizes an OpenAI embedding model and shows the asynchronous call to retrieve the embeddings.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/embed-many

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'sunny day at the beach',
    'rainy afternoon in the city',
    'snowy night in the mountains',
  ],
});
```

----------------------------------------

TITLE: Client-side Rendering of Streamable UI from Server Action
DESCRIPTION: This React component demonstrates how to call a server action (`getWeather`) and display the streamable UI it returns. It uses `useState` to manage the UI content, which updates asynchronously. Users will see a loading message first, followed by the actual weather information.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-values

LANGUAGE: tsx
CODE:
```
'use client';

import { useState } from 'react';

import { readStreamableValue } from '@ai-sdk/rsc';

import { getWeather } from '@/actions';

export default function Page() {

const [weather, setWeather] = useState<React.ReactNode | null>(null);

return (

<div>

<button

onClick={async () => {

const weatherUI = await getWeather();

setWeather(weatherUI);

}}

>

What&apos;s the weather?

</button>

{weather}

</div>

);

}
```

----------------------------------------

TITLE: TypeScript Function to Generate Embeddings with AI SDK
DESCRIPTION: Defines an asynchronous `generateEmbeddings` function using AI SDK and OpenAI's `text-embedding-ada-002` model. It first chunks the input text, then uses the `embedMany` function to obtain vector embeddings, and finally returns them mapped with their original content, ready for database storage.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-ada-002');

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split('.')
    .filter(i => i !== '');
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
```

----------------------------------------

TITLE: Custom Error Handling with createUIMessageResponse in AI SDK
DESCRIPTION: This example shows how to directly provide an 'onError' callback within the 'createUIMessageResponse' function. This allows for inline, custom error message generation, providing flexibility in how errors are presented to the user based on the specific error object.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-tool-usage

LANGUAGE: TypeScript
CODE:
```
const response = createUIMessageResponse({

// ...

async execute(dataStream) {

// ...

},

onError: error => `Custom error: ${error.message}`,

});
```

----------------------------------------

TITLE: Embed Multiple Values with AI SDK
DESCRIPTION: The `embedMany` function allows for batch embedding of multiple values, which is particularly useful when preparing data stores for retrieval-augmented generation (RAG). It works with various embedding models like OpenAI's 'text-embedding-3-large' or Mistral's 'mistral-embed'. The resulting 'embeddings' array is ordered identically to the input 'values'.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/embeddings

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

// 'embeddings' is an array of embedding objects (number[][]).
// It is sorted in the same order as the input values.
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'sunny day at the beach',
    'rainy afternoon in the city',
    'snowy night in the mountains'
  ]
});
```

----------------------------------------

TITLE: Display AI Tool Calls and Results
DESCRIPTION: This TypeScript code snippet extends the previous example by demonstrating how to access and display the raw tool calls and their results generated by the AI model. When the model determines it needs to use a tool, it generates a tool call instead of a text response. This code logs the 'toolCalls' and 'toolResults' from the 'result' object, making the internal workings of the tool invocation visible in the console.
SOURCE: https://v5.ai-sdk.dev/getting-started/nodejs

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { ModelMessage, streamText, tool } from 'ai';
import dotenv from 'dotenv';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

dotenv.config();

const terminal = readline.createInterface({
input: process.stdin,
output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
while (true) {
const userInput = await terminal.question('You: ');
messages.push({ role: 'user', content: userInput });

const result = streamText({
model: openai('gpt-4o'),
messages,
tools: {
weather: tool({
description: 'Get the weather in a location (in Celsius)',
parameters: z.object({
location: z
.string()
.describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: Math.round((Math.random() * 30 + 5) * 10) / 10 // Random temp between 5°C and 35°C
}),
}),
},
});

let fullResponse = '';
process.stdout.write('\nAssistant: ');
for await (const delta of result.textStream) {
fullResponse += delta;
process.stdout.write(delta);
}
process.stdout.write('\n\n');
console.log(await result.toolCalls);
console.log(await result.toolResults);
messages.push({ role: 'assistant', content: fullResponse });
}
}

main().catch(console.error);
```

----------------------------------------

TITLE: Streaming Granular Loading State from Server with AI SDK RSC
DESCRIPTION: This server-side implementation (`app/actions.ts`) enhances loading feedback by creating a separate `streamableValue` specifically for the loading status. This allows the server to explicitly signal when processing begins and ends, providing more detailed and real-time loading information to the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/loading-state

LANGUAGE: TypeScript
CODE:
```
'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from '@ai-sdk/rsc';

export async function generateResponse(prompt: string) {
  const stream = createStreamableValue();
  const loadingState = createStreamableValue({ loading: true });

  (async () => {
    const { textStream } = streamText({
      model: openai('gpt-4o'),
      prompt,
    });

    for await (const text of textStream) {
      stream.update(text);
    }

    stream.done();
    loadingState.done({ loading: false });
  })();

  return { response: stream.value, loadingState: loadingState.value };
}
```

----------------------------------------

TITLE: Create Next.js API Route for AI Chat with DeepInfra and AI SDK
DESCRIPTION: This server-side API route handles incoming chat messages, converts them to a model-compatible format, and streams text responses from a DeepInfra Llama 3.1 model back to the UI. It sets a maximum duration for streaming responses to 30 seconds.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
import { deepinfra } from '@ai-sdk/deepinfra';
import { convertToModelMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
const { messages } = await req.json();
const result = streamText({
model: deepinfra('meta-llama/Meta-Llama-3.1-70B-Instruct'),
messages: convertToModelMessages(messages),
});
return result.toUIMessageStreamResponse();
}
```

----------------------------------------

TITLE: Integrate Stock Component into Generative UI Chat Page
DESCRIPTION: This snippet updates the main `page.tsx` file to dynamically render the `Stock` component based on `toolInvocations` from the `@ai-sdk/react` `useChat` hook. It checks the `toolName` (specifically `getStockPrice`) and renders the `Stock` component with the tool's result when the state is 'result', or a loading message otherwise. This demonstrates how to conditionally render UI components based on the AI model's tool calls.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';
import { Weather } from '@/components/weather';
import { Stock } from '@/components/stock';

export default function Page() {
  const { messages, input, setInput, handleSubmit } = useChat();

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role}</div>
          <div>{message.content}</div>
          <div>
            {message.toolInvocations?.map(toolInvocation => {
              const { toolName, toolCallId, state } = toolInvocation;
              if (state === 'result') {
                if (toolName === 'displayWeather') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId}>
                      <Weather {...result} />
                    </div>
                  );
                } else if (toolName === 'getStockPrice') {
                  const { result } = toolInvocation;
                  return <Stock key={toolCallId} {...result} />;
                }
              } else {
                return (
                  <div key={toolCallId}>
                    {toolName === 'displayWeather' ? (
                      <div>Loading weather...</div>
                    ) : toolName === 'getStockPrice' ? (
                      <div>Loading stock price...</div>
                    ) : (
                      <div>Loading...</div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={event => {
            setInput(event.target.value);
          }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: AI SDK Stream Chunk Callbacks and Error Handling
DESCRIPTION: Defines callbacks for processing individual chunks of a streaming response and for handling errors that occur during the streaming process.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
onChunk?: (event: OnChunkResult) => Promise<void> | void
  Callback that is called for each chunk of the stream. The stream processing will pause until the callback promise is resolved.
  Type: OnChunkResult
OnErrorResult:
  error: unknown
    The error that occurred.
onError?: (event: OnErrorResult) => Promise<void> | void
  Callback that is called when an error occurs during streaming. You can use it to log errors.
```

----------------------------------------

TITLE: Create .env.local File
DESCRIPTION: Creates an empty `.env.local` file in the project root to store environment variables like API keys.
SOURCE: https://v5.ai-sdk.dev/guides/multi-modal-chatbot

LANGUAGE: bash
CODE:
```
touch .env.local
```

----------------------------------------

TITLE: Create .env File for API Key
DESCRIPTION: Create a `.env` file in your project root to securely store your OpenAI API key, which is essential for authenticating with the OpenAI service.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: shell
CODE:
```
touch .env
```

----------------------------------------

TITLE: `generateText` Result Object Properties
DESCRIPTION: Documents the properties available on the result object returned by the `generateText` function. These properties provide access to the generated text, model reasoning, sources used, the reason for completion, and usage statistics.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: APIDOC
CODE:
```
result.text: The generated text.
result.reasoning: The reasoning text of the model (only available for some models).
result.sources: Sources that have been used as input to generate the response (only available for some models).
result.finishReason: The reason the model finished generating text.
result.usage: The usage of the model during text generation.
```

----------------------------------------

TITLE: Flight Status Conversation - With Booking and Flight Lookup
DESCRIPTION: Shows how multiple tools like 'lookupContacts', 'lookupBooking', and 'lookupFlight' can be composed to provide comprehensive flight status information, reducing the need for the user to provide additional details.
SOURCE: https://v5.ai-sdk.dev/advanced/multistep-interfaces

LANGUAGE: Conversation
CODE:
```
User: What's the status of my wife's upcoming flight?

Tool: lookupContacts() -> ["John Doe", "Jane Doe"]

Tool: lookupBooking("Jane Doe") -> "BA123 confirmed"

Tool: lookupFlight("BA123") -> "Flight BA123 is scheduled to depart on 12th December."

Model: Your wife's flight BA123 is confirmed and scheduled to depart on 12th December.
```

----------------------------------------

TITLE: API: Common Model Generation Parameters
DESCRIPTION: Defines common parameters for controlling model generation behavior, such as token limits, sampling methods, and penalty settings.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-object

LANGUAGE: APIDOC
CODE:
```
### maxOutputTokens?:

number

Maximum number of tokens to generate.

### temperature?:

number

Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

### topP?:

number

Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

### topK?:

number

Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.

### presencePenalty?:

number

Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.

### frequencyPenalty?:

number

Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.

### seed?:

number

The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.

### maxRetries?:

number

Maximum number of retries. Set to 0 to disable retries. Default: 2.

### abortSignal?:

AbortSignal

An optional abort signal that can be used to cancel the call.

### headers?:

Record<string, string>

Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.
```

----------------------------------------

TITLE: Compare AI SDK Svelte and React API Usage
DESCRIPTION: This section highlights the architectural differences in API usage between `@ai-sdk/svelte` and `@ai-sdk/react`. While both provide similar functionalities, `@ai-sdk/svelte` leverages class-based state management (e.g., `new Chat()`), whereas `@ai-sdk/react` utilizes React hooks (e.g., `useChat()`) for state management within components.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: APIDOC
CODE:
```
@ai-sdk/svelte:
  - State management via classes (e.g., `new Chat()`)
@ai-sdk/react:
  - State management via hooks (e.g., `useChat()`)

```

----------------------------------------

TITLE: AI Prompt for SQL Query Explanation
DESCRIPTION: This prompt guides an AI model to explain SQL queries. It provides the database schema for context and instructs the model to break down the query into unique, explained sections, even if an explanation is empty.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: AI Prompt
CODE:
```
You are a SQL (postgres) expert. Your job is to explain to the user write a SQL query you wrote to retrieve the data they asked for. The table schema is as follows:

unicorns (

id SERIAL PRIMARY KEY,

company VARCHAR(255) NOT NULL UNIQUE,

valuation DECIMAL(10, 2) NOT NULL,

date_joined DATE,

country VARCHAR(255) NOT NULL,

city VARCHAR(255) NOT NULL,

industry VARCHAR(255) NOT NULL,

select_investors TEXT NOT NULL

);

When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM unicorns limit 20", the sections could be "SELECT *", "FROM UNICORNS", "LIMIT 20".

If a section doesn't have any explanation, include it, but leave the explanation empty.


```

----------------------------------------

TITLE: Applying Default Settings to AI SDK Language Models
DESCRIPTION: This code demonstrates the `defaultSettingsMiddleware` for applying common configuration settings to a language model. It allows setting parameters such as `temperature`, `maxOutputTokens`, and provider-specific options like `store` for OpenAI models.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: javascript
CODE:
```
import { wrapLanguageModel, defaultSettingsMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: yourModel,
  middleware: defaultSettingsMiddleware({
    settings: {
      temperature: 0.5,
      maxOutputTokens: 800,
      providerOptions: { openai: { store: false } },
    },
  }),
});
```

----------------------------------------

TITLE: Import useActions Hook
DESCRIPTION: This snippet demonstrates how to import the `useActions` hook from the `@ai-sdk/rsc` package. This hook is essential for accessing server actions within client components in AI SDK RSC applications, preventing common client component errors.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/use-actions

LANGUAGE: typescript
CODE:
```
import { useActions } from "@ai-sdk/rsc"
```

----------------------------------------

TITLE: Generating Streamable Value in Server Action
DESCRIPTION: This server action demonstrates how to create and populate a streamable value using `createStreamableValue`. It updates the stream with multiple values before marking it as done, making the streamable value available for consumption.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/read-streamable-value

LANGUAGE: typescript
CODE:
```
async function generate() {
'use server';
const streamable = createStreamableValue();
streamable.update(1);
streamable.update(2);
streamable.done(3);
return streamable.value;
}
```

----------------------------------------

TITLE: useActions Hook
DESCRIPTION: A client-side hook that allows calling server actions from the client.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc

LANGUAGE: APIDOC
CODE:
```
useActions()
  Description: Call server actions from the client.
```

----------------------------------------

TITLE: Send Text Content to AI Model (AI SDK)
DESCRIPTION: Demonstrates how to send a simple text string as user content to an AI model using the `generateText` function. The `content` property is an array containing a text type object.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
messages: [
{
role: 'user',
content: [
{
type: 'text',
text: 'Where can I buy the best Currywurst in Berlin?',
},
],
},
],
});
```

----------------------------------------

TITLE: Handling Error States with useCompletion Hook
DESCRIPTION: This example demonstrates how to capture and display errors using the error state from the useCompletion hook. It shows two common patterns: integrating with a toast notification system via useEffect for transient messages, or directly rendering the error message within the UI for persistent display.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/completion

LANGUAGE: tsx
CODE:
```
const { error, ... } = useCompletion()

useEffect(() => {

if (error) {

toast.error(error.message)

}

}, [error])

// Or display the error message in the UI:

return (

<>

{error ? <div>{error.message}</div> : null}

</>

)
```

----------------------------------------

TITLE: Check for AI_NoObjectGeneratedError in AI SDK
DESCRIPTION: This code snippet demonstrates how to catch and handle the `NoObjectGeneratedError` when using `generateObject` from the AI SDK. It shows how to check if a caught error is an instance of `NoObjectGeneratedError` and access its specific properties like `cause`, `text`, `response`, `usage`, and `finishReason` for detailed error handling.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-errors/ai-no-object-generated-error

LANGUAGE: TypeScript
CODE:
```
import { generateObject, NoObjectGeneratedError } from 'ai';

try {
  await generateObject({ model, schema, prompt });
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.log('NoObjectGeneratedError');
    console.log('Cause:', error.cause);
    console.log('Text:', error.text);
    console.log('Response:', error.response);
    console.log('Usage:', error.usage);
    console.log('Finish Reason:', error.finishReason);
  }
}
```

----------------------------------------

TITLE: Create Drizzle ORM Embeddings Table Schema
DESCRIPTION: Defines the `embeddings` table schema using Drizzle ORM for PostgreSQL. It includes columns for ID, resource ID (foreign key), content, and a vector embedding, along with an HNSW index for efficient similarity search.
SOURCE: https://v5.ai-sdk.dev/guides/rag-chatbot

LANGUAGE: typescript
CODE:
```
import { nanoid } from '@/lib/utils';
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core';
import { resources } from './resources';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    resourceId: varchar('resource_id', { length: 191 }).references(
      () => resources.id,
      { onDelete: 'cascade' },
    ),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  table => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops'),
    ),
  }),
);
```

----------------------------------------

TITLE: Next.js Client Component for AI Data Stream
DESCRIPTION: This Next.js client component uses the `useCompletion` hook from `@ai-sdk/react` to manage user input, send prompts, and display streamed AI completions. It explicitly sets `streamProtocol` to 'data' (though it's the default) and handles form submission and input changes.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/stream-protocol

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useCompletion } from '@ai-sdk/react';

export default function Page() {
const { completion, input, handleInputChange, handleSubmit } = useCompletion({
streamProtocol: 'data', // optional, this is the default
});

return (
<form onSubmit={handleSubmit}>
<input name="prompt" value={input} onChange={handleInputChange} />
<button type="submit">Submit</button>
<div>{completion}</div>
</form>
);
}
```

----------------------------------------

TITLE: Render Weather Component based on AI Tool Invocation in React Chat
DESCRIPTION: This snippet updates the main `page.tsx` file to integrate the `Weather` component into a chat interface. It uses the `@ai-sdk/react` `useChat` hook and demonstrates how to check `toolInvocations` from `UIMessage` objects. The `Weather` component is conditionally rendered when the `displayWeather` tool is invoked and its state is 'result', otherwise a loading message is shown.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/generative-user-interfaces

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';
import { Weather } from '@/components/weather';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role === 'user' ? 'User: ' : 'AI: '}</div>
          <div>{message.content}</div>
          <div>
            {message.toolInvocations?.map(toolInvocation => {
              const { toolName, toolCallId, state } = toolInvocation;
              if (state === 'result') {
                if (toolName === 'displayWeather') {
                  const { result } = toolInvocation;
                  return (
                    <div key={toolCallId}>
                      <Weather {...result} />
                    </div>
                  );
                }
              } else {
                return (
                  <div key={toolCallId}>
                    {toolName === 'displayWeather' ? (
                      <div>Loading weather...</div>
                    ) : null}
                  </div>
                );
              }
            })}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

----------------------------------------

TITLE: Stream an array of objects with a Zod schema using AI SDK
DESCRIPTION: Illustrates streaming an array of structured elements (e.g., hero descriptions) from a language model. It uses `streamObject` with an array output type and a Zod schema for array items, iterating over `elementStream` to get complete elements.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-object

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

const { elementStream } = streamObject({
  model: openai('gpt-4.1'),
  output: 'array',
  schema: z.object({
    name: z.string(),
    class: z
      .string()
      .describe('Character class, e.g. warrior, mage, or thief.'),
    description: z.string()
  }),
  prompt: 'Generate 3 hero descriptions for a fantasy role playing game.'
});

for await (const hero of elementStream) {
  console.log(hero);
}
```

----------------------------------------

TITLE: Calculate Embedding Similarity with AI SDK
DESCRIPTION: After generating embeddings, the `cosineSimilarity` function can be used to determine the similarity between them. This is beneficial for tasks such as finding similar words or phrases within a dataset, and for ranking or filtering related items based on their semantic closeness.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/embeddings

LANGUAGE: typescript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { cosineSimilarity, embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['sunny day at the beach', 'rainy afternoon in the city']
});

console.log(
  `cosine similarity: ${cosineSimilarity(embeddings[0], embeddings[1])}`
);
```

----------------------------------------

TITLE: streamUI Function
DESCRIPTION: A helper function designed to stream React Server Components when a tool is executed.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc

LANGUAGE: APIDOC
CODE:
```
streamUI()
  Description: Use a helper function that streams React Server Components on tool execution.
```

----------------------------------------

TITLE: Handling Streaming Errors with `error` Part Type in AI SDK
DESCRIPTION: This JavaScript code demonstrates how to effectively handle errors within an AI SDK stream that supports `error` part types. It shows iterating through `fullStream` parts, specifically checking for and processing the 'error' type. Additionally, a `try-catch` block is included to manage any errors that occur outside the streaming loop, ensuring comprehensive error handling.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/error-handling

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';

try {

const { fullStream } = streamText({

model: yourModel,

prompt: 'Write a vegetarian lasagna recipe for 4 people.',

});

for await (const part of fullStream) {

switch (part.type) {

// ... handle other part types

case 'error': {

const error = part.error;

// handle error

break;

}

}

}

} catch (error) {

// handle error

}
```

----------------------------------------

TITLE: Update Client-Side Vue Chat Configuration with maxSteps
DESCRIPTION: This snippet modifies the `pages/index.vue` file to configure the `useChat` hook with a `maxSteps` option. Setting `maxSteps` to 5 allows the AI model to perform up to five sequential steps in a single generation, enabling more complex and multi-turn interactions for gathering and processing information.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: Vue
CODE:
```
<script setup lang="ts">

import { useChat } from '@ai-sdk/vue';

const { messages, input, handleSubmit } = useChat({ maxSteps: 5 });

</script>

<!-- ... rest of your component code -->
```

----------------------------------------

TITLE: Repair Tool Calls with Re-ask Strategy using experimental_repairToolCall
DESCRIPTION: Illustrates an experimental approach to repair tool calls by re-asking the model with the original messages, system prompt, and the tool error as context. It attempts to find a new, valid tool call from the model's response.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText, NoSuchToolError, tool } from 'ai';

const result = await generateText({
model,
tools,
prompt,
experimental_repairToolCall: async ({
toolCall,
tools,
error,
messages,
system,
}) => {
const result = await generateText({
model,
system,
messages: [
...messages,
{
role: 'assistant',
content: [
{
type: 'tool-call',
toolCallId: toolCall.toolCallId,
toolName: toolCall.toolName,
args: toolCall.args,
},
],
},
{
role: 'tool' as const,
content: [
{
type: 'tool-result',
toolCallId: toolCall.toolCallId,
toolName: toolCall.toolName,
result: error.message,
},
],
},
],
tools,
});

const newToolCall = result.toolCalls.find(
newToolCall => newToolCall.toolName === toolCall.toolName,
);

return newToolCall != null
? {
toolCallType: 'function' as const,
toolCallId: toolCall.toolCallId,
toolName: toolCall.toolName,
args: JSON.stringify(newToolCall.args),
}
: null;
},
});
```

----------------------------------------

TITLE: Configure Custom Model Settings with AI SDK
DESCRIPTION: Demonstrates how to override default model settings for a provider or create model name aliases with pre-configured settings, such as adjusting reasoning effort for OpenAI models.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/provider-management

LANGUAGE: TypeScript
CODE:
```
import { openai as originalOpenAI } from '@ai-sdk/openai';

import { customProvider } from 'ai';

// custom provider with different provider options:
export const openai = customProvider({
  languageModels: {
    // replacement model with custom provider options:
    'gpt-4o': wrapLanguageModel({
      model: originalOpenAI('gpt-4o'),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoningEffort: 'high',
            },
          },
        },
      }),
    }),

    // alias model with custom provider options:
    'gpt-4o-mini-high-reasoning': wrapLanguageModel({
      model: originalOpenAI('gpt-4o-mini'),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoningEffort: 'high',
            },
          },
        },
      }),
    }),
  },
  fallbackProvider: originalOpenAI,
});
```

----------------------------------------

TITLE: Server-side Tool Execution with `execute` Function
DESCRIPTION: Demonstrates how to define a tool with an `execute` function for server-side processing. This ensures the tool returns a result directly, satisfying the model's expectation for a tool invocation result.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/tool-invocation-missing-result

LANGUAGE: TypeScript
CODE:
```
const tools = {
  weather: tool({
    description: 'Get the weather in a location',
    parameters: z.object({
      location: z
        .string()
        .describe('The city and state, e.g. "San Francisco, CA"'),
    }),
    execute: async ({ location }) => {
      // Fetch and return weather data
      return { temperature: 72, conditions: 'sunny', location };
    },
  }),
};
```

----------------------------------------

TITLE: Tool Choice Configuration
DESCRIPTION: Specifies how tools are selected for execution, with options for automatic selection, disabling, requiring, or specifying a particular tool.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
toolChoice?: "auto" | "none" | "required" | { "type": "tool", "toolName": string }
  The tool choice setting. It specifies how tools are selected for execution. The default is "auto". "none" disables tool execution. "required" requires tools to be executed. { "type": "tool", "toolName": string } specifies a specific tool to execute.
```

----------------------------------------

TITLE: Tool Choice Setting
DESCRIPTION: Specifies how tools are selected for execution. Options include 'auto', 'none', 'required', or a specific tool by name.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
"auto" | "none" | "required" | { "type": "tool", "toolName": string }

The tool choice setting. It specifies how tools are selected for execution. The default is "auto". "none" disables tool execution. "required" requires tools to be executed. { "type": "tool", "toolName": string } specifies a specific tool to execute.
```

----------------------------------------

TITLE: Optimizing Chat Requests by Sending Only the Last Message
DESCRIPTION: This example illustrates how to reduce network payload by sending only the most recent message to the server. It involves using the `prepareRequestBody` function with `useChat` on the client to filter messages, and then on the server, loading previous messages and appending the new one before processing with `streamText`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

const {
// ...
} = useChat({
// ...
chatStore: defaultChatStoreOptions({
// only send the last message to the server:
prepareRequestBody({ messages, chatId }) {
return { message: messages[messages.length - 1], chatId };
}
})
});
```

LANGUAGE: TypeScript
CODE:
```
import { appendClientMessage, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
// get the last message from the client:
const { message, chatId } = await req.json();

// load the previous messages from the server:
const previousMessages = await loadChat(chatId);

// append the new message to the previous messages:
const messages = appendClientMessage({
messages: previousMessages,
message
});

const result = streamText({
// ...
messages: convertToModelMessages(messages)
});
// ...
}
```

----------------------------------------

TITLE: Pipe Text Stream to Server Response
DESCRIPTION: Writes text delta output to a Node.js response-like object. It automatically sets the `Content-Type` header to `text/plain; charset=utf-8` and sends each text delta as a separate chunk, with options for HTTP status and headers.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
pipeTextStreamToResponse: (response: ServerResponse, init?: ResponseInit) => void
  Writes text delta output to a Node.js response-like object. It sets a `Content-Type` header to `text/plain; charset=utf-8` and writes each text delta as a separate chunk.
ResponseInit
  status?: number
    The response status code.
  statusText?: string
    The response status text.
  headers?: Record<string, string>
    The response headers.
```

----------------------------------------

TITLE: Pass Custom Body Fields Per Request with useChat handleSubmit (Client-Side)
DESCRIPTION: This client-side example shows how to send additional, per-request information to the backend using the `body` option within the `handleSubmit` function of the `useChat` hook. It illustrates modifying the form submission to include a `customKey` in the request body.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: TypeScript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {
const { messages, input, handleInputChange, handleSubmit } = useChat();

return (
<div>
{messages.map(m => (
<div key={m.id}>
{m.role}:{' '}
{m.parts.map((part, index) =>
part.type === 'text' ? <span key={index}>{part.text}</span> : null,
)}
</div>
))}

<form
onSubmit={event => {
handleSubmit(event, {
body: {
customKey: 'customValue',
},
});
}}
>
<input value={input} onChange={handleInputChange} />
</form>
</div>
);
}
```

----------------------------------------

TITLE: Retrieve Custom Body Fields on Server-Side Request
DESCRIPTION: This server-side snippet demonstrates how to extract custom fields, such as `customKey`, from the request body when handling a POST request. It shows destructuring the request JSON to access both standard messages and additional custom data sent from the client.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: TypeScript
CODE:
```
export async function POST(req: Request) {
// Extract addition information ("customKey") from the body of the request:
const { messages, customKey }: { messages: UIMessage[]; customKey: string } =
await req.json();

//...
}
```

----------------------------------------

TITLE: Tool Input Parameters Schema
DESCRIPTION: Defines the expected input schema for a tool, used by the language model for generation and for validating its output. Supports Zod Schema or JSON Schema.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
Zod Schema | JSON Schema

The schema of the input that the tool expects. The language model will use this to generate the input. It is also used to validate the output of the language model. Use descriptions to make the input understandable for the language model. You can either pass in a Zod schema or a JSON schema (using the `jsonSchema` function).
```

----------------------------------------

TITLE: Generating Structured JSON for UI Rendering with AI SDK Tools
DESCRIPTION: This example modifies the `getWeather` tool to return a structured JSON object instead of a string. By returning an object with `temperature`, `unit`, `description`, and `forecast`, the output becomes suitable for direct consumption by UI components, enabling dynamic rendering.
SOURCE: https://v5.ai-sdk.dev/advanced/rendering-ui-with-language-models

LANGUAGE: TypeScript
CODE:
```
const text = generateText({
  model: openai('gpt-3.5-turbo'),
  system: 'You are a friendly assistant',
  prompt: 'What is the weather in SF?',
  tools: {
    getWeather: {
      description: 'Get the weather for a location',
      parameters: z.object({
        city: z.string().describe('The city to get the weather for'),
        unit: z
          .enum(['C', 'F'])
          .describe('The unit to display the temperature in'),
      }),
      execute: async ({ city, unit }) => {
        const weather = getWeather({ city, unit });
        const { temperature, unit, description, forecast } = weather;
        return {
          temperature,
          unit,
          description,
          forecast,
        };
      },
    },
  },
});
```

----------------------------------------

TITLE: Save Chats: AI SDK RSC `onSetAIState` Callback
DESCRIPTION: Demonstrates how to save AI chat state using the `onSetAIState` callback function within the `createAI` context provider. This method is executed when the AI state is updated and `done` is true, typically saving the final state to a database.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
import { createAI } from '@ai-sdk/rsc';
import { saveChat } from '@/utils/queries';

export const AI = createAI({
  initialAIState: {},
  initialUIState: {},
  actions: {
    // server actions
  },
  onSetAIState: async ({ state, done }) => {
    'use server';
    if (done) {
      await saveChat(state);
    }
  }
});
```

----------------------------------------

TITLE: Retrieve All Intermediate Steps from Multi-Step LLM Calls
DESCRIPTION: This example illustrates how to access the full history of an LLM's multi-step execution. By using the `steps` property from the `generateText` response, developers can extract information from all intermediate calls, such as tool invocations, providing insights into the agent's reasoning process.
SOURCE: https://v5.ai-sdk.dev/foundations/agents

LANGUAGE: TypeScript
CODE:
```
import { generateText, stepCountIs } from 'ai';

const { steps } = await generateText({
  model: openai('gpt-4o'),
  stopWhen: stepCountIs(10),
  // ...
});

// extract all tool calls from the steps:
const allToolCalls = steps.flatMap(step => step.toolCalls);
```

----------------------------------------

TITLE: Access Sources from AI SDK generateText Response
DESCRIPTION: This example demonstrates how to access and iterate over sources returned by the `generateText` function in the AI SDK, specifically for URL-based sources. It shows how to retrieve `id`, `title`, `url`, and `providerMetadata` from each source.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: typescript
CODE:
```
const result = await generateText({
model: google('gemini-2.0-flash-exp', { useSearchGrounding: true }),
prompt: 'List the top 5 San Francisco news from the past week.',
});
for (const source of result.sources) {
if (source.sourceType === 'url') {
console.log('ID:', source.id);
console.log('Title:', source.title);
console.log('URL:', source.url);
console.log('Provider metadata:', source.providerMetadata);
console.log();
}
}
```

----------------------------------------

TITLE: After Migration: Displaying Loading Indicator with AI SDK UI Tool Invocation State
DESCRIPTION: This snippet demonstrates how to use the `state` property of `toolInvocations` in AI SDK UI to show a loading indicator. It conditionally renders a `Weather` component with a loading state or a generic 'Loading...' message while a tool is executing, and displays the result when the tool's state is 'result'.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: jsx
CODE:
```
'use client';

export function Message({ role, content, toolInvocations }) {

return (

<div>

<div>{role}</div>

<div>{content}</div>

{toolInvocations && (

<div>

{toolInvocations.map(toolInvocation => {

const { toolName, toolCallId, state } = toolInvocation;

if (state === 'result') {

const { result } = toolInvocation;

return (

<div key={toolCallId}>

{toolName === 'getWeather' ? (

<Weather weatherAtLocation={result} />

) : null}

</div>

);

} else {

return (

<div key={toolCallId}>

{toolName === 'getWeather' ? (

<Weather isLoading={true} />

) : (

<div>Loading...</div>

)}

</div>

);

})}

</div>

)}

</div>

);

}
```

----------------------------------------

TITLE: Integrate External Tools with AI SDK for Enhanced LLM Capabilities
DESCRIPTION: This snippet illustrates how to define and use a custom tool (`getWeather`) with the AI SDK's `generateText` function. Tools allow LLMs to perform discrete tasks (like fetching data) and interact with external systems, overcoming limitations in areas like mathematics or real-time information retrieval. This functionality is exclusive to the 'o1' model.
SOURCE: https://v5.ai-sdk.dev/guides/o1

LANGUAGE: typescript
CODE:
```
import { generateText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const { text } = await generateText({
model: openai('o1'),
prompt: 'What is the weather like today?',
tools: {
getWeather: tool({
description: 'Get the weather in a location',
parameters: z.object({
location: z.string().describe('The location to get the weather for'),
}),
execute: async ({ location }) => ({
location,
temperature: 72 + Math.floor(Math.random() * 21) - 10,
}),
}),
},
});
```

----------------------------------------

TITLE: Migrate `baseUrl` to `baseURL` in AI SDK Providers
DESCRIPTION: Demonstrates the migration from the deprecated `baseUrl` option to the new `baseURL` option for configuring AI SDK providers like OpenAI. This change applies to all providers.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-4-0

LANGUAGE: JavaScript
CODE:
```
const perplexity = createOpenAI({
// ...
baseUrl: 'https://api.perplexity.ai/',
});
```

LANGUAGE: JavaScript
CODE:
```
const perplexity = createOpenAI({
// ...
baseURL: 'https://api.perplexity.ai/',
});
```

----------------------------------------

TITLE: Smooth Stream Japanese Text with AI SDK
DESCRIPTION: Demonstrates how to use the `smoothStream` function in conjunction with `streamText` from the AI SDK to enable smooth streaming of Japanese text. This approach applies a regular expression to chunk the text based on Japanese characters or word boundaries, which is crucial for improving the user experience when displaying streamed content in languages like Japanese.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/smooth-stream-japanese

LANGUAGE: TypeScript
CODE:
```
import { smoothStream, streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Your prompt here',
  experimental_transform: smoothStream({
    chunking: /[\u3040-\u309F\u30A0-\u30FF]|\S+\s+/,
  }),
});
```

----------------------------------------

TITLE: Configure Per-Request Custom Metadata for Logging with Language Model Middleware in TypeScript
DESCRIPTION: This example demonstrates how to send and access custom metadata via `providerOptions` within `LanguageModelV2Middleware` for logging purposes. It shows how to pass contextual data like user IDs or timestamps to a logging middleware for tracking and debugging model interactions.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText, wrapLanguageModel, LanguageModelV2Middleware } from 'ai';

export const yourLogMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    console.log('METADATA', params?.providerMetadata?.yourLogMiddleware);
    const result = await doGenerate();
    return result;
  },
};

const { text } = await generateText({
  model: wrapLanguageModel({
    model: openai('gpt-4o'),
    middleware: yourLogMiddleware,
  }),
  prompt: 'Invent a new holiday and describe its traditions.',
  providerOptions: {
    yourLogMiddleware: {
      hello: 'world',
    },
  },
});

console.log(text);
```

----------------------------------------

TITLE: Creating a Streamable Value with AI SDK RSC
DESCRIPTION: This server-side example demonstrates how to use `createStreamableValue` from `@ai-sdk/rsc` to create a streamable JavaScript value. It shows how to initialize the stream, send updates over time, and finally mark the stream as done, simulating a sequence of status updates.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/streaming-values

LANGUAGE: JavaScript
CODE:
```
'use server';

import { createStreamableValue } from '@ai-sdk/rsc';

export const runThread = async () => {
  const streamableStatus = createStreamableValue('thread.init');

  setTimeout(() => {
    streamableStatus.update('thread.run.create');
    streamableStatus.update('thread.run.update');
    streamableStatus.update('thread.run.end');
    streamableStatus.done('thread.end');
  }, 1000);

  return {
    status: streamableStatus.value,
  };
};
```

----------------------------------------

TITLE: Accessing Message History in AI SDK Tool Execution
DESCRIPTION: Demonstrates how the message history from the language model, including text, tool calls, and tool results from previous steps, is forwarded to the tool's `execute` function, allowing it to be used in subsequent operations like calls to other language models.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
import { generateText, tool } from 'ai';

const result = await generateText({
// ...
tools: {
myTool: tool({
// ...
execute: async (args, { messages }) => {
// use the message history in e.g. calls to other language models
return something;
},
}),
},
});
```

----------------------------------------

TITLE: Set Provider Options at Message Part Level
DESCRIPTION: This snippet illustrates how to apply provider options to specific parts within a message's content array. This level of granularity is essential for multi-modal inputs, allowing settings like image detail to be configured for individual text or image parts.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const messages = [
{
role: 'user',
content: [
{
type: 'text',
text: 'Describe the image in detail.',
providerOptions: {
openai: { imageDetail: 'low' },
},
},
{
type: 'image',
image:
'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',
// Sets image detail configuration for image part:
providerOptions: {
openai: { imageDetail: 'low' },
},
},
],
},
];
```

----------------------------------------

TITLE: Implement controlled input with useChat hook (React)
DESCRIPTION: This example illustrates how to use more granular APIs like `setInput` and `append` from the `useChat` hook with custom input and submit button components. This approach provides advanced control for scenarios such as form validation or highly customized UI elements, as an alternative to default `handleSubmit` and `handleInputChange` callbacks.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JavaScript
CODE:
```
const { input, setInput, append } = useChat()

return <>
<MyCustomInput value={input} onChange={value => setInput(value)} />
<MySubmitButton onClick={() => {
// Send a new message to the AI provider
append({
role: 'user',
parts: [{ type: 'text', text: input }],
})
}}/>
...
</>
```

----------------------------------------

TITLE: Updated TypeScript Server Action with Schema and Array Output
DESCRIPTION: Updates the `explainQuery` server action to incorporate the `explanationSchema` and specify `output: 'array'`. This ensures the AI model returns an array of structured explanation objects, enhancing the clarity and usability of the generated output.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
// other imports

import { explanationSchema } from '@/lib/types';

/* ...rest of the file... */

export const explainQuery = async (input: string, sqlQuery: string) => {

'use server';

try {

const result = await generateObject({

model: openai('gpt-4o'),

system: `You are a SQL (postgres) expert. ...`, // SYSTEM PROMPT AS ABOVE - OMITTED FOR BREVITY

prompt: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

User Query:

${input}

Generated SQL Query:

${sqlQuery}`,

schema: explanationSchema,

output: 'array',

});

return result.object;

} catch (e) {

console.error(e);

throw new Error('Failed to generate query');

}

};
```

----------------------------------------

TITLE: Nucleus Sampling (topP) Setting
DESCRIPTION: Controls the diversity of the output by sampling from the smallest set of tokens whose cumulative probability exceeds `topP`. It's recommended to set either `temperature` or `topP`, but not both.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: APIDOC
CODE:
```
number

Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.
```

----------------------------------------

TITLE: Composing Multiple Streamable UIs with AI SDK RSC
DESCRIPTION: This server-side function demonstrates how to create and return multiple independent streamable UI components (weather and forecast) along with other data in a single request using `@ai-sdk/rsc`. Each UI component updates independently as its data becomes available, allowing for decoupled UI updates.
SOURCE: https://v5.ai-sdk.dev/advanced/multiple-streamables

LANGUAGE: JavaScript
CODE:
```
'use server';

import { createStreamableUI } from '@ai-sdk/rsc';

export async function getWeather() {

const weatherUI = createStreamableUI();

const forecastUI = createStreamableUI();

weatherUI.update(<div>Loading weather...</div>);

forecastUI.update(<div>Loading forecast...</div>);

getWeatherData().then(weatherData => {

weatherUI.done(<div>{weatherData}</div>);

});

getForecastData().then(forecastData => {

forecastUI.done(<div>{forecastData}</div>);

});

// Return both streamable UIs and other data fields.

return {

requestedAt: Date.now(),

weather: weatherUI.value,

forecast: forecastUI.value,

};

}
```

----------------------------------------

TITLE: Cancelling Object Generation with AI SDK useObject Stop Function
DESCRIPTION: This snippet demonstrates how to integrate a 'stop' functionality using the `stop` function provided by the `useObject` hook. This allows users to cancel an ongoing object generation request, which is useful for long-running operations or user-initiated cancellations.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/object-generation

LANGUAGE: JavaScript
CODE:
```
'use client';

import { useObject } from '@ai-sdk/react';

export default function Page() {
const { isLoading, stop, object, submit } = useObject({
api: '/api/notifications',
schema: notificationSchema,
});

return (
<>
{isLoading && (
<button type="button" onClick={() => stop()}>
Stop
</button>
)}
<button onClick={() => submit('Messages during finals week.')}>
Generate notifications
</button>
{object?.notifications?.map((notification, index) => (
<div key={index}>
<p>{notification?.name}</p>
<p>{notification?.message}</p>
</div>
))}
</>
);
}
```

----------------------------------------

TITLE: Client: Consuming Streamed React Components
DESCRIPTION: This React client component is designed to receive and render streamed React components from a server action that uses `streamUI`. Instead of managing separate text and loading states, it directly sets the received `React.ReactNode` as the generation output, allowing the server to control the entire UI stream.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/loading-state

LANGUAGE: tsx
CODE:
```
'use client';

import { useState } from 'react';

import { generateResponse } from './actions';

import { readStreamableValue } from '@ai-sdk/rsc';

// Force the page to be dynamic and allow streaming responses up to 30 seconds

export const maxDuration = 30;

export default function Home() {

const [input, setInput] = useState<string>('');

const [generation, setGeneration] = useState<React.ReactNode>();

return (

<div>

<div>{generation}</div>

<form

onSubmit={async e => {

e.preventDefault();

const result = await generateResponse(input);

setGeneration(result);

setInput('');

}}

>

<input

type="text"

value={input}

onChange={event => {

setInput(event.target.value);

}}

/>

<button>Send Message</button>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Example with recursive Zod schemas for AI SDK
DESCRIPTION: This example demonstrates how to define and use a recursive Zod schema with `z.lazy` and convert it into an AI SDK-compatible JSON schema using `zodSchema` with `useReferences: true`. This is crucial for handling nested, self-referencing data structures.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/zod-schema

LANGUAGE: TypeScript
CODE:
```
import { zodSchema } from 'ai';
import { z } from 'zod';

// Define a base category schema
const baseCategorySchema = z.object({
  name: z.string(),
});

// Define the recursive Category type
type Category = z.infer<typeof baseCategorySchema> & {
  subcategories: Category[];
};

// Create the recursive schema using z.lazy
const categorySchema: z.ZodType<Category> = baseCategorySchema.extend({
  subcategories: z.lazy(() => categorySchema.array()),
});

// Create the final schema with useReferences enabled for recursive support
const mySchema = zodSchema(
  z.object({
    category: categorySchema,
  }),
  { useReferences: true },
);
```

----------------------------------------

TITLE: Next.js: Create New Chat and Redirect
DESCRIPTION: This Next.js page component handles the creation of a new chat session when a user navigates to the chat page without a specific chat ID. It calls `createChat` to generate a unique ID and then redirects the user to the new chat's URL.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: TypeScript
CODE:
```
import { redirect } from 'next/navigation';
import { createChat } from '@tools/chat-store';

export default async function Page() {
const id = await createChat(); // create a new chat
redirect(`/chat/${id}`); // redirect to chat page, see below
}
```

----------------------------------------

TITLE: Handle Slack Events POST Request in TypeScript
DESCRIPTION: Defines an asynchronous `POST` function to process incoming Slack events. It handles URL verification, verifies event callbacks, and dispatches different event types (`app_mention`, `assistant_thread_started`, `message`) to specific handlers, ensuring a timely response to Slack while processing AI logic asynchronously.
SOURCE: https://v5.ai-sdk.dev/guides/slackbot

LANGUAGE: TypeScript
CODE:
```
import type { SlackEvent } from '@slack/web-api';
import {
  assistantThreadMessage,
  handleNewAssistantMessage
} from '../lib/handle-messages';
import { waitUntil } from '@vercel/functions';
import { handleNewAppMention } from '../lib/handle-app-mention';
import { verifyRequest, getBotId } from '../lib/slack-utils';

export async function POST(request: Request) {
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody);
  const requestType = payload.type as 'url_verification' | 'event_callback';

  // See https://api.slack.com/events/url_verification
  if (requestType === 'url_verification') {
    return new Response(payload.challenge, { status: 200 });
  }

  await verifyRequest({ requestType, request, rawBody });

  try {
    const botUserId = await getBotId();
    const event = payload.event as SlackEvent;

    if (event.type === 'app_mention') {
      waitUntil(handleNewAppMention(event, botUserId));
    }

    if (event.type === 'assistant_thread_started') {
      waitUntil(assistantThreadMessage(event));
    }

    if (
      event.type === 'message' &&
      !event.subtype &&
      event.channel_type === 'im' &&
      !event.bot_id &&
      !event.bot_profile &&
      event.bot_id !== botUserId
    ) {
      waitUntil(handleNewAssistantMessage(event, botUserId));
    }

    return new Response('Success!', { status: 200 });
  } catch (error) {
    console.error('Error generating response', error);
    return new Response('Error generating response', { status: 500 });
  }
}
```

----------------------------------------

TITLE: Stream Custom Sources with UI Message Stream (JavaScript)
DESCRIPTION: Demonstrates how to use createUIMessageStream to send custom structured data, like RAG pipeline sources, from the server to the client. The writer.write method is used to stream 'source' type parts.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: JavaScript
CODE:
```
const stream = createUIMessageStream({
execute: writer => {
// stream custom sources
writer.write({
type: 'source',
value: {
type: 'source',
sourceType: 'url',
id: 'source-1',
url: 'https://example.com',
title: 'Example Source',
},
});
},
});
```

----------------------------------------

TITLE: Handle Errors in createDataStreamResponse
DESCRIPTION: Demonstrates how to integrate custom error handling directly into `createDataStreamResponse`. The `onError` callback allows you to process or log errors that occur during the execution of the data stream, ensuring robust error management.
SOURCE: https://v5.ai-sdk.dev/troubleshooting/use-chat-an-error-occurred

LANGUAGE: TypeScript
CODE:
```
const response = createDataStreamResponse({

// ...

async execute(dataStream) {

// ...

},

onError: errorHandler,

});
```

----------------------------------------

TITLE: Create AI Context for UI and AI State Management
DESCRIPTION: This code creates an AI context using `createAI` from `@ai-sdk/rsc`. It initializes empty UI and AI states and registers the `submitUserMessage` server action, making it available throughout the application for managing conversational flow.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
import { createAI } from '@ai-sdk/rsc';
import { submitUserMessage } from './actions';

export const AI = createAI<any[], React.ReactNode[]>(
{
initialUIState: [],
initialAIState: [],
actions: {
submitUserMessage,
},
});
```

----------------------------------------

TITLE: Migrate AI SDK Error isXXXError to isInstance method
DESCRIPTION: Static `isXXXError` methods have been removed from AI SDK error classes in AI SDK 4.0. Developers should now use the `isInstance` method of the corresponding error class to check error types. This change requires manual code updates.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-4-0

LANGUAGE: JavaScript
CODE:
```
import { APICallError } from 'ai';

APICallError.isAPICallError(error);
```

LANGUAGE: JavaScript
CODE:
```
import { APICallError } from 'ai';

APICallError.isInstance(error);
```

----------------------------------------

TITLE: Implement Logging Middleware for AI SDK Language Models
DESCRIPTION: This example illustrates how to create a custom `LanguageModelV2Middleware` to log the parameters and generated text for both `doGenerate` and `doStream` methods of an AI SDK language model. It shows how to use `wrapGenerate` to intercept synchronous generation and `wrapStream` with a `TransformStream` to process and log streaming output.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import type { LanguageModelV2Middleware, LanguageModelV2StreamPart } from 'ai';

export const yourLogMiddleware: LanguageModelV2Middleware = {

wrapGenerate: async ({ doGenerate, params }) => {

console.log('doGenerate called');

console.log(`params: ${JSON.stringify(params, null, 2)}`);

const result = await doGenerate();

console.log('doGenerate finished');

console.log(`generated text: ${result.text}`);

return result;

},

wrapStream: async ({ doStream, params }) => {

console.log('doStream called');

console.log(`params: ${JSON.stringify(params, null, 2)}`);

const { stream, ...rest } = await doStream();

let generatedText = '';

const transformStream = new TransformStream<

LanguageModelV2StreamPart,

LanguageModelV2StreamPart

>({

transform(chunk, controller) {

if (chunk.type === 'text') {

generatedText += chunk.text;

}

controller.enqueue(chunk);

},

flush() {

console.log('doStream finished');

console.log(`generated text: ${generatedText}`);

},

});

return {

stream: stream.pipeThrough(transformStream),

...rest,

};

},

};
```

----------------------------------------

TITLE: streamUI Function Parameters (AI SDK)
DESCRIPTION: Detailed API documentation for the parameters of the `streamUI` function, including their types, descriptions, and nested structures for various message types and generation control options.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc/stream-ui

LANGUAGE: APIDOC
CODE:
```
model:
  Type: LanguageModel
  Description: The language model to use. Example: openai("gpt-4.1")

initial?:
  Type: ReactNode
  Description: The initial UI to render.

system:
  Type: string
  Description: The system prompt to use that specifies the behavior of the model.

prompt:
  Type: string
  Description: The input prompt to generate the text from.

messages:
  Type: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> | Array<UIMessage>
  Description: A list of messages that represent a conversation. Automatically converts UI messages from the useChat hook.

  CoreSystemMessage:
    role:
      Type: 'system'
      Description: The role for the system message.
    content:
      Type: string
      Description: The content of the message.

  CoreUserMessage:
    role:
      Type: 'user'
      Description: The role for the user message.
    content:
      Type: string | Array<TextPart | ImagePart | FilePart>
      Description: The content of the message.

    TextPart:
      type:
        Type: 'text'
        Description: The type of the message part.
      text:
        Type: string
        Description: The text content of the message part.

    ImagePart:
      type:
        Type: 'image'
        Description: The type of the message part.
      image:
        Type: string | Uint8Array | Buffer | ArrayBuffer | URL
        Description: The image content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.
      mediaType?:
        Type: string
        Description: The IANA media type of the image. Optional.

    FilePart:
      type:
        Type: 'file'
        Description: The type of the message part.
      data:
        Type: string | Uint8Array | Buffer | ArrayBuffer | URL
        Description: The file content of the message part. String are either base64 encoded content, base64 data URLs, or http(s) URLs.
      mediaType:
        Type: string
        Description: The IANA media type of the file.

  CoreAssistantMessage:
    role:
      Type: 'assistant'
      Description: The role for the assistant message.
    content:
      Type: string | Array<TextPart | ToolCallPart>
      Description: The content of the message.

    TextPart:
      type:
        Type: 'text'
        Description: The type of the message part.
      text:
        Type: string
        Description: The text content of the message part.

    ToolCallPart:
      type:
        Type: 'tool-call'
        Description: The type of the message part.
      toolCallId:
        Type: string
        Description: The id of the tool call.
      toolName:
        Type: string
        Description: The name of the tool, which typically would be the name of the function.
      args:
        Type: object based on zod schema
        Description: Parameters generated by the model to be used by the tool.

  CoreToolMessage:
    role:
      Type: 'tool'
      Description: The role for the assistant message.
    content:
      Type: Array<ToolResultPart>
      Description: The content of the message.

    ToolResultPart:
      type:
        Type: 'tool-result'
        Description: The type of the message part.
      toolCallId:
        Type: string
        Description: The id of the tool call the result corresponds to.
      toolName:
        Type: string
        Description: The name of the tool the result corresponds to.
      result:
        Type: unknown
        Description: The result returned by the tool after execution.
      isError?:
        Type: boolean
        Description: Whether the result is an error or an error message.

maxOutputTokens?:
  Type: number
  Description: Maximum number of tokens to generate.

temperature?:
  Type: number
  Description: Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

topP?:
  Type: number
  Description: Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

topK?:
  Type: number
  Description: Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.

presencePenalty?:
  Type: number
  Description: Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.

frequencyPenalty?:
  Type: number
  Description: Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.

stopSequences?:
  Type: string[]
  Description: Sequences that will stop the generation of the text. If the model generates any of these sequences, it will stop generating further text.

seed?:
  Type: number
  Description: The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.

maxRetries?:
  Type: number
  Description: Maximum number of retries. Set to 0 to disable retries. Default: 2.

abortSignal?:
  Type: AbortSignal
  Description: An optional abort signal that can be used to cancel the call.

headers?:
  Type: Record<string, string>
  Description: Additional HTTP headers to be sent with the request. Only applicable for HTTP-based providers.

tools:
  Type: ToolSet
  Description: Tools that are accessible to and can be called by the model.

  Tool:
    description?:
      Type: string
      Description: Information about the purpose of the tool including details on how and when it can be used by the model.
    parameters:
      Type: zod schema
      Description: The typed schema that describes the parameters of the tool that can also be used to validation and error handling.
```

----------------------------------------

TITLE: Generate Text with OpenAI o1 Models using AI SDK
DESCRIPTION: This snippet demonstrates how to use the AI SDK Core to generate text with OpenAI's o1 series models. The AI SDK abstracts away provider differences, allowing for simple API calls and easy model switching. It shows examples for both 'o1-mini' and 'o1' models. Note that `@ai-sdk/openai` version 0.0.59 or greater is required, or `temperature: 1` must be set.
SOURCE: https://v5.ai-sdk.dev/guides/o1

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('o1-mini'),
  prompt: 'Explain the concept of quantum entanglement.',
});
```

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
  model: openai('o1'),
  prompt: 'Explain the concept of quantum entanglement.',
});
```

----------------------------------------

TITLE: Generate Text with OpenAI o3-mini using AI SDK
DESCRIPTION: This snippet demonstrates the fundamental way to use the AI SDK to interact with the OpenAI o3-mini model for basic text generation. It shows the necessary imports and how to call `generateText` with the specified model and a prompt.
SOURCE: https://v5.ai-sdk.dev/guides/o3

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';

import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
model: openai('o3-mini'),
prompt: 'Explain the concept of quantum entanglement.',
});
```

----------------------------------------

TITLE: Setup createProviderRegistry with Anthropic and OpenAI
DESCRIPTION: Demonstrates how to initialize a provider registry using `createProviderRegistry` with both default and custom configurations for Anthropic and OpenAI providers, including API key setup.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/provider-registry

LANGUAGE: TypeScript
CODE:
```
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic,
  // register provider with prefix and custom setup:
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
});
```

----------------------------------------

TITLE: Making Class Arguments Reactive in Svelte with AI SDK
DESCRIPTION: In Svelte, code within the script block runs only once upon component creation. To ensure arguments passed to class instances like Chat remain reactive and update with changes (e.g., from $props), you must pass them by reference, typically using a getter function, rather than by value. This is crucial for dynamic parameters, though less common for static ones like onError handlers.
SOURCE: https://v5.ai-sdk.dev/getting-started/svelte

LANGUAGE: Svelte
CODE:
```
<script>

import { Chat } from '@ai-sdk/svelte';

let { id } = $props();

// won't work; the class instance will be created once, `id` will be copied by value, and won't update when $props.id changes
let chat = new Chat({ id });

// will work; passes `id` by reference, so `Chat` always has the latest value
let chat = new Chat({
get id() {
return id;
},
});

</script>
```

----------------------------------------

TITLE: Set up Chat UI with AI SDK's useChat Hook in Vue
DESCRIPTION: This code snippet demonstrates how to set up a basic chat interface in a Nuxt.js application using the `@ai-sdk/vue` package's `useChat` hook. It displays chat messages and provides an input field for user interaction, handling form submission and message rendering.
SOURCE: https://v5.ai-sdk.dev/getting-started/nuxt

LANGUAGE: Vue
CODE:
```
<script setup lang="ts">

import { useChat } from '@ai-sdk/vue';

const { messages, input, handleSubmit } = useChat();

</script>

<template>

<div>

<div

v-for="m in messages"

:key="m.id ? m.id : index"

>

{{ m.role === 'user' ? 'User: ' : 'AI: ' }}

<div v-for="part in m.parts" :key="part.id">

<div v-if="part.type === 'text'">{{ part.text }}</div>

</div>

</div>

<form @submit="handleSubmit">

<input

v-model="input"

placeholder="Say something..."

/>

</form>

</div>

</template>
```

----------------------------------------

TITLE: Client-Side Error Boundary for Streamed UI
DESCRIPTION: This client component shows how to consume streamed UI from a server action. It utilizes a React Error Boundary to wrap the `streamedUI` component, ensuring that any rendering errors or errors propagated from the server-side `streamableUI.error()` method are gracefully caught and displayed to the user, preventing application crashes.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/error-handling

LANGUAGE: TypeScript
CODE:
```
import { getStreamedUI } from '@/actions';

import { useState } from 'react';

import { ErrorBoundary } from './ErrorBoundary';

export default function Page() {

const [streamedUI, setStreamedUI] = useState(null);

return (

<div>

<button

onClick={async () => {

const newUI = await getStreamedUI();

setStreamedUI(newUI);

}}

>

What does the new UI look like?

</button>

<ErrorBoundary>{streamedUI}</ErrorBoundary>

</div>

);

}
```

----------------------------------------

TITLE: AI SDK Core ModelMessage API Reference
DESCRIPTION: Detailed API documentation for the `ModelMessage` structure and all its constituent types and interfaces within AI SDK Core. This section defines the various roles a message can have (system, user, assistant, tool) and the different content parts that can be included in these messages, such as text, images, files, tool calls, and tool results.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/model-message

LANGUAGE: TypeScript
CODE:
```
type SystemModelMessage = {
  role: 'system';
  content: string;
};
```

LANGUAGE: TypeScript
CODE:
```
type UserModelMessage = {
  role: 'user';
  content: UserContent;
};

type UserContent = string | Array<TextPart | ImagePart | FilePart>;
```

LANGUAGE: TypeScript
CODE:
```
type AssistantModelMessage = {
  role: 'assistant';
  content: AssistantContent;
};

type AssistantContent = string | Array<TextPart | ToolCallPart>;
```

LANGUAGE: TypeScript
CODE:
```
type ToolModelMessage = {
  role: 'tool';
  content: ToolContent;
};

type ToolContent = Array<ToolResultPart>;
```

LANGUAGE: TypeScript
CODE:
```
export interface TextPart {
  type: 'text';
  /**
   * The text content.
   */
  text: string;
}
```

LANGUAGE: TypeScript
CODE:
```
export interface ImagePart {
  type: 'image';
  /**
   * Image data. Can either be:
   * - data: a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer
   * - URL: a URL that points to the image
   */
  image: DataContent | URL;
  /**
   * Optional IANA media type of the image.
   * We recommend leaving this out as it will be detected automatically.
   */
  mediaType?: string;
}
```

LANGUAGE: TypeScript
CODE:
```
export interface FilePart {
  type: 'file';
  /**
   * File data. Can either be:
   * - data: a base64-encoded string, a Uint8Array, an ArrayBuffer, or a Buffer
   * - URL: a URL that points to the file
   */
  data: DataContent | URL;
  /**
   * Optional filename of the file.
   */
  filename?: string;
  /**
   * IANA media type of the file.
   */
  mediaType: string;
}
```

LANGUAGE: TypeScript
CODE:
```
export interface ToolCallPart {
  type: 'tool-call';
  /**
   * ID of the tool call. This ID is used to match the tool call with the tool result.
   */
  toolCallId: string;
  /**
   * Name of the tool that is being called.
   */
  toolName: string;
  /**
   * Arguments of the tool call. This is a JSON-serializable object that matches the tool's input schema.
   */
  args: unknown;
}
```

LANGUAGE: TypeScript
CODE:
```
export interface ToolResultPart {
  type: 'tool-result';
  /**
   * ID of the tool call that this result is associated with.
   */
  toolCallId: string;
  /**
   * Name of the tool that generated this result.
   */
  toolName: string;
  /**
   * Result of the tool call. This is a JSON-serializable object.
   */
  result: unknown;
  /**
   * Multi-part content of the tool result. Only for tools that support multipart results.
   */
  experimental_content?: ToolResultContent;
  /**
   * Optional flag if the result is an error or an error message.
   */
  isError?: boolean;
}
```

----------------------------------------

TITLE: Flight Booking Conversation - With Contact Lookup
DESCRIPTION: Illustrates an improved flight booking conversation where a 'lookupContacts' tool is used to automatically retrieve passenger details, allowing the model to proceed with booking without additional user prompts.
SOURCE: https://v5.ai-sdk.dev/advanced/multistep-interfaces

LANGUAGE: Conversation
CODE:
```
User: I want to book a flight from New York to London.

Tool: searchFlights("New York", "London")

Model: Here are the available flights from New York to London.

User: I want to book flight number BA123 on 12th December for myself an my wife.

Tool: lookupContacts() -> ["John Doe", "Jane Doe"]

Tool: bookFlight("BA123", "12th December", ["John Doe", "Jane Doe"])

Model: Your flight has been booked!
```

----------------------------------------

TITLE: AI SDK LanguageModelV2Middleware and simulateReadableStream API Reference
DESCRIPTION: This section describes the key methods of the `LanguageModelV2Middleware` interface used for intercepting and modifying language model calls within the AI SDK. It details the purpose and behavior of `wrapGenerate` for non-streaming calls and `wrapStream` for streaming calls, along with the `simulateReadableStream` utility for replaying cached stream responses.
SOURCE: https://v5.ai-sdk.dev/advanced/caching

LANGUAGE: APIDOC
CODE:
```
LanguageModelV2Middleware:
  wrapGenerate({ doGenerate, params }):
    Purpose: Intercepts and caches responses for non-streaming language model calls (e.g., generateText, generateObject).
    Behavior: Checks cache for 'params'. If found, returns cached result. Otherwise, calls 'doGenerate', caches the result, and returns it.
  wrapStream({ doStream, params }):
    Purpose: Intercepts and caches stream parts for streaming language model calls (e.g., streamText, streamObject).
    Behavior: Checks cache for 'params'. If found, returns a simulated ReadableStream using 'simulateReadableStream' with cached parts. Otherwise, calls 'doStream', pipes the stream through a TransformStream to capture all chunks, caches the full response, and returns the original stream.
simulateReadableStream(options: {
  initialDelayInMs: number,
  chunkDelayInMs: number,
  chunks: LanguageModelV2StreamPart[]
}): ReadableStream
  Purpose: Creates a simulated ReadableStream from an array of chunks, useful for replaying cached stream responses.
  Parameters:
    initialDelayInMs: Initial delay before the first chunk is yielded.
    chunkDelayInMs: Delay between subsequent chunks.
    chunks: An array of LanguageModelV2StreamPart objects to be yielded by the stream.
```

----------------------------------------

TITLE: React Component for Displaying Flight Search Results
DESCRIPTION: This React component, `Flights`, takes an array of flight objects and renders them as clickable elements. When a flight number is clicked, it triggers the `lookupFlight` tool via `submitUserMessage` from `@ai-sdk/rsc`, updating the UI state with new messages based on the flight lookup results.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/multistep-interfaces

LANGUAGE: TypeScript
CODE:
```
import { useActions, useUIState } from '@ai-sdk/rsc';

import { ReactNode } from 'react';

interface FlightsProps {
  flights: { id: string; flightNumber: string }[];
}

export const Flights = ({ flights }: FlightsProps) => {
  const { submitUserMessage } = useActions();
  const [_, setMessages] = useUIState();

  return (
    <div>
      {flights.map(result => (
        <div key={result.id}>
          <div
            onClick={async () => {
              const display = await submitUserMessage(
                `lookupFlight ${result.flightNumber}`,
              );
              setMessages((messages: ReactNode[]) => [...messages, display]);
            }}
          >
            {result.flightNumber}
          </div>
        </div>
      ))}
    </div>
  );
};
```

----------------------------------------

TITLE: Generate an enum value using AI SDK streamObject
DESCRIPTION: Demonstrates how to force a language model to generate a specific enum value from a predefined list. It uses `streamObject` with `output: 'enum'` and provides the possible values in the `enum` parameter for classification tasks.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-object

LANGUAGE: TypeScript
CODE:
```
import { streamObject } from 'ai';

const { partialObjectStream } = streamObject({
  model: yourModel,
  output: 'enum',
  enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi'],
  prompt:
    'Classify the genre of this movie plot: ' +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."'
});
```

----------------------------------------

TITLE: AI SDK generateSpeech API Signature
DESCRIPTION: Detailed API documentation for the `generateSpeech` function, outlining its parameters (model, text, voice, outputFormat, instructions, speed, providerOptions, maxRetries, abortSignal, headers) and the structure of its return type (`GeneratedAudioFile` with base64, uint8Array, mimeType, format, warnings, responses, and nested `SpeechModelResponseMetadata`).
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-speech

LANGUAGE: APIDOC
CODE:
```
generateSpeech(parameters): GeneratedAudioFile
  Parameters:
    model: SpeechModelV2
      Description: The speech model to use.
    text: string
      Description: The text to generate the speech from.
    voice?: string
      Description: The voice to use for the speech.
    outputFormat?: string
      Description: The output format to use for the speech e.g. "mp3", "wav", etc.
    instructions?: string
      Description: Instructions for the speech generation.
    speed?: number
      Description: The speed of the speech generation.
    providerOptions?: Record<string, Record<string, JSONValue>>
      Description: Additional provider-specific options.
    maxRetries?: number
      Description: Maximum number of retries. Default: 2.
    abortSignal?: AbortSignal
      Description: An optional abort signal to cancel the call.
    headers?: Record<string, string>
      Description: Additional HTTP headers for the request.
  Returns:
    audio: GeneratedAudioFile
      Description: The generated audio.
      GeneratedAudioFile:
        base64: string
          Description: Audio as a base64 encoded string.
        uint8Array: Uint8Array
          Description: Audio as a Uint8Array.
        mimeType: string
          Description: MIME type of the audio (e.g. "audio/mpeg").
        format: string
          Description: Format of the audio (e.g. "mp3").
        warnings: SpeechWarning[]
          Description: Warnings from the model provider (e.g. unsupported settings).
        responses: Array<SpeechModelResponseMetadata>
          Description: Response metadata from the provider. There may be multiple responses if we made multiple calls to the model.
          SpeechModelResponseMetadata:
            timestamp: Date
              Description: Timestamp for the start of the generated response.
            modelId: string
              Description: The ID of the response model that was used to generate the response.
            body?: unknown
              Description: Optional response body.
            headers?: Record<string, string>
              Description: Response headers.
```

----------------------------------------

TITLE: Generating Enum Values with AI SDK
DESCRIPTION: To generate a specific enum value, such as for classification tasks, set the output strategy to 'enum' and provide a list of possible values in the 'enum' parameter. This output type is exclusively available with the `generateObject` function.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-structured-data

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';

const { object } = await generateObject({
  model: yourModel,
  output: 'enum',
  enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi'],
  prompt:
    'Classify the genre of this movie plot: ' +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."',
});
```

----------------------------------------

TITLE: Generate Multiple Images using AI SDK
DESCRIPTION: Shows how to generate multiple images in a single call using the `n` parameter with the `generateImage` function. The AI SDK automatically handles batching requests to meet model limits.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/image-generation

LANGUAGE: TypeScript
CODE:
```
import { experimental_generateImage as generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
const { images } = await generateImage({
model: openai.image('dall-e-2'),
prompt: 'Santa Claus driving a Cadillac',
n: 4, // number of images to generate
});
```

----------------------------------------

TITLE: Slogan Generator Prompt Example
DESCRIPTION: An example prompt demonstrating how to generate creative slogans for businesses by providing a few-shot learning setup. This prompt is designed to be used with a language model, where the 'Temperature' setting influences the diversity of the generated slogans.
SOURCE: https://v5.ai-sdk.dev/advanced/prompt-engineering

LANGUAGE: Prompt
CODE:
```
Business: Bookstore with cats
Slogans: "Purr-fect Pages", "Books and Whiskers", "Novels and Nuzzles"
Business: Gym with rock climbing
Slogans: "Peak Performance", "Reach New Heights", "Climb Your Way Fit"
Business: Coffee shop with live music
Slogans:
```

----------------------------------------

TITLE: Migrate Experimental AI Function Exports to Stable Versions
DESCRIPTION: Experimental AI functions like `experimental_generateText`, `experimental_streamText`, `experimental_generateObject`, and `experimental_streamObject` have been removed. Use their stable, non-prefixed versions instead.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-4-0

LANGUAGE: AI SDK 3.4
CODE:
```
import {
experimental_generateText,
experimental_streamText,
experimental_generateObject,
experimental_streamObject,
} from 'ai';
```

LANGUAGE: AI SDK 4.0
CODE:
```
import { generateText, streamText, generateObject, streamObject } from 'ai';
```

----------------------------------------

TITLE: Send Assistant Message with Simple Text Content
DESCRIPTION: Demonstrates how to include a simple text string as an assistant message in the conversation history. Assistant messages typically represent previous model responses.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
  model: yourModel,
  messages: [
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hello, how can I help?' },
  ],
});
```

----------------------------------------

TITLE: Remove experimental_Provider and Registries in AI SDK
DESCRIPTION: In AI SDK 4.0, the `experimental_Provider` interface, `experimental_ProviderRegistry` interface, and `experimental_ModelRegistry` interface have been removed. Use the `Provider` interface instead.
SOURCE: https://v5.ai-sdk.dev/migration-guides/migration-guide-4-0

LANGUAGE: TypeScript
CODE:
```
import { experimental_Provider, experimental_ProviderRegistry } from 'ai';
```

LANGUAGE: TypeScript
CODE:
```
import { Provider } from 'ai';
```

----------------------------------------

TITLE: Integrate `generateQuery` into Frontend `handleSubmit` Function
DESCRIPTION: Updates the `handleSubmit` function in `app/page.tsx` to call the `generateQuery` Server Action with user input. This snippet demonstrates how to manage loading states, display the generated SQL query, and then execute it using `runGeneratedSQLQuery` to fetch and display results.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: TypeScript
CODE:
```
/* ...other imports... */

import { runGeneratedSQLQuery, generateQuery } from './actions';

/* ...rest of the file... */

const handleSubmit = async (suggestion?: string) => {
clearExistingData();
const question = suggestion ?? inputValue;
if (inputValue.length === 0 && !suggestion) return;
if (question.trim()) {
setSubmitted(true);
}
setLoading(true);
setLoadingStep(1);
setActiveQuery('');
try {
const query = await generateQuery(question);
if (query === undefined) {
toast.error('An error occurred. Please try again.');
setLoading(false);
return;
}
setActiveQuery(query);
setLoadingStep(2);
const companies = await runGeneratedSQLQuery(query);
const columns = companies.length > 0 ? Object.keys(companies[0]) : [];
setResults(companies);
setColumns(columns);
setLoading(false);
} catch (e) {
toast.error('An error occurred. Please try again.');
setLoading(false);
}
};
```

----------------------------------------

TITLE: Stream and Update Custom Data Parts from Server (JavaScript)
DESCRIPTION: Illustrates how to use createUIMessageStream to send arbitrary, type-safe data from the server to the client. It shows initial data streaming and subsequent updates to the same part using a unique ID.
SOURCE: https://v5.ai-sdk.dev/announcing-ai-sdk-5-alpha

LANGUAGE: JavaScript
CODE:
```
// On the server
const stream = createUIMessageStream({
execute: writer => {
// Initial update
writer.write({
type: 'data-weather', // Custom type
id: toolCallId, // ID for updates
data: { city, status: 'loading' }, // Your data
});
// Later, update the same part
writer.write({
type: 'data-weather',
id: toolCallId,
data: { city, weather, status: 'success' },
});
},
});
```

----------------------------------------

TITLE: Transcribe Audio using AI SDK Core with OpenAI
DESCRIPTION: This snippet demonstrates how to use the experimental `transcribe` function from the AI SDK to convert an audio file into text. It utilizes an OpenAI transcription model and reads an audio file from the local filesystem. The `audio` property supports `Uint8Array`, `ArrayBuffer`, `Buffer`, base64 encoded strings, or URLs.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/transcription

LANGUAGE: TypeScript
CODE:
```
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';
import { readFile } from 'fs/promises';

const transcript = await transcribe({
  model: openai.transcription('whisper-1'),
  audio: await readFile('audio.mp3'),
});
```

----------------------------------------

TITLE: APIDOC: Chat Management Functions and Properties
DESCRIPTION: Provides a collection of functions and properties for managing chat interactions, including sending messages, reloading responses, controlling API requests, updating local message state, and handling user input.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-chat

LANGUAGE: APIDOC
CODE:
```
append: (message: Message | CreateMessage, options?: ChatRequestOptions) => Promise<string | undefined>
  Function to append a message to the chat, triggering an API call for the AI response. It returns a promise that resolves to full response message content when the API call is successfully finished, or throws an error when the API call fails.
reload: (options?: ChatRequestOptions) => Promise<string | undefined>
  Function to reload the last AI chat response for the given chat history. If the last message isn't from the assistant, it will request the API to generate a new response.
stop: () => void
  Function to abort the current API request.
experimental_resume: () => void
  Function to resume an ongoing chat generation stream.
setMessages: (messages: Message[] | ((messages: Message[]) => Message[]) => void
  Function to update the `messages` state locally without triggering an API call.
input: string
  The current value of the input field.
setInput: React.Dispatch<React.SetStateAction<string>>
  Function to update the `input` value.
handleInputChange: (event: any) => void
  Handler for the `onChange` event of the input field to control the input's value.
handleSubmit: (event?: { preventDefault?: () => void }, options?: ChatRequestOptions) => void
  Form submission handler that automatically resets the input field and appends a user message. You can use the `options` parameter to send additional data, headers and more to the server.
```

----------------------------------------

TITLE: Server-side API Route for Tool Call Streaming
DESCRIPTION: This Next.js API route demonstrates how to enable real-time streaming of partial tool calls from the server. By setting toolCallStreaming: true in the streamText function, the server can send intermediate tool invocation states, allowing for more dynamic client-side UI updates during tool execution.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-with-tool-calling

LANGUAGE: TypeScript
CODE:
```
export async function POST(req: Request) {

const { messages }: { messages: UIMessage[] } = await req.json();

const result = streamText({

model: openai('gpt-4o'),

messages: convertToModelMessages(messages),

toolCallStreaming: true,

// ...

});

return result.toUIMessageStreamResponse();

}
```

----------------------------------------

TITLE: Convert to Streamed UI Message Response
DESCRIPTION: Converts the stream result into a standard `Response` object that contains a UI message stream. This method provides options to configure the HTTP response status code, status text, and headers.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
toUIMessageStreamResponse: (options?: ResponseInit & UIMessageStreamOptions) => Response
  Converts the result to a streamed response object with a UI message stream.
ResponseInit & UIMessageStreamOptions
  status?: number
    The response status code.
  statusText?: string
    The response status text.
  headers?: HeadersInit
    The response headers.
```

----------------------------------------

TITLE: AI SDK Core: generateImage() API Reference
DESCRIPTION: Detailed API documentation for the `generateImage` function, outlining its parameters, their types, descriptions, and the structure of the returned `GeneratedFile` objects, along with other response properties like warnings and provider metadata.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-image

LANGUAGE: APIDOC
CODE:
```
generateImage(
  model: ImageModelV2, // The image model to use.
  prompt: string, // The input prompt to generate the image from.
  n?: number, // Number of images to generate.
  size?: string, // Size of the images to generate. Format: {width}x{height}.
  aspectRatio?: string, // Aspect ratio of the images to generate. Format: {width}:{height}.
  seed?: number, // Seed for the image generation.
  providerOptions?: ProviderOptions, // Additional provider-specific options.
  maxRetries?: number, // Maximum number of retries. Default: 2.
  abortSignal?: AbortSignal, // An optional abort signal to cancel the call.
  headers?: Record<string, string> // Additional HTTP headers for the request.
): {
  image: GeneratedFile, // The first image that was generated.
  images: Array<GeneratedFile>, // All images that were generated.
  warnings: ImageGenerationWarning[], // Warnings from the model provider (e.g. unsupported settings).
  providerMetadata?: ImageModelProviderMetadata, // Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. An `images` key is always present in the metadata and is an array with the same length as the top level `images` key. Details depend on the provider.
  responses: Array<ImageModelResponseMetadata> // Response metadata from the provider. There may be multiple responses if we made multiple calls to the model.
}

Type Definitions:
  GeneratedFile:
    base64: string // Image as a base64 encoded string.
    uint8Array: Uint8Array // Image as a Uint8Array.
    mediaType: string // The IANA media type of the image.

  ImageModelResponseMetadata:
    timestamp: Date // Timestamp for the start of the generated response.
    modelId: string // The ID of the response model that was used to generate the response.
    headers?: Record<string, string> // Response headers.
```

----------------------------------------

TITLE: Client-side Chat Component with Stream Resumption
DESCRIPTION: This code demonstrates how to integrate the `experimental_resume` function from the `@ai-sdk/react` `useChat` hook into a React component. It shows how to call `experimental_resume` during the initial mount of the component to automatically resume an ongoing chat stream, which is useful for maintaining long conversations or recovering from network interruptions.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot-message-persistence

LANGUAGE: tsx
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions, type UIMessage } from 'ai';

import { useEffect } from 'react';

export function Chat({
chatId,
autoResume,
initialMessages = [],
}: {
chatId: string;
autoResume: boolean;
initialMessages: UIMessage[];
}) {
const {
experimental_resume,
// ... other useChat returns
} = useChat({
chatId,
chatStore: defaultChatStoreOptions({
api: '/api/chat',
chats: {
[chatId]: {
messages: initialMessages,
},
},
}),
});

useEffect(() => {
if (autoResume) {
experimental_resume();
}
// We want to disable the exhaustive deps rule here because we only want to run this effect once
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

return <div>{/* Your chat UI here */}</div>;
}
```

----------------------------------------

TITLE: Tool Input Schema Definition
DESCRIPTION: Defines the expected schema for tool inputs, which the language model uses for generation and validation. Supports Zod or JSON Schema.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
parameters:
  Zod Schema | JSON Schema
  The schema of the input that the tool expects. The language model will use this to generate the input. It is also used to validate the output of the language model. Use descriptions to make the input understandable for the language model. You can either pass in a Zod schema or a JSON schema (using the `jsonSchema` function).
```

----------------------------------------

TITLE: API: jsonSchema() helper function
DESCRIPTION: Creates AI SDK compatible JSON schema objects.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core

LANGUAGE: APIDOC
CODE:
```
jsonSchema(): Creates AI SDK compatible JSON schema objects.
```

----------------------------------------

TITLE: React Component Example for experimental_useObject
DESCRIPTION: This React component demonstrates how to use the `experimental_useObject` hook to generate and display streamed JSON content. It sets up an API endpoint and a Zod schema for parsing the incoming object, and includes a button to trigger content generation.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/use-object

LANGUAGE: React
CODE:
```
'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';

export default function Page() {
  const { object, submit } = useObject({
    api: '/api/use-object',
    schema: z.object({ content: z.string() }),
  });

  return (
    <div>
      <button onClick={() => submit('example input')}>Generate</button>
      {object?.content && <p>{object.content}</p>}
    </div>
  );
}
```

----------------------------------------

TITLE: Stream Llama 3.1 Response with AI SDK Core
DESCRIPTION: To handle long responses or provide real-time user feedback, this snippet demonstrates how to stream the model's output using the `streamText` function from the AI SDK. It shows the setup for streaming text from the Llama 3.1 model via DeepInfra.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: TypeScript
CODE:
```
import { streamText } from 'ai';

import { deepinfra } from '@ai-sdk/deepinfra';

const { textStream } = streamText({

model: deepinfra('meta-llama/Meta-Llama-3.1-405B-Instruct'),

prompt: 'What is love?',

});
```

----------------------------------------

TITLE: Implement Chat UI Error Handling with AI SDK
DESCRIPTION: This snippet illustrates how to manage and display error states in the chat UI using the `error` property from the `useChat` hook. It shows how to render a generic error message and provide a "Retry" button to reload the conversation.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: typescript
CODE:
```
'use client';

import { useChat } from '@ai-sdk/react';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit, error, reload } =

useChat({});

return (

<div>

{messages.map(m => (

<div key={m.id}>

{m.role}:{' '}

{m.parts.map((part, index) =>

part.type === 'text' ? <span key={index}>{part.text}</span> : null,

)}

</div>

))}

{error && (

<>

<div>An error occurred.</div>

<button type="button" onClick={() => reload()}>

Retry

</button>

</>

)}

<form onSubmit={handleSubmit}>

<input

value={input}

onChange={handleInputChange}

disabled={error != null}

/>

</form>

</div>

);

}
```

----------------------------------------

TITLE: Generate Text with OpenAI Model in AI SDK
DESCRIPTION: Demonstrates how to use the `generateText` function with an OpenAI model to invent a new holiday and describe its traditions. This snippet shows basic text generation for non-interactive use cases.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-text

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Invent a new holiday and describe its traditions.',
});
console.log(text);
```

----------------------------------------

TITLE: Close MCP Client with Try/Finally for Non-Streaming
DESCRIPTION: Illustrates how to ensure the MCP client is closed using a `try/finally` block for non-streaming response generation, or within framework cleanup functions, to guarantee resource release.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: typescript
CODE:
```
let mcpClient: MCPClient | undefined;
try {
mcpClient = await experimental_createMCPClient({
// ...
});
} finally {
await mcpClient?.close();
}
```

----------------------------------------

TITLE: Access Generated Image Data in Base64 or Uint8Array
DESCRIPTION: After generating an image, this snippet shows how to access the image data. The `image` object returned by `generateImage` provides properties to retrieve the image as a base64 encoded string or as a Uint8Array.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/image-generation

LANGUAGE: TypeScript
CODE:
```
const base64 = image.base64; // base64 image data
const uint8Array = image.uint8Array; // Uint8Array image data
```

----------------------------------------

TITLE: Call OpenAI GPT-4.5 with AI SDK Core
DESCRIPTION: This snippet demonstrates how to use the AI SDK Core's `generateText` function to call the OpenAI GPT-4.5 model and generate text output. It abstracts away provider-specific complexities, providing a unified API for LLM interaction.
SOURCE: https://v5.ai-sdk.dev/guides/gpt-4-5

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text } = await generateText({
model: openai('gpt-4.5-preview'),
prompt: 'Explain the concept of quantum entanglement.',
});
```

----------------------------------------

TITLE: Handle Transcription Errors with AI SDK
DESCRIPTION: When `transcribe` cannot generate a valid transcript, it throws a `AI_NoTranscriptGeneratedError`. This error can arise for any the following reasons: The model failed to generate a response, The model generated a response that could not be parsed. The error preserves the following information to help you log the issue: `responses`: Metadata about the transcription model responses, including timestamp, model, and headers. `cause`: The cause of the error. You can use this for more detailed error handling.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/transcription

LANGUAGE: javascript
CODE:
```
import {
experimental_transcribe as transcribe,
NoTranscriptGeneratedError,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { readFile } => 'fs/promises';

try {
await transcribe({
model: openai.transcription('whisper-1'),
audio: await readFile('audio.mp3'),
});
} catch (error) {
if (NoTranscriptGeneratedError.isInstance(error)) {
console.log('NoTranscriptGeneratedError');
console.log('Cause:', error.cause);
console.log('Responses:', error.responses);
}
}
```

----------------------------------------

TITLE: Example: Using createDataStream
DESCRIPTION: Demonstrates how to use `createDataStream` to write data, add annotations, and merge other streams within an asynchronous `execute` function, including custom error handling.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/create-data-stream

LANGUAGE: javascript
CODE:
```
const stream = createDataStream({
async execute(dataStream) {
// Write data
dataStream.writeData({ value: 'Hello' });
// Write annotation
dataStream.writeMessageAnnotation({ type: 'status', value: 'processing' });
// Merge another stream
const otherStream = getAnotherStream();
dataStream.merge(otherStream);
},
onError: error => `Custom error: ${error.message}`,
});
```

----------------------------------------

TITLE: Implement onStepFinish Callback in AI SDK Text Generation
DESCRIPTION: The `onStepFinish` callback is triggered when a step in `generateText` or `streamText` completes, providing access to the step's text, tool calls, tool results, finish reason, and usage. This allows for custom logic like saving chat history or recording usage after each step.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';

const result = await generateText({
  // ...
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    // your own logic, e.g. for saving the chat history or recording usage
  },
});
```

----------------------------------------

TITLE: Example: Pipe Data Stream to Server Response
DESCRIPTION: This example demonstrates how to use `pipeDataStreamToResponse` to send data, annotations, and merge other streams into a Node.js `ServerResponse`. It shows the structure for `execute` and `onError` callbacks.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-ui/pipe-data-stream-to-response

LANGUAGE: JavaScript
CODE:
```
pipeDataStreamToResponse(serverResponse, {
status: 200,
statusText: 'OK',
headers: {
'Custom-Header': 'value',
},
async execute(dataStream) {
// Write data
dataStream.writeData({ value: 'Hello' });
// Write annotation
dataStream.writeMessageAnnotation({ type: 'status', value: 'processing' });
// Merge another stream
const otherStream = getAnotherStream();
dataStream.merge(otherStream);
},
onError: error => `Custom error: ${error.message}`,
});
```

----------------------------------------

TITLE: Load Chats: AI SDK UI `useChat` with `initialMessages`
DESCRIPTION: Illustrates how to initialize the `useChat` hook in a client-side React component with `initialMessages` passed as props. This allows the chat interface to display pre-loaded messages from a database upon component mounting.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-rsc/migrating-to-ui

LANGUAGE: TypeScript
CODE:
```
'use client';

import { Message } from 'ai';
import { useChat } from '@ai-sdk/react';

export function Chat({
  id,
  initialMessages,
}: {
  id;
  initialMessages: Array<Message>;
}) {
  const { messages } = useChat({
    id,
    initialMessages,
  });

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role}</div>
          <div>{message.content}</div>
        </div>
      ))}
    </div>
  );
}
```

----------------------------------------

TITLE: AI SDK UI Features and Framework Compatibility
DESCRIPTION: Details the key features of AI SDK UI for building production-ready AI-native applications and its compatibility with popular frontend frameworks like React, Svelte, and Vue.js, including a comparison of supported functions.
SOURCE: https://v5.ai-sdk.dev/getting-started/navigating-the-library

LANGUAGE: APIDOC
CODE:
```
AI SDK UI Features:
* Full support for streaming chat and client-side generative UI
* Utilities for handling common AI interaction patterns (i.e. chat, completion, assistant)
* Production-tested reliability and performance
* Compatibility across popular frameworks

AI SDK UI Supported Functions by Framework:
  Function: useChat
    React: Supported
    Svelte: Supported (Contributions welcome for missing features)
    Vue.js: Supported (Contributions welcome for missing features)
  Function: useChat tool calling
    React: Supported
    Svelte: Supported (Contributions welcome for missing features)
    Vue.js: Supported (Contributions welcome for missing features)
  Function: useCompletion
    React: Supported
    Svelte: Supported (Contributions welcome for missing features)
    Vue.js: Supported (Contributions welcome for missing features)
  Function: useObject
    React: Supported
    Svelte: Supported (Contributions welcome for missing features)
    Vue.js: Supported (Contributions welcome for missing features)
```

----------------------------------------

TITLE: AI SDK UI Hooks and AI SDK RSC Functions Overview
DESCRIPTION: Overview of key functions and hooks provided by AI SDK UI and AI SDK RSC for building interactive AI interfaces, including real-time chat, text completions, streamed JSON, and dynamic React component streaming.
SOURCE: https://v5.ai-sdk.dev/guides/llama-3_1

LANGUAGE: APIDOC
CODE:
```
AI SDK UI Hooks:
- useChat: Incorporates real-time chat capabilities.
- useCompletion: Provides text completions.
- useObject: Enables streamed JSON and interactive assistant features.

AI SDK RSC Functions:
- streamUI: Dynamically stream React components from the server to the client.
```

----------------------------------------

TITLE: Handling AI SDK Tool-Related Errors with generateText
DESCRIPTION: Provides an example of how to use a `try`/`catch` block to handle specific tool-call related errors thrown by the `generateText` function, such as `NoSuchToolError`, `InvalidToolArgumentsError`, and `ToolExecutionError`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: TypeScript
CODE:
```
try {
const result = await generateText({
//...
});
} catch (error) {
if (NoSuchToolError.isInstance(error)) {
// handle the no such tool error
} else if (InvalidToolArgumentsError.isInstance(error)) {
// handle the invalid tool arguments error
} else if (ToolExecutionError.isInstance(error)) {
// handle the tool execution error
} else {
// handle other errors
}
}
```

----------------------------------------

TITLE: LanguageModelV2Middleware API Reference
DESCRIPTION: This API documentation details the LanguageModelV2Middleware interface, outlining its core methods: transformParams, wrapGenerate, and wrapStream. These methods allow for intercepting and modifying language model operations, providing hooks for custom logic like parameter transformation or wrapping generation and streaming processes.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/language-model-v2-middleware

LANGUAGE: APIDOC
CODE:
```
transformParams:
  ({ type: "generate" | "stream", params: LanguageModelV2CallOptions }) => Promise<LanguageModelV2CallOptions>
  Transforms the parameters before they are passed to the language model.

wrapGenerate:
  ({ doGenerate: DoGenerateFunction, params: LanguageModelV2CallOptions, model: LanguageModelV2 }) => Promise<DoGenerateResult>
  Wraps the generate operation of the language model.

wrapStream:
  ({ doStream: DoStreamFunction, params: LanguageModelV2CallOptions, model: LanguageModelV2 }) => Promise<DoStreamResult>
  Wraps the stream operation of the language model.
```

----------------------------------------

TITLE: Contextual Meal Log Update with Tool Interaction
DESCRIPTION: This example illustrates the importance of application context in multistep interfaces. It shows how a language model can reference previous actions (logging a meal) to correctly infer parameters for a subsequent action (deleting the meal), even when the user's request is indirect, thereby maintaining a coherent conversation flow.
SOURCE: https://v5.ai-sdk.dev/advanced/multistep-interfaces

LANGUAGE: Tool Interaction
CODE:
```
User: Log a chicken shawarma for lunch.

Tool: log_meal("chicken shawarma", "250g", "12:00 PM")

Model: Chicken shawarma has been logged for lunch.

...

...

User: I skipped lunch today, can you update my log?

Tool: delete_meal("chicken shawarma")

Model: Chicken shawarma has been deleted from your log.
```

----------------------------------------

TITLE: Control Tool Selection with toolChoice in AI SDK
DESCRIPTION: The `toolChoice` setting allows fine-grained control over when and which tools the model calls. Options include `auto` (default), `required`, `none`, or specifying a particular tool by name. This example demonstrates forcing the model to call a tool using `toolChoice: 'required'`.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { z } from 'zod';
import { generateText, tool } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    weather: tool({
      description: 'Get the weather in a location',
      parameters: z.object({
        location: z.string().describe('The location to get the weather for'),
      }),
      execute: async ({ location }) => ({
        location,
        temperature: 72 + Math.floor(Math.random() * 21) - 10,
      }),
    }),
  },
  toolChoice: 'required', // force the model to call a tool
  prompt: 'What is the weather in San Francisco?',
});
```

----------------------------------------

TITLE: Accessing Transcription Properties in AI SDK Core
DESCRIPTION: After transcribing audio, this snippet shows how to access various properties of the `transcript` object, including the full transcribed text, an array of segments with timestamps, the detected language, and the audio duration in seconds.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/transcription

LANGUAGE: TypeScript
CODE:
```
const text = transcript.text; // transcript text e.g. "Hello, world!"
const segments = transcript.segments; // array of segments with start and end times, if available
const language = transcript.language; // language of the transcript e.g. "en", if available
const durationInSeconds = transcript.durationInSeconds; // duration of the transcript in seconds, if available
```

----------------------------------------

TITLE: Generate Enum Value using AI SDK
DESCRIPTION: Shows how to constrain the language model's output to a specific set of predefined enum values, useful for classification tasks like categorizing movie genres.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-object

LANGUAGE: TypeScript
CODE:
```
import { generateObject } from 'ai';

const { object } = await generateObject({
model: yourModel,
output: 'enum',
enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi'],
prompt:
'Classify the genre of this movie plot: ' +
'"A group of astronauts travel through a wormhole in search of a ' +
'new habitable planet for humanity."',
});
```

----------------------------------------

TITLE: Displaying Loading State with AI SDK useObject
DESCRIPTION: This example shows how to utilize the `isLoading` state returned by the `useObject` hook to provide user feedback during the object generation process. It demonstrates showing a loading spinner and disabling the submit button while the operation is in progress.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/object-generation

LANGUAGE: JavaScript
CODE:
```
'use client';

import { useObject } from '@ai-sdk/react';

export default function Page() {
const { isLoading, object, submit } = useObject({
api: '/api/notifications',
schema: notificationSchema,
});

return (
<>
{isLoading && <Spinner />}
<button
onClick={() => submit('Messages during finals week.')}
disabled={isLoading}
>
Generate notifications
</button>
{object?.notifications?.map((notification, index) => (
<div key={index}>
<p>{notification?.name}</p>
<p>{notification?.message}</p>
</div>
))}
</>
);
}
```

----------------------------------------

TITLE: Send Base64 Encoded Image Content to AI Model (AI SDK)
DESCRIPTION: Shows how to send a base-64 encoded image string to an AI model. The image data is read from a file and converted to a base-64 string before being included in the message.
SOURCE: https://v5.ai-sdk.dev/foundations/prompts

LANGUAGE: JavaScript
CODE:
```
const result = await generateText({
model: yourModel,
messages: [
{
role: 'user',
content: [
{ type: 'text', text: 'Describe the image in detail.' },
{
type: 'image',
image: fs.readFileSync('./data/comic-cat.png').toString('base64'),
},
],
},
],
});
```

----------------------------------------

TITLE: createStreamableValue Function
DESCRIPTION: Allows the creation of a streamable value that can be rendered on the server and streamed to the client.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-rsc

LANGUAGE: APIDOC
CODE:
```
createStreamableValue()
  Description: Create a streamable value that can be rendered on the server and streamed to the client.
```

----------------------------------------

TITLE: TypeScript ToolResultContent Type Definition
DESCRIPTION: Defines the `ToolResultContent` type as an array that can contain either text content (with a `text` property) or image content (with `data` for base64-encoded image and optional `mediaType`). This type is used to represent the output of tool calls in the AI SDK.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/model-message

LANGUAGE: TypeScript
CODE:
```
export type ToolResultContent = Array<
| {
type: 'text';
text: string;
}
| {
type: 'image';
data: string; // base64 encoded png image, e.g. screenshot
mediaType?: string; // e.g. 'image/png';
}
>;
```

----------------------------------------

TITLE: Check for AI_TypeValidationError Instance in TypeScript
DESCRIPTION: This TypeScript code snippet demonstrates how to programmatically check if a given error object is an instance of `AI_TypeValidationError`. This is useful for implementing specific error handling logic based on the type of validation failure.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-errors/ai-type-validation-error

LANGUAGE: TypeScript
CODE:
```
import { TypeValidationError } from 'ai';

if (TypeValidationError.isInstance(error)) {
// Handle the error
}
```

----------------------------------------

TITLE: Enhance Web Search with Query-Specific Metadata in AI SDK
DESCRIPTION: This snippet demonstrates how to provide additional metadata to the `webSearchPreview` tool to refine search results. Parameters like `searchContextSize` and `userLocation` can be specified to improve the relevance and quality of the information retrieved by the model.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { generateText } from 'ai';

const result = await generateText({
model: openai.responses('gpt-4o-mini'),
prompt: 'What happened in San Francisco last week?',
tools: {
web_search_preview: openai.tools.webSearchPreview({
searchContextSize: 'high',
userLocation: {
type: 'approximate',
city: 'San Francisco',
region: 'California',
},
}),
},
});
console.log(result.text);
console.log(result.sources);
```

----------------------------------------

TITLE: Execute Logic on Stream Completion with `onFinish` Callback in AI SDK
DESCRIPTION: The `onFinish` callback for `streamText` executes once the entire stream has concluded. It provides comprehensive details about the stream's outcome, including the full generated text, usage statistics, the finish reason, and the complete list of messages. This is ideal for post-stream processing like saving chat history or recording usage data.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/generating-text

LANGUAGE: TypeScript
CODE:
```
import { streamText } from 'ai';

const result = streamText({
  model: yourModel,
  prompt: 'Invent a new holiday and describe its traditions.',
  onFinish({ text, finishReason, usage, response }) {
    // your own logic, e.g. for saving the chat history or recording usage
    const messages = response.messages; // messages that were generated
  },
});
```

----------------------------------------

TITLE: AI SDK: Render Generated Images in Client UI
DESCRIPTION: This client-side React component demonstrates how to display images generated by AI models. It iterates through message parts, identifies 'file' parts with an 'image/' media type, and renders them as `<img>` tags using a base64 data URI.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-ui/chatbot

LANGUAGE: JSX
CODE:
```
messages.map(message => (
  <div key={message.id}>
    {message.role === 'user' ? 'User: ' : 'AI: '}
    {message.parts.map((part, index) => {
      if (part.type === 'text') {
        return <div key={index}>{part.text}</div>;
      } else if (part.type === 'file' && part.mediaType.startsWith('image/')) {
        return (
          <img key={index} src={`data:${part.mediaType};base64,${part.data}`} />
        );
      }
    })}
  </div>
));
```

----------------------------------------

TITLE: Example: Convert LlamaIndex ChatEngine Stream to AI SDK Response
DESCRIPTION: Illustrates creating an API route that uses LlamaIndex's `SimpleChatEngine` to generate a stream and converts it into an AI SDK data stream response using `toDataStreamResponse`.
SOURCE: https://v5.ai-sdk.dev/reference/stream-helpers/llamaindex-adapter

LANGUAGE: TypeScript
CODE:
```
import { OpenAI, SimpleChatEngine } from 'llamaindex';

import { toDataStreamResponse } from '@ai-sdk/llamaindex';

export async function POST(req: Request) {
const { prompt } = await req.json();

const llm = new OpenAI({ model: 'gpt-4o' });

const chatEngine = new SimpleChatEngine({ llm });

const stream = await chatEngine.chat({
message: prompt,
stream: true,
});

return toDataStreamResponse(stream);
}
```

----------------------------------------

TITLE: Applying Multiple Middlewares to AI SDK Language Models
DESCRIPTION: This snippet demonstrates how to provide an array of middlewares to the `wrapLanguageModel` function. The middlewares are applied sequentially, with the last middleware in the array wrapping the model first, followed by preceding middlewares.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: javascript
CODE:
```
const wrappedLanguageModel = wrapLanguageModel({
  model: yourModel,
  middleware: [firstMiddleware, secondMiddleware],
});
// applied as: firstMiddleware(secondMiddleware(yourModel))
```

----------------------------------------

TITLE: AI SDK Core API Reference: Configuration, Callbacks, and Response Types
DESCRIPTION: Comprehensive documentation for key types, callbacks, and data structures used in the AI SDK, including configuration options, error handling, finish results, and response metadata, along with details on streaming capabilities.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-object

LANGUAGE: APIDOC
CODE:
```
// Main Configuration/Input Properties
metadata?: Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>
  Description: Additional information to include in the telemetry data.

providerOptions?: Record<string, Record<string, JSONValue>> | undefined
  Description: Provider-specific options. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.

onError?: (event: OnErrorResult) => Promise<void> | void
  Description: Callback that is called when an error occurs during streaming. You can use it to log errors.

onFinish?: (result: OnFinishResult) => void
  Description: Callback that is called when the LLM response has finished.

// Type: OnErrorResult
OnErrorResult:
  error: unknown
    Description: The error that occurred.

// Type: OnFinishResult
OnFinishResult:
  usage: LanguageModelUsage
    Description: The token usage of the generated text.
  inputTokens: number | undefined
    Description: The number of input (prompt) tokens used.
  outputTokens: number | undefined
    Description: The number of output (completion) tokens used.
  totalTokens: number | undefined
    Description: The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.
  reasoningTokens?: number | undefined
    Description: The number of reasoning tokens used.
  cachedInputTokens?: number | undefined
    Description: The number of cached input tokens.
  providerMetadata: ProviderMetadata | undefined
    Description: Optional metadata from the provider. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.
  object: T | undefined
    Description: The generated object (typed according to the schema). Can be undefined if the final object does not match the schema.
  error: unknown | undefined
    Description: Optional error object. This is e.g. a TypeValidationError when the final object does not match the schema.
  warnings: CallWarning[] | undefined
    Description: Warnings from the model provider (e.g. unsupported settings).
  response?: Response
    Description: Response metadata.

// Type: Response
Response:
  id: string
    Description: The response identifier. The AI SDK uses the ID from the provider response when available, and generates an ID otherwise.
  model: string
    Description: The model that was used to generate the response. The AI SDK uses the response model from the provider response when available, and the model from the function call otherwise.
  timestamp: Date
    Description: The timestamp of the response. The AI SDK uses the response timestamp from the provider response when available, and creates a timestamp otherwise.
  headers?: Record<string, string>
    Description: Optional response headers.

// Return Values / Main Response Object Properties (from [Returns] section)
Returns:
  usage: Promise<LanguageModelUsage>
    Description: The token usage of the generated text. Resolved when the response is finished.
  inputTokens: number | undefined
    Description: The number of input (prompt) tokens used.
  outputTokens: number | undefined
    Description: The number of output (completion) tokens used.
  totalTokens: number | undefined
    Description: The total number of tokens as reported by the provider. This number might be different from the sum of inputTokens and outputTokens and e.g. include reasoning tokens or other overhead.
  reasoningTokens?: number | undefined
    Description: The number of reasoning tokens used.
  cachedInputTokens?: number | undefined
    Description: The number of cached input tokens.
  providerMetadata: Promise<Record<string, Record<string, JSONValue>> | undefined>
    Description: Optional metadata from the provider. Resolved when the response is finished. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.
  object: Promise<T>
    Description: The generated object (typed according to the schema). Resolved when the response is finished.
  partialObjectStream: AsyncIterableStream<DeepPartial<T>>
    Description: Stream of partial objects. It gets more complete as the stream progresses. Note that the partial object is not validated. If you want to be certain that the actual content matches your schema, you need to implement your own validation for partial results.
  elementStream: AsyncIterableStream<ELEMENT>
    Description: Stream of array elements. Only available in "array" mode.
  textStream: AsyncIterableStream<string>
    Description: Text stream of the JSON representation of the generated object. It contains text chunks. When the stream is finished, the object is valid JSON that can be parsed.
  fullStream: AsyncIterableStream<ObjectStreamPart<T>>
    Description: Stream of different types of events, including partial objects, errors, and finish events. Only errors that stop the stream, such as network errors, are thrown.

// Type: ObjectPart (part of fullStream)
ObjectPart:
  type: 'object'
  object: DeepPartial<T>
    Description: The partial object that was generated.

// Type: TextDeltaPart (part of fullStream)
TextDeltaPart:
  type: 'text-delta'
  textDelta: string
    Description: The text delta for the underlying raw JSON text.

// Type: ErrorPart (part of fullStream)
ErrorPart:
  type: 'error'
  error: unknown
    Description: The error that occurred.

// Type: FinishPart (part of fullStream)
FinishPart:
  type: 'finish'
  finishReason: FinishReason
  logprobs?: Logprobs
```

----------------------------------------

TITLE: Implement Caching with Language Model Middleware in TypeScript
DESCRIPTION: This example demonstrates how to build a simple in-memory cache for language model generated text using `LanguageModelV2Middleware`. It intercepts `doGenerate` calls to return cached results if available, otherwise it performs the generation and stores the result for future use.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: TypeScript
CODE:
```
import type { LanguageModelV2Middleware } from 'ai';

const cache = new Map<string, any>();

export const yourCacheMiddleware: LanguageModelV2Middleware = {
  wrapGenerate: async ({ doGenerate, params }) => {
    const cacheKey = JSON.stringify(params);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    const result = await doGenerate();
    cache.set(cacheKey, result);
    return result;
  },
  // here you would implement the caching logic for streaming
};
```

----------------------------------------

TITLE: OpenAIStream: Transform OpenAI language model responses to stream
DESCRIPTION: Transforms the raw response from OpenAI's language models into a readable stream, simplifying integration and processing of AI outputs.
SOURCE: https://v5.ai-sdk.dev/reference/stream-helpers

LANGUAGE: APIDOC
CODE:
```
OpenAIStream:
  Transforms the response from OpenAI's language models into a readable stream.
```

----------------------------------------

TITLE: Extract Tool Results from AI SDK generateText Steps
DESCRIPTION: This snippet demonstrates how to use `flatMap` to extract all tool calls from the `steps` array returned by `generateText`. It's useful for aggregating all tool interactions across a multi-step generation process.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/tools-and-tool-calling

LANGUAGE: javascript
CODE:
```
import { generateText } from 'ai';

const { steps } = await generateText({
  model: openai('gpt-4.1'),
  maxSteps: 10,
  // ...
});

// extract all tool calls from the steps:
const allToolCalls = steps.flatMap(step => step.toolCalls);
```

----------------------------------------

TITLE: Configure Client-Side Chat Component for Multi-Step Tools
DESCRIPTION: This snippet modifies the `pages/index.tsx` file to include the `maxSteps` option within the `useChat` hook's `chatStore` configuration. Setting `maxSteps` to 5 allows the AI model to execute up to five sequential steps for a single generation, facilitating more complex interactions and information gathering over multiple tool calls.
SOURCE: https://v5.ai-sdk.dev/getting-started/nextjs-pages-router

LANGUAGE: TypeScript
CODE:
```
import { useChat } from '@ai-sdk/react';

import { defaultChatStoreOptions } from 'ai';

export default function Chat() {

const { messages, input, handleInputChange, handleSubmit } = useChat({

chatStore: defaultChatStoreOptions({

api: '/api/chat',

maxSteps: 5,

}),

});

// ... rest of your component code

}
```

----------------------------------------

TITLE: Test generateObject with Mock Language Model and Zod Schema
DESCRIPTION: This snippet demonstrates how to unit test the `generateObject` function from the AI SDK. It uses `MockLanguageModelV2` to simulate an object generation response, validating it against a Zod schema, which is useful for testing structured output from AI models.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/testing

LANGUAGE: typescript
CODE:
```
import { generateObject } from 'ai';

import { MockLanguageModelV2 } from 'ai/test';

import { z } from 'zod';

const result = await generateObject({
  model: new MockLanguageModelV2({
    doGenerate: async () => ({
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20 },
      text: `{"content":"Hello, world!"}`,
    }),
  }),
  schema: z.object({ content: z.string() }),
  prompt: 'Hello, test!',
});
```

----------------------------------------

TITLE: Utilize Built-in Web Search Tool in AI SDK
DESCRIPTION: This example shows how to use the AI SDK's built-in `webSearchPreview` tool to ground model responses with real-time internet access. It enables the model to fetch relevant information for prompts requiring up-to-date or external data.
SOURCE: https://v5.ai-sdk.dev/guides/openai-responses

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
model: openai.responses('gpt-4o-mini'),
prompt: 'What happened in San Francisco last week?',
tools: {
web_search_preview: openai.tools.webSearchPreview(),
},
});
console.log(result.text);
console.log(result.sources);
```

----------------------------------------

TITLE: Simulating Streaming Behavior with simulateStreamingMiddleware in AI SDK
DESCRIPTION: This snippet illustrates how `simulateStreamingMiddleware` can be used to provide a streaming interface for language models that inherently do not support streaming. It ensures consistent behavior across different model types by simulating chunked responses.
SOURCE: https://v5.ai-sdk.dev/ai-sdk-core/middleware

LANGUAGE: javascript
CODE:
```
import { wrapLanguageModel, simulateStreamingMiddleware } from 'ai';

const model = wrapLanguageModel({
  model: yourModel,
  middleware: simulateStreamingMiddleware(),
});
```

----------------------------------------

TITLE: Generate Embedding for Single Value with AI SDK
DESCRIPTION: Demonstrates how to import and use the `embed` function from the AI SDK to generate an embedding for a single text value using an OpenAI embedding model. This is suitable for tasks like similarity retrieval.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/embed

LANGUAGE: TypeScript
CODE:
```
import { embed } from "ai"
```

LANGUAGE: TypeScript
CODE:
```
import { openai } from '@ai-sdk/openai';

import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
});
```

----------------------------------------

TITLE: Update React Component to Display AI Explanations
DESCRIPTION: This snippet updates the `handleExplainQuery` function within the `components/query-viewer.tsx` file. It integrates the `explainQuery` server action to asynchronously fetch AI-generated explanations for SQL queries, managing loading states and updating the component's UI to display these insights to the user.
SOURCE: https://v5.ai-sdk.dev/guides/natural-language-postgres

LANGUAGE: typescript
CODE:
```
/* ...other imports... */

import { explainQuery } from '@/app/actions';

/* ...rest of the component... */

const handleExplainQuery = async () => {
setQueryExpanded(true);
setLoadingExplanation(true);
const explanations = await explainQuery(inputValue, activeQuery);
setQueryExplanations(explanations);
setLoadingExplanation(false);
};

/* ...rest of the component... */
```

----------------------------------------

TITLE: AI SDK Core: generateObject Function Parameters
DESCRIPTION: Defines the optional parameters that can be passed to the `generateObject` function, including function identifiers, metadata, and provider-specific options.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/generate-object

LANGUAGE: APIDOC
CODE:
```
generateObject Parameters:
  functionId?: string
    Identifier for this function. Used to group telemetry data by function.
  metadata?: Record<string, string | number | boolean | Array<null | undefined | string> | Array<null | undefined | number> | Array<null | undefined | boolean>>
    Additional information to include in the telemetry data.
  providerOptions?: Record<string,Record<string,JSONValue>> | undefined
    Provider-specific options. The outer key is the provider name. The inner values are the metadata. Details depend on the provider.
```

----------------------------------------

TITLE: Generate Slogan with Specific Instruction
DESCRIPTION: Illustrates how adding a descriptive term to the prompt, like 'organic', influences the LLM's completion, making the output more targeted.
SOURCE: https://v5.ai-sdk.dev/advanced/prompt-engineering

LANGUAGE: Prompt
CODE:
```
Create a slogan for an organic coffee shop.
```

----------------------------------------

TITLE: Model Generation Control Parameters
DESCRIPTION: Parameters influencing the language model's text generation, including token limits, temperature, top-P, top-K, and various penalties.
SOURCE: https://v5.ai-sdk.dev/reference/ai-sdk-core/stream-text

LANGUAGE: APIDOC
CODE:
```
maxOutputTokens?: number
  Maximum number of tokens to generate.

temperature?: number
  Temperature setting. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

topP?: number
  Nucleus sampling. The value is passed through to the provider. The range depends on the provider and model. It is recommended to set either `temperature` or `topP`, but not both.

topK?: number
  Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. You usually only need to use temperature.

presencePenalty?: number
  Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt. The value is passed through to the provider. The range depends on the provider and model.

frequencyPenalty?: number
  Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases. The value is passed through to the provider. The range depends on the provider and model.

stopSequences?: string[]
  Sequences that will stop the generation of the text. If the model generates any of these sequences, it will stop generating further text.

seed?: number
  The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.
```