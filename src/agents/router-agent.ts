import { generateText } from '../lib/huggingface';
import { ConversationContext, AgentType } from './types';

const ROUTER_SYSTEM_PROMPT = `You are a router agent for a customer support system. Your job is to analyze incoming customer queries and classify them into one of these categories:

1. SUPPORT - General support inquiries, FAQs, troubleshooting, account issues, how-to questions
2. ORDER - Order status, tracking, modifications, cancellations, delivery questions
3. BILLING - Payment issues, refunds, invoices, subscription queries, pricing questions

Analyze the user's message and respond with ONLY ONE WORD: either "SUPPORT", "ORDER", or "BILLING".

Examples:
- "How do I reset my password?" -> SUPPORT
- "Where is my order?" -> ORDER
- "I need a refund" -> BILLING
- "Can you help me track my package?" -> ORDER
- "What's your return policy?" -> SUPPORT
- "I was charged twice" -> BILLING

Respond with only the category name, nothing else.`;

export async function routeQuery(context: ConversationContext): Promise<AgentType> {
  const lastMessage = context.messages[context.messages.length - 1];

  try {
    const text = await generateText([
      { role: 'system', content: ROUTER_SYSTEM_PROMPT },
      { role: 'user', content: lastMessage.content },
    ]);

    const classification = text.trim().toUpperCase();

    if (classification.includes('ORDER')) {
      return 'order';
    } else if (classification.includes('BILLING')) {
      return 'billing';
    } else if (classification.includes('SUPPORT')) {
      return 'support';
    }

    // Fallback to support agent
    return 'support';
  } catch (error) {
    console.error('Error routing query:', error);
    // Fallback to support agent on error
    return 'support';
  }
}
