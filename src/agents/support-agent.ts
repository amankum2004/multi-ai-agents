import { streamText, generateWithTools } from '../lib/huggingface';
import { ConversationContext } from './types';
import { supportTools } from './tools/support-tools';

const SUPPORT_SYSTEM_PROMPT = `You are a helpful customer support agent. Your role is to:
- Answer general support inquiries and FAQs
- Help with troubleshooting issues
- Provide guidance on account-related questions
- Assist with product information and usage

You have access to tools to:
- Query conversation history to understand context
- Search FAQs for relevant answers

Be friendly, professional, and helpful. If you don't know something, be honest about it.
Always try to use the available tools to provide accurate information.`;

export async function handleSupportQuery(context: ConversationContext) {
  const messages = [
    { role: 'system' as const, content: SUPPORT_SYSTEM_PROMPT },
    ...context.messages,
  ];

  const tools = {
    query_conversation_history: {
      description: supportTools[0].description,
      parameters: supportTools[0].parameters,
      execute: async (params: any) => {
        return await supportTools[0].execute({ ...params, conversationId: context.conversationId });
      },
    },
    search_faqs: {
      description: supportTools[1].description,
      parameters: supportTools[1].parameters,
      execute: supportTools[1].execute,
    },
  };

  // Use tool-enabled generation
  const result = await generateWithTools(messages, tools);

  // Return async generator for streaming
  return {
    textStream: (async function* () {
      // Split the text into chunks for streaming effect
      const words = result.text.split(' ');
      for (const word of words) {
        yield word + ' ';
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    })(),
    toolCalls: result.toolCalls,
  };
}


