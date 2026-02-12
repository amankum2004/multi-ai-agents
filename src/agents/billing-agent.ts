import { streamText, generateWithTools } from '../lib/huggingface';
import { ConversationContext } from './types';
import { billingTools } from './tools/billing-tools';

const BILLING_SYSTEM_PROMPT = `You are a billing and payment specialist. Your role is to:
- Help customers with payment issues
- Process refund requests and check refund status
- Provide invoice information
- Answer subscription and pricing questions

You have access to tools to:
- Get invoice details for payments
- Check refund status
- List all payments for a user

Be empathetic when dealing with payment issues. Always verify information using the available tools.
For refund requests, explain the process clearly and check the current status.`;

export async function handleBillingQuery(context: ConversationContext) {
  const messages = [
    { role: 'system' as const, content: BILLING_SYSTEM_PROMPT },
    ...context.messages,
  ];

  const tools = {
    get_invoice_details: {
      description: billingTools[0].description,
      parameters: billingTools[0].parameters,
      execute: async (params: any) => {
        return await billingTools[0].execute({ ...params, userId: context.userId });
      },
    },
    check_refund_status: {
      description: billingTools[1].description,
      parameters: billingTools[1].parameters,
      execute: async (params: any) => {
        return await billingTools[1].execute({ ...params, userId: context.userId });
      },
    },
    list_user_payments: {
      description: billingTools[2].description,
      parameters: billingTools[2].parameters,
      execute: async (params: any) => {
        return await billingTools[2].execute({ userId: context.userId });
      },
    },
  };

  // Use tool-enabled generation
  const result = await generateWithTools(messages, tools);

  // Return async generator for streaming
  return {
    textStream: (async function* () {
      const words = result.text.split(' ');
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
        
      }
    })(),
    toolCalls: result.toolCalls,
  };
}


