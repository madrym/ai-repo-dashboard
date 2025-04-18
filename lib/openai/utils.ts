/**
 * OpenAI utility functions
 */

/**
 * Count tokens in a string (rough estimation)
 * For accurate token counting, use the tiktoken library.
 * 
 * This is a rough approximation based on the rule of thumb that
 * one token is approximately 4 characters in English text.
 * 
 * @param text The text to count tokens for
 * @returns Approximate token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // A rough approximation: 1 token ≈ 4 characters in English
  return Math.ceil(text.length / 4);
}

/**
 * Truncate a string to a maximum token count
 * @param text The text to truncate
 * @param maxTokens Maximum number of tokens
 * @returns Truncated text
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  if (!text) return '';
  
  // Estimate the current token count
  const estimatedTokens = estimateTokenCount(text);
  
  if (estimatedTokens <= maxTokens) {
    return text; // No truncation needed
  }
  
  // Approximate characters to keep based on max tokens
  const approximateChars = maxTokens * 4;
  
  // Make sure we don't cut in the middle of a word
  let truncated = text.slice(0, approximateChars);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > 0) {
    truncated = truncated.slice(0, lastSpaceIndex);
  }
  
  return truncated + '...';
}

/**
 * Validate that an API key is properly formatted
 * @param apiKey OpenAI API key to validate
 * @returns Whether the API key is valid
 */
export function isValidApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  
  // OpenAI API keys typically start with "sk-" and are 51 characters long
  return /^sk-[A-Za-z0-9]{48}$/.test(apiKey);
}

/**
 * Combine multiple prompt segments into a single prompt
 * @param segments Array of prompt segments
 * @returns Combined prompt
 */
export function combinePrompts(segments: string[]): string {
  return segments.filter(Boolean).join('\n\n');
}

/**
 * Create a system message string for OpenAI
 * @param content The system message content
 * @returns Formatted system message
 */
export function createSystemMessage(content: string): string {
  return `<|im_start|>system\n${content}\n<|im_end|>`;
}

/**
 * Create a user message string for OpenAI
 * @param content The user message content
 * @returns Formatted user message
 */
export function createUserMessage(content: string): string {
  return `<|im_start|>user\n${content}\n<|im_end|>`;
}

/**
 * Create an assistant message string for OpenAI
 * @param content The assistant message content
 * @returns Formatted assistant message
 */
export function createAssistantMessage(content: string): string {
  return `<|im_start|>assistant\n${content}\n<|im_end|>`;
} 