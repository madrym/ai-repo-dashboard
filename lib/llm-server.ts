// lib/llm-server.ts - Server-side LLM utilities

// Define interfaces for our LLM clients (can be shared or redefined here)
interface LLMResponse {
  content: string;
}

interface LLMProvider {
  chat(params: {
    messages: { role: string; content: string }[];
    temperature?: number;
    max_tokens?: number;
  }): Promise<LLMResponse>;
}

// Error handling utilities (if needed server-side)
export function handleLLMError(error: any): any {
  if (error?.response?.data) {
    return error.response.data;
  }
  return error;
}

export function isRetryableError(error: any): boolean {
  // Retry on rate limits or temporary server errors
  if (error?.status === 429 || (error?.status >= 500 && error?.status < 600)) {
    return true;
  }
  return false;
}

// System prompts (if only used server-side)
// export const SCHEMA_SYSTEM_PROMPT = "..."; 
// export const PLANNING_SYSTEM_PROMPT = "...";

// --- LLM Provider Implementations --- 

// OpenAI Provider Implementation
class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4-turbo', baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(params: { 
    messages: { role: string; content: string }[]; 
    temperature?: number; 
    max_tokens?: number;
  }): Promise<LLMResponse> {
    // Use fetch or a server-side HTTP client like axios if preferred
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Consider more robust error handling/logging on the server
      throw new Error(`OpenAI API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenAI API');
    }
    return { content: data.choices[0].message.content };
  }
}

// Google Gemini Provider Implementation
class GeminiProvider implements LLMProvider {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
  
    constructor(apiKey: string, model: string = 'gemini-2.5-pro-exp-03-25', baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta') {
      this.apiKey = apiKey;
      this.baseUrl = baseUrl;
      this.model = model;
    }
  
    async chat(params: { 
      messages: { role: string; content: string }[]; 
      temperature?: number; 
      max_tokens?: number;
    }): Promise<LLMResponse> {
      const geminiMessages = params.messages.map(message => {
        const role = message.role === 'system' ? 'user' : message.role; // Gemini uses 'user' or 'model'
        return {
          role: role === 'assistant' ? 'model' : 'user', // Map assistant to model
          parts: [{ text: message.content }]
        };
      });
      
      // Ensure alternating user/model roles if necessary for conversation history (Gemini requirement)
      // This basic implementation assumes a single user message or correct structure
  
      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages, // Pass the mapped messages
          generationConfig: {
            temperature: params.temperature || 0.7,
            maxOutputTokens: params.max_tokens || 2000,
          }
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
      // Add more robust checking for Gemini's response structure
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content?.parts?.[0]?.text) {
        // Log the actual response for debugging if structure is unexpected
        console.error("Unexpected Gemini response structure:", JSON.stringify(data, null, 2));
        throw new Error('Invalid response structure from Gemini API');
    }
      return { content: data.candidates[0].content.parts[0].text };
    }
}

// Anthropic Claude Provider Implementation
class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-opus-20240229', baseUrl: string = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async chat(params: { 
    messages: { role: string; content: string }[]; 
    temperature?: number; 
    max_tokens?: number;
  }): Promise<LLMResponse> {
    let systemPrompt: string | undefined;
    const claudeMessages = params.messages
        .filter(message => {
            if (message.role === 'system') {
                systemPrompt = message.content; // Capture system prompt
                return false; // Exclude from messages array
            }
            return true;
        })
        .map(message => ({
            role: message.role === 'assistant' ? 'assistant' : 'user', // Map system to user if needed, ensure user/assistant alternation
            content: message.content
        }));

    // Basic validation for alternating roles (Claude requires user, assistant, user...)
    // This might need more sophisticated handling for multi-turn conversations

    const body: any = {
        model: this.model,
        messages: claudeMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 4000, // Claude often supports larger token counts
    };

    if (systemPrompt) {
        body.system = systemPrompt; // Add system prompt if present
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API Error (${response.status}): ${errorData.error?.message || errorData.error?.type || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.content || data.content.length === 0 || !data.content[0].text) {
        throw new Error('Invalid response structure from Claude API');
    }
    return { content: data.content[0].text };
  }
}

// Factory function - Now lives purely on the server
export function createLLMProvider(apiKey: string, provider?: string): LLMProvider {
  // No need for console logs about env vars here unless debugging server-side config
  const resolvedProvider = (provider || process.env.LLM_PROVIDER || 'openai').toLowerCase(); // Use server-side env vars
  
  console.log(`Creating server-side LLM provider for: ${resolvedProvider}`);

  switch (resolvedProvider) {
    case 'gemini':
    case 'google':
      const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-pro-exp-03-25'; 
      const geminiBaseUrl = process.env.GEMINI_BASE_URL; // Optional Base URL from server env
      console.log(`Server Gemini Config - Model: ${geminiModel}, BaseURL: ${geminiBaseUrl || 'Default'}`); 
      if (!apiKey) throw new Error('Gemini API Key is missing.');
      return geminiBaseUrl 
        ? new GeminiProvider(apiKey, geminiModel, geminiBaseUrl)
        : new GeminiProvider(apiKey, geminiModel);
      
    case 'claude':
    case 'anthropic':
      const claudeModel = process.env.CLAUDE_MODEL || 'claude-3-opus-20240229'; 
      const claudeBaseUrl = process.env.CLAUDE_BASE_URL;
      console.log(`Server Claude Config - Model: ${claudeModel}, BaseURL: ${claudeBaseUrl || 'Default'}`); 
      if (!apiKey) throw new Error('Claude API Key is missing.');
       return claudeBaseUrl
        ? new ClaudeProvider(apiKey, claudeModel, claudeBaseUrl)
        : new ClaudeProvider(apiKey, claudeModel);
      
    case 'openai':
    default:
      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4-turbo'; 
      const openaiBaseUrl = process.env.OPENAI_BASE_URL;
      console.log(`Server OpenAI Config - Model: ${openaiModel}, BaseURL: ${openaiBaseUrl || 'Default'}`); 
      if (!apiKey) throw new Error('OpenAI API Key is missing.');
      return openaiBaseUrl
        ? new OpenAIProvider(apiKey, openaiModel, openaiBaseUrl)
        : new OpenAIProvider(apiKey, openaiModel);
  }
} 