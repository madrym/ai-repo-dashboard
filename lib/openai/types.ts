/**
 * OpenAI integration types
 */

import { openai } from '@ai-sdk/openai';

/**
 * OpenAI model configuration options
 */
export interface OpenAIModelConfig {
  /** The model identifier to use (e.g., "gpt-4o", "gpt-3.5-turbo") */
  modelName: string;
  /** Optional fallback model to use if primary model is unavailable */
  fallbackModel?: string;
  /** Temperature setting for generation (0-1, lower is more deterministic) */
  temperature?: number;
  /** Max tokens to generate in the response */
  maxTokens?: number;
  /** Whether to use streaming responses when possible */
  streaming?: boolean;
}

/**
 * Environment configuration for OpenAI
 */
export interface OpenAIEnvConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Base URL for OpenAI API (optional) */
  baseUrl?: string;
  /** Organization ID (optional) */
  organization?: string;
  /** Environment name (development, production) */
  environment: 'development' | 'production';
}

/**
 * Complete OpenAI configuration
 */
export interface OpenAIConfig {
  /** Environment configuration */
  env: OpenAIEnvConfig;
  /** Default model configuration */
  defaultModel: OpenAIModelConfig;
  /** Model configurations by purpose */
  models: {
    /** Model for generating planning documents */
    planning: OpenAIModelConfig;
    /** Model for generating form schemas */
    schema: OpenAIModelConfig;
    /** Model for general content generation */
    content: OpenAIModelConfig;
  };
}

/**
 * Error response from OpenAI API
 */
export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * OpenAI client instance type
 */
export type OpenAIClientInstance = ReturnType<typeof openai>;

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: number;
  requestId?: string;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  requestId?: string;
  modelUsed: string;
  tokenUsage?: TokenUsage;
  latency?: number;
} 