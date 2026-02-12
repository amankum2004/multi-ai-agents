import { HfInference } from '@huggingface/inference';

const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
if (!apiKey) throw new Error('HF API key missing');

export const hf = new HfInference(apiKey, {
  base_url: 'https://router.huggingface.co',
});

/**
 * ✅ GUARANTEED MODEL (text-generation only)
 */
export const DEFAULT_MODEL = 'google/gemma-2-2b-it';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * ✅ TEXT GENERATION (STABLE)
 */
export async function generateText(
  messages: Message[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const prompt = messages
    .map(m => {
      if (m.role === 'system') return `System: ${m.content}`;
      if (m.role === 'user') return `User: ${m.content}`;
      return `Assistant: ${m.content}`;
    })
    .join('\n');

  const res = await hf.textGeneration({
    model,
    inputs: prompt,
    parameters: {
      max_new_tokens: 512,
      temperature: 0.7,
      return_full_text: false,
    },
  });

  return res.generated_text ?? '';
}

/**
 * ✅ STREAMING (REAL TOKENS)
 */
export async function* streamText(
  messages: Message[],
  model: string = DEFAULT_MODEL
): AsyncGenerator<string> {
  const prompt = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const stream = hf.textGenerationStream({
    model,
    inputs: prompt,
    parameters: {
      max_new_tokens: 512,
      temperature: 0.7,
      return_full_text: false,
    },
  });

  for await (const chunk of stream) {
    if (chunk.token?.text) yield chunk.token.text;
  }
}

/**
 * ✅ TOOL GENERATION (NO JSON CRASH)
 */
export async function generateWithTools(
  messages: Message[],
  tools: Record<string, any>,
  model: string = DEFAULT_MODEL
): Promise<{ text: string; toolCalls: any[] }> {
  const toolDescriptions = Object.entries(tools)
    .map(
      ([name, tool]) =>
        `Tool: ${name}\nDescription: ${tool.description}\nParams: ${JSON.stringify(
          tool.parameters
        )}`
    )
    .join('\n\n');

  const enhancedMessages: Message[] = [
    {
      role: 'system',
      content: `${messages[0]?.content ?? ''}

You can call tools like:
TOOL_CALL: tool_name
{ "param": "value" }

Available tools:
${toolDescriptions}`,
    },
    ...messages.filter(m => m.role !== 'system'),
  ];

  let text = '';
  const toolCalls: any[] = [];

  for (let i = 0; i < 3; i++) {
    const response = await generateText(enhancedMessages, model);
    text += response;

    const match = response.match(/TOOL_CALL:\s*(\w+)[\s\S]*?({[\s\S]*?})/);
    if (!match) break;

    const toolName = match[1];
    let params: any = {};

    try {
      params = JSON.parse(match[2]);
    } catch {
      break;
    }

    if (!tools[toolName]) break;

    const result = await tools[toolName].execute(params);
    toolCalls.push({ toolName, params, result });

    enhancedMessages.push(
      { role: 'assistant', content: response },
      {
        role: 'user',
        content: `Tool result: ${JSON.stringify(result)}. Respond naturally.`,
      }
    );
  }

  return { text, toolCalls };
}
