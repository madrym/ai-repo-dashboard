/**
 * OpenAI client factory
 */

import { openai } from '@ai-sdk/openai';
import { getOpenAIConfig } from './config';
import { OpenAIClientInstance, OpenAIModelConfig } from './types';

/**
 * Create an OpenAI client with the provided model configuration
 * This will return the base model which can be used with various AI SDK functions
 * @param modelConfig - Configuration for the model to use
 * @returns OpenAI client for the specified model
 */
export function createOpenAIModelClient(modelConfig: OpenAIModelConfig): OpenAIClientInstance {
  return openai(modelConfig.modelName);
}

/**
 * Get an OpenAI client with the default model configuration
 * @returns OpenAI client with default model
 */
export function getDefaultOpenAIClient(): OpenAIClientInstance {
  const config = getOpenAIConfig();
  return openai(config.defaultModel.modelName);
}

/**
 * Get an OpenAI client for planning operations
 * @returns OpenAI client configured for planning
 */
export function getPlanningClient(): OpenAIClientInstance {
  const config = getOpenAIConfig();
  return openai(config.models.planning.modelName);
}

/**
 * Get an OpenAI client for schema generation
 * @returns OpenAI client configured for schema generation
 */
export function getSchemaClient(): OpenAIClientInstance {
  const config = getOpenAIConfig();
  return openai(config.models.schema.modelName);
}

/**
 * Get an OpenAI client for content generation
 * @returns OpenAI client configured for content generation
 */
export function getContentClient(): OpenAIClientInstance {
  const config = getOpenAIConfig();
  return openai(config.models.content.modelName);
} 