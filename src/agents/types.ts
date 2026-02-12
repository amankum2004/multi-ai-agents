export type AgentType = 'router' | 'support' | 'order' | 'billing';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  messages: Message[];
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  toolCalls?: any[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}
