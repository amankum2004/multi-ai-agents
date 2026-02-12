import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [conversationId, setConversationId] = useState(null);
  const [userId, setUserId] = useState('user-123');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentType, setAgentType] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I'm your AI customer support assistant. How can I help you today?",
        },
      ]);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Make sure the server is running on port 3000.');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: agent')) {
            const data = JSON.parse(line.slice(13));
            setAgentType(data.agentType);
          } else if (line.startsWith('event: message')) {
            const data = JSON.parse(line.slice(15));
            assistantMessage += data.content;
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.role === 'assistant' && lastMessage.isStreaming) {
                lastMessage.content = assistantMessage;
              } else {
                newMessages.push({
                  role: 'assistant',
                  content: assistantMessage,
                  isStreaming: true,
                });
              }
              return newMessages;
            });
          } else if (line.startsWith('event: done')) {
            setIsTyping(false);
            setMessages((prev) => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.isStreaming) {
                delete lastMessage.isStreaming;
              }
              return newMessages;
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="setup-screen">
        <div className="setup-card">
          <h1>🤖 AI Customer Support</h1>
          <p>Powered by HuggingFace</p>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter your User ID"
            className="user-input"
          />
          <button onClick={startConversation} className="start-button">
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>🤖 AI Customer Support</h1>
        <p>Powered by HuggingFace</p>
        {agentType && (
          <div className="agent-badge">
            Agent: <strong>{agentType.toUpperCase()}</strong>
          </div>
        )}
      </div>

      <div className="messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message assistant">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          className="message-input"
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
