import createRequest from './base';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async generateSQL(prompt: string, schema?: string): Promise<string> {
    const systemPrompt = `You are an expert SQL developer. Generate accurate SQL queries based on user requests.
    ${schema ? `Database Schema: ${schema}` : ''}
    Return only valid SQL code.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 1500,
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async explainQuery(query: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: 'Explain SQL queries in simple terms.' },
          { role: 'user', content: `Explain this SQL: ${query}` }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

export default OpenAIService;