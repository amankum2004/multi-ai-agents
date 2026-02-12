import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { db } from '../db';
import { conversations, messages } from '../db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { routeQuery } from '../agents/router-agent';
import { handleSupportQuery } from '../agents/support-agent';
import { handleOrderQuery } from '../agents/order-agent';
import { handleBillingQuery } from '../agents/billing-agent';
import { ConversationContext } from '../agents/types';

const chat = new Hono();

// Create a new conversation
chat.post('/conversations', async (c) => {
  const { userId } = await c.req.json();

  if (!userId) {
    return c.json({ error: 'userId is required' }, 400);
  }

  const conversationId = nanoid();

  await db.insert(conversations).values({
    id: conversationId,
    userId,
  });

  return c.json({ conversationId, userId });
});

// Get conversation history
chat.get('/conversations/:conversationId', async (c) => {
  const conversationId = c.req.param('conversationId');

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (conversation.length === 0) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  return c.json({
    conversation: conversation[0],
    messages: conversationMessages,
  });
});

// Send a message and get streaming response
chat.post('/conversations/:conversationId/messages', async (c) => {
  const conversationId = c.req.param('conversationId');
  const { content } = await c.req.json();

  if (!content) {
    return c.json({ error: 'content is required' }, 400);
  }

  // Get conversation
  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (conversation.length === 0) {
    return c.json({ error: 'Conversation not found' }, 404);
  }

  const userId = conversation[0].userId;

  // Save user message
  await db.insert(messages).values({
    id: nanoid(),
    conversationId,
    role: 'user',
    content,
  });

  // Get conversation history
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const context: ConversationContext = {
    conversationId,
    userId,
    messages: history.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    })),
  };

  // Route the query
  const agentType = await routeQuery(context);

  // Stream response
  return stream(c, async (stream) => {
    // Send agent type event
    await stream.write(`event: agent\ndata: ${JSON.stringify({ agentType })}\n\n`);

    // Send typing indicator
    await stream.write(`event: typing\ndata: ${JSON.stringify({ isTyping: true })}\n\n`);

    let fullResponse = '';

    try {
      let result;

      // Route to appropriate agent
      switch (agentType) {
        case 'order':
          result = await handleOrderQuery(context);
          break;
        case 'billing':
          result = await handleBillingQuery(context);
          break;
        case 'support':
        default:
          result = await handleSupportQuery(context);
          break;
      }

      // Stream the response
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        await stream.write(`event: message\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Save assistant message
      await db.insert(messages).values({
        id: nanoid(),
        conversationId,
        role: 'assistant',
        content: fullResponse,
        agentType,
      });

      // Send completion event
      await stream.write(`event: done\ndata: ${JSON.stringify({ agentType })}\n\n`);
    } catch (error) {
      console.error('Error streaming response:', error);
      await stream.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
    }
  });
});

export default chat;
