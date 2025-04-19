"use client"

import { useState, useEffect } from 'react';
import { OpenAI } from 'openai';

// Define interfaces for our LLM clients
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

// System prompts
export const SCHEMA_SYSTEM_PROMPT = "You are a helpful assistant that creates form schemas for planning software features.";
export const PLANNING_SYSTEM_PROMPT = "You are a helpful assistant that creates detailed planning documents for software features.";

// Error handling utilities
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
      throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
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
    // Convert to Google's format
    const geminiMessages = params.messages.map(message => {
      // Map OpenAI roles to Gemini roles
      const role = message.role === 'system' ? 'user' : message.role;
      return {
        role: role,
        parts: [{ text: message.content }]
      };
    });
    
    // If there's a system message, prepend it to the first user message
    const hasSystemMessage = params.messages.some(m => m.role === 'system');
    if (hasSystemMessage) {
      const systemMessage = params.messages.find(m => m.role === 'system');
      const userMessageIndex = geminiMessages.findIndex(m => m.role === 'user');
      
      if (systemMessage && userMessageIndex >= 0) {
        geminiMessages[userMessageIndex].parts[0].text = 
          `${systemMessage.content}\n\n${geminiMessages[userMessageIndex].parts[0].text}`;
      }
    }
    
    // Filter out system messages as Gemini doesn't support them directly
    const filteredMessages = geminiMessages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: filteredMessages,
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.max_tokens || 2000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
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
    // Convert to Claude's format
    const claudeMessages = params.messages.map(message => {
      // Map OpenAI roles to Claude roles
      let role = message.role;
      if (role === 'system') {
        role = 'user';
      } else if (role === 'assistant') {
        role = 'assistant';
      } else {
        role = 'user';
      }
      
      return {
        role: role,
        content: message.content
      };
    });
    
    // Handle system message by prepending to the first user message
    const hasSystemMessage = params.messages.some(m => m.role === 'system');
    if (hasSystemMessage) {
      const systemMessage = params.messages.find(m => m.role === 'system');
      const userMessageIndex = claudeMessages.findIndex(m => m.role === 'user');
      
      if (systemMessage && userMessageIndex >= 0) {
        claudeMessages[userMessageIndex].content = 
          `${systemMessage.content}\n\n${claudeMessages[userMessageIndex].content}`;
      }
    }
    
    // Filter out system messages
    const filteredMessages = claudeMessages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        messages: filteredMessages,
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return { content: data.content[0].text };
  }
}

// Factory function to create the appropriate provider based on environment settings
export function createLLMProvider(apiKey: string, provider: string = 'openai'): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'gemini':
    case 'google':
      return new GeminiProvider(
        apiKey,
        process.env.GEMINI_MODEL || 'gemini-2.5-pro-exp-03-25',
        process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta'
      );
    case 'claude':
    case 'anthropic':
      return new ClaudeProvider(
        apiKey,
        process.env.CLAUDE_MODEL || 'claude-3-opus-20240229',
        process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com/v1'
      );
    case 'openai':
    default:
      return new OpenAIProvider(
        apiKey,
        process.env.OPENAI_MODEL || 'gpt-4-turbo',
        process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      );
  }
}

// Client factories
export function getSchemaClient() {
  // This is a placeholder implementation
  return createLLMProvider(
    process.env.OPENAI_API_KEY || '',
    process.env.LLM_PROVIDER || 'openai'
  );
}

export function getPlanningClient() {
  // This is a placeholder implementation
  return createLLMProvider(
    process.env.OPENAI_API_KEY || '',
    process.env.LLM_PROVIDER || 'openai'
  );
}

export function createPlanningPrompt(featureIdea: string, formData: any, featureType: string): string {
  // Convert form data to a string representation for the prompt
  const formDataString = Object.entries(formData)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");

  return `
    Create comprehensive planning documents for this feature:
    
    Feature Idea: "${featureIdea}"
    Feature Type: ${featureType}
    
    Form Data:
    ${formDataString}
  `;
}

// LLM API interaction service for repository analysis
export async function analyzeRepositoryWithAI(
  xmlContent: string,
  apiKey: string,
  analysisType: 'summary' | 'technology' | 'workflows' | 'security' = 'summary'
): Promise<string> {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  let prompt = '';
  
  switch (analysisType) {
    case 'summary':
      prompt = 'Analyze this repository XML data and provide a concise summary of the repository structure, main features, and architecture. Include key technologies and design patterns if detected.';
      break;
    case 'technology':
      prompt = 'Analyze this repository XML data and identify the programming languages with versions, frameworks, libraries, and testing frameworks used. Format as bullet points by category.';
      break;
    case 'workflows':
      prompt = 'Analyze this repository XML data and identify CI/CD workflows, PR status checks, and PR workflows configured. Format as bullet points by category.';
      break;
    case 'security':
      prompt = 'Analyze this repository XML data and identify security tools, code quality tools, and related configurations. Include tools like Sonarqube, Snyk, Perfecto, etc. Format as bullet points by category.';
      break;
  }

  try {
    // Get the provider type from the local storage or environment
    const providerType = localStorage.getItem('llm_provider') || 
                       process.env.LLM_PROVIDER || 
                       'openai';
    
    // Create the LLM provider
    const provider = createLLMProvider(apiKey, providerType);
    
    // Make the API call using the provider
    const result = await provider.chat({
      messages: [
        {
          role: 'system',
          content: 'You are a code repository analyzer. Analyze the provided XML data from a repository and provide insights based on the specific request.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nHere's the repository XML data:\n\n${xmlContent.substring(0, 100000)}`  // Limit to 100K chars to avoid token limits
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return result.content;
  } catch (error) {
    console.error('Error analyzing repository with AI:', error);
    throw error;
  }
}

// Hook for managing API keys
export function useLLMApiKey() {
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<string>('openai');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load API key and provider from localStorage
    const storedKey = localStorage.getItem('llm_api_key') || localStorage.getItem('openai_api_key');
    const storedProvider = localStorage.getItem('llm_provider') || 'openai';
    
    if (storedKey) {
      setApiKey(storedKey);
    }
    setProvider(storedProvider);
    setIsLoading(false);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem('llm_api_key', key);
    localStorage.setItem('openai_api_key', key); // For backward compatibility
    setApiKey(key);
  };

  const saveProvider = (providerName: string) => {
    localStorage.setItem('llm_provider', providerName);
    setProvider(providerName);
  };

  return { apiKey, provider, saveApiKey, saveProvider, isLoading };
} 