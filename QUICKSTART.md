# 🚀 Quick Start Guide

## Step 1: Start Backend Server

Your backend is already running! Keep it running in the current terminal.

## Step 2: Start Frontend (Choose One)

### Option A: React App (Recommended) ⭐

Open a **new terminal** and run:

```bash
cd client
npm install
npm run dev
```

Then open your browser to: **http://localhost:5173**

### Option B: Simple HTML Client

Just open the HTML file in your browser:

```bash
# Linux
xdg-open example-client.html

# Or manually open example-client.html in your browser
```

## Step 3: Start Chatting! 💬

1. Enter a User ID (e.g., `user-123`)
2. Click "Start Chat"
3. Try these example queries:

**Test Support Agent:**
- "How do I reset my password?"
- "What's your return policy?"

**Test Order Agent:**
- "Where is my order ORD-001?"
- "Track my order ORD-002"
- "Show me all my orders"

**Test Billing Agent:**
- "I need an invoice for order ORD-001"
- "Check refund status for payment PAY-003"
- "Show me all my payments"

## Architecture

The system automatically routes your query to the right agent:
- 🛠️ **Support Agent** - FAQs, troubleshooting
- 📦 **Order Agent** - Order tracking, delivery
- 💳 **Billing Agent** - Payments, refunds, invoices

Each agent has access to database tools to provide accurate information!

## Troubleshooting

**Backend not responding?**
- Make sure backend is running on port 3000
- Check `.env` file has correct `HUGGINGFACE_API_KEY`

**Frontend not loading?**
- Make sure you're in the `client` folder
- Run `npm install` first
- Check if port 5173 is available

**Database errors?**
- Make sure PostgreSQL is running (Docker or local)
- Run `npm run db:push` to create tables
- Run `npm run seed` to add sample data
