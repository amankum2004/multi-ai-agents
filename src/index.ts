import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chat from './routes/chat';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'AI Customer Support API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Routes
app.route('/api/chat', chat);

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
