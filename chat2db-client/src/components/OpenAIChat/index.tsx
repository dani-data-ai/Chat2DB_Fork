import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, message } from 'antd';
import { OpenAIService, OpenAIConfig } from '@/service/openai';

const { TextArea } = Input;

interface OpenAIChatProps {
  onSQLGenerated?: (sql: string) => void;
  databaseSchema?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const OpenAIChat: React.FC<OpenAIChatProps> = ({ onSQLGenerated, databaseSchema }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<OpenAIConfig>({
    apiKey: localStorage.getItem('openai_api_key') || '',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 1500,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    if (!config.apiKey) {
      message.error('Please set your OpenAI API key first');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      const openaiService = new OpenAIService(config);
      let response: string;

      if (userMessage.toLowerCase().includes('explain')) {
        const sqlMatch = userMessage.match(/`([^`]+)`/);
        const sqlToExplain = sqlMatch ? sqlMatch[1] : userMessage;
        response = await openaiService.explainQuery(sqlToExplain);
      } else {
        response = await openaiService.generateSQL(userMessage, databaseSchema);
        // If response looks like SQL, offer to use it
        if (response.toLowerCase().includes('select') || response.toLowerCase().includes('insert')) {
          onSQLGenerated?.(response);
        }
      }

      addMessage(response, 'assistant');
    } catch (error) {
      message.error('Failed to get AI response');
      addMessage('Sorry, I encountered an error. Please check your API key and try again.', 'assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setConfig(prev => ({ ...prev, apiKey: newApiKey }));
    localStorage.setItem('openai_api_key', newApiKey);
  };

  return (
    <Card title="AI SQL Assistant" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px' }}>
        <Input.Password
          placeholder="Enter OpenAI API Key (sk-...)"
          value={config.apiKey}
          onChange={handleApiKeyChange}
          style={{ marginBottom: '8px' }}
        />
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px', border: '1px solid #f0f0f0', padding: '10px' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ 
            marginBottom: '10px', 
            padding: '8px', 
            backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f6ffed',
            borderRadius: '6px'
          }}>
            <strong>{message.role === 'user' ? 'You' : 'AI'}:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '5px 0 0 0', fontFamily: 'inherit' }}>
              {message.content}
            </pre>
          </div>
        ))}
        {isLoading && <div style={{ textAlign: 'center', color: '#999' }}>AI is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask me to generate SQL, explain queries, or optimize performance..."
          rows={2}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button 
          type="primary" 
          onClick={handleSendMessage}
          loading={isLoading}
          disabled={!inputValue.trim()}
        >
          Send
        </Button>
      </div>
    </Card>
  );
};

export default OpenAIChat;