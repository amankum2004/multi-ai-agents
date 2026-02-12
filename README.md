# AI-Powered Customer Support System

A fullstack AI customer support system with multi-agent architecture built with Hono, Drizzle ORM, and OpenAI.

## Features

- **Multi-Agent Architecture**: Router agent delegates queries to specialized sub-agents
- **Specialized Agents**:
  - Support Agent: Handles FAQs, troubleshooting, and general inquiries
  - Order Agent: Manages order tracking, status, and delivery information
  - Billing Agent: Handles payments, refunds, and invoices
- **Conversational Context**: Maintains conversation history across messages
- **Streaming Responses**: Real-time AI responses with SSE
- **Agent Tools**: Each agent has access to database tools for accurate information
- **Real-time Indicators**: Agent typing indicators during response generation

## Tech Stack

- **Backend**: Hono (lightweight web framework)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: HuggingFace Inference API (Mistral-7B-Instruct by default)
- **Language**: TypeScript

## Supported Models

The system uses HuggingFace's Inference API and supports various open-source models:
- `mistralai/Mistral-7B-Instruct-v0.2` (default)
- `meta-llama/Meta-Llama-3-8B-Instruct`
- `microsoft/Phi-3-mini-4k-instruct`
- `HuggingFaceH4/zephyr-7b-beta`

You can change the model in `src/lib/huggingface.ts` by updating the `DEFAULT_MODEL` constant.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- HuggingFace API key (get one at https://huggingface.co/settings/tokens)

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
DATABASE_URL=postgresql://user:password@localhost:5432/customer_support
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
PORT=3000
```

3. **Setup database**:
```bash
npm run db:push
```

4. **Seed database with sample data**:
```bash
npm run seed
```

5. **Start development server**:
```bash
npm run dev
```

## API Endpoints

### Create Conversation
```bash
POST /api/chat/conversations
Content-Type: application/json

{
  "userId": "user-123"
}
```

### Get Conversation History
```bash
GET /api/chat/conversations/:conversationId
```

### Send Message (Streaming)
```bash
POST /api/chat/conversations/:conversationId/messages
Content-Type: application/json

{
  "content": "Where is my order ORD-001?"
}
```

Response is streamed as Server-Sent Events (SSE):
- `event: agent` - Which agent is handling the query
- `event: typing` - Typing indicator
- `event: message` - Streamed response chunks
- `event: done` - Response complete

## Architecture

### Router Agent
Analyzes incoming queries and classifies them into:
- SUPPORT: General inquiries, FAQs, troubleshooting
- ORDER: Order tracking, status, delivery
- BILLING: Payments, refunds, invoices

### Sub-Agents

**Support Agent**
- Tools: `query_conversation_history`, `search_faqs`
- Handles general support and troubleshooting

**Order Agent**
- Tools: `fetch_order_details`, `check_delivery_status`, `list_user_orders`
- Manages order-related queries

**Billing Agent**
- Tools: `get_invoice_details`, `check_refund_status`, `list_user_payments`
- Handles payment and billing issues

## Example Usage

```javascript
// Create conversation
const response = await fetch('http://localhost:3000/api/chat/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user-123' })
});
const { conversationId } = await response.json();

// Send message with streaming
const eventSource = new EventSource(
  `http://localhost:3000/api/chat/conversations/${conversationId}/messages`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Where is my order?' })
  }
);

eventSource.addEventListener('agent', (e) => {
  const { agentType } = JSON.parse(e.data);
  console.log('Agent:', agentType);
});

eventSource.addEventListener('message', (e) => {
  const { content } = JSON.parse(e.data);
  console.log('Response:', content);
});

eventSource.addEventListener('done', () => {
  eventSource.close();
});
```

## Database Schema

- **conversations**: Stores conversation metadata
- **messages**: Stores all messages with role and agent type
- **orders**: Sample order data with status and tracking
- **payments**: Payment records with refund information
- **faqs**: Frequently asked questions for support agent

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Sample Data

The seed script creates:
- 4 FAQs across different categories
- 3 sample orders with different statuses
- 3 payment records (including one refunded)

Test with user IDs: `user-123`, `user-456`
Test with order IDs: `ORD-001`, `ORD-002`, `ORD-003`

## License

MIT
