import { db } from '../../db';
import { messages, faqs } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export const queryConversationHistory = {
  name: 'query_conversation_history',
  description: 'Query the conversation history to understand context and previous interactions',
  parameters: z.object({
    conversationId: z.string().describe('The conversation ID to query'),
    limit: z.number().optional().describe('Number of messages to retrieve (default: 10)'),
  }),
  execute: async ({ conversationId, limit = 10 }: { conversationId: string; limit?: number }) => {
    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return {
      messages: history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
        agentType: msg.agentType,
        timestamp: msg.createdAt,
      })),
    };
  },
};

export const searchFAQs = {
  name: 'search_faqs',
  description: 'Search frequently asked questions to find relevant answers',
  parameters: z.object({
    query: z.string().describe('The search query or topic'),
    category: z.string().optional().describe('Filter by category (account, shipping, orders, returns)'),
  }),
  execute: async ({ query, category }: { query: string; category?: string }) => {
    let faqResults = await db.select().from(faqs);

    if (category) {
      faqResults = faqResults.filter(faq => faq.category === category);
    }

    // Simple text matching (in production, use vector search)
    const queryLower = query.toLowerCase();
    const relevantFAQs = faqResults.filter(faq => 
      faq.question.toLowerCase().includes(queryLower) ||
      faq.answer.toLowerCase().includes(queryLower)
    );

    return {
      faqs: relevantFAQs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      })),
    };
  },
};

export const supportTools = [queryConversationHistory, searchFAQs];
