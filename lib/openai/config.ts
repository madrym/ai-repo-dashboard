/**
 * OpenAI configuration settings
 */

import { OpenAIConfig } from './types';

/**
 * Get the OpenAI API key from environment variables
 * @returns The API key or undefined if not found
 */
export function getOpenAIApiKey(): string | undefined {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey;
}

/**
 * Get the current environment (development or production)
 * @returns The current environment
 */
export function getEnvironment(): 'development' | 'production' {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

/**
 * Default OpenAI configuration
 */
export const defaultOpenAIConfig: OpenAIConfig = {
  env: {
    apiKey: getOpenAIApiKey() || '',
    baseUrl: process.env.OPENAI_BASE_URL,
    organization: process.env.OPENAI_ORGANIZATION,
    environment: getEnvironment(),
  },
  defaultModel: {
    modelName: 'gpt-4o',
    fallbackModel: 'gpt-3.5-turbo',
    temperature: 0.7,
    streaming: true,
  },
  models: {
    planning: {
      modelName: process.env.OPENAI_PLANNING_MODEL || 'gpt-4o',
      fallbackModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 4000,
    },
    schema: {
      modelName: process.env.OPENAI_SCHEMA_MODEL || 'gpt-4o',
      fallbackModel: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 2000,
    },
    content: {
      modelName: process.env.OPENAI_CONTENT_MODEL || 'gpt-3.5-turbo',
      fallbackModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
    },
  },
};

/**
 * Create a custom OpenAI configuration by overriding default values
 * @param overrides - Custom configuration values to override defaults
 * @returns Custom OpenAI configuration
 */
export function createOpenAIConfig(overrides: Partial<OpenAIConfig> = {}): OpenAIConfig {
  return {
    ...defaultOpenAIConfig,
    ...overrides,
    env: {
      ...defaultOpenAIConfig.env,
      ...(overrides.env || {}),
    },
    models: {
      ...defaultOpenAIConfig.models,
      ...(overrides.models || {}),
    },
  };
}

/**
 * Get the active OpenAI configuration
 * @returns The active OpenAI configuration
 */
export function getOpenAIConfig(): OpenAIConfig {
  return createOpenAIConfig();
} 