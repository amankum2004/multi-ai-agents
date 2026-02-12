import { streamText, generateWithTools } from '../lib/huggingface';
import { ConversationContext } from './types';
import { orderTools } from './tools/order-tools';

const ORDER_SYSTEM_PROMPT = `You are an order management specialist. Your role is to:
- Help customers track their orders
- Provide order status updates
- Assist with order modifications and cancellations
- Answer delivery-related questions

You have access to tools to:
- Fetch detailed order information
- Check delivery status and tracking
- List all orders for a user

Always ask for the order ID if the customer hasn't provided it. Be proactive in using tools to get accurate information.
If an order cannot be found, politely inform the customer and ask them to verify the order ID.`;

export async function handleOrderQuery(context: ConversationContext) {
  const messages = [
    { role: 'system' as const, content: ORDER_SYSTEM_PROMPT },
    ...context.messages,
  ];

  const tools = {
    fetch_order_details: {
      description: orderTools[0].description,
      parameters: orderTools[0].parameters,
      execute: async (params: any) => {
        return await orderTools[0].execute({ ...params, userId: context.userId });
      },
    },
    check_delivery_status: {
      description: orderTools[1].description,
      parameters: orderTools[1].parameters,
      execute: async (params: any) => {
        return await orderTools[1].execute({ ...params, userId: context.userId });
      },
    },
    list_user_orders: {
      description: orderTools[2].description,
      parameters: orderTools[2].parameters,
      execute: async () => {
        return await orderTools[2].execute({ userId: context.userId });
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
