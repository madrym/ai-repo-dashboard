/**
 * OpenAI response handling utilities
 */

import { ResponseMetadata, TokenUsage } from './types';

/**
 * Standard error types that can occur when making OpenAI API calls
 */
export enum OpenAIErrorType {
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  BAD_REQUEST = 'bad_request',
  CONNECTION = 'connection',
  UNKNOWN = 'unknown',
}

/**
 * Standardized error object for OpenAI API errors
 */
export interface OpenAIError {
  type: OpenAIErrorType;
  message: string;
  status?: number;
  details?: any;
}

/**
 * Convert error from OpenAI API to standardized format
 * @param error The error from the OpenAI API
 * @returns Standardized error object
 */
export function handleOpenAIError(error: any): OpenAIError {
  // Check for Axios/fetch error structure
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data || {};

    // Authentication errors
    if (status === 401) {
      return {
        type: OpenAIErrorType.AUTHORIZATION,
        message: 'Invalid API key or unauthorized access',
        status,
        details: data,
      };
    }

    // Rate limit errors
    if (status === 429) {
      return {
        type: OpenAIErrorType.RATE_LIMIT,
        message: 'Rate limit exceeded',
        status,
        details: data,
      };
    }

    // Server errors
    if (status >= 500) {
      return {
        type: OpenAIErrorType.SERVER,
        message: 'OpenAI server error',
        status,
        details: data,
      };
    }

    // Bad request errors
    if (status >= 400) {
      return {
        type: OpenAIErrorType.BAD_REQUEST,
        message: data.error?.message || 'Bad request to OpenAI API',
        status,
        details: data,
      };
    }
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT' || error.message?.includes('timeout')) {
    return {
      type: OpenAIErrorType.TIMEOUT,
      message: 'Request to OpenAI API timed out',
      details: error,
    };
  }

  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connection')) {
    return {
      type: OpenAIErrorType.CONNECTION,
      message: 'Failed to connect to OpenAI API',
      details: error,
    };
  }

  // Unknown errors
  return {
    type: OpenAIErrorType.UNKNOWN,
    message: error.message || 'Unknown error with OpenAI API',
    details: error,
  };
}

/**
 * Determine if an error is retryable
 * @param error Standardized error object
 * @returns True if the error can be retried
 */
export function isRetryableError(error: OpenAIError): boolean {
  return (
    error.type === OpenAIErrorType.RATE_LIMIT ||
    error.type === OpenAIErrorType.SERVER ||
    error.type === OpenAIErrorType.TIMEOUT ||
    error.type === OpenAIErrorType.CONNECTION
  );
}

/**
 * Create metadata from an OpenAI response
 * @param response Response from OpenAI API
 * @returns Metadata with usage information
 */
export function createResponseMetadata(response: any): ResponseMetadata {
  const metadata: ResponseMetadata = {
    modelUsed: response.model || '',
  };

  // Add token usage if available
  if (response.usage) {
    const tokenUsage: TokenUsage = {
      promptTokens: response.usage.prompt_tokens || 0,
      completionTokens: response.usage.completion_tokens || 0,
      totalTokens: response.usage.total_tokens || 0,
      model: response.model || '',
      timestamp: Date.now(),
    };
    metadata.tokenUsage = tokenUsage;
  }

  return metadata;
} 