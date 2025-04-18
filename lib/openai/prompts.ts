/**
 * OpenAI prompt templates and management
 */

import { truncateToTokenLimit } from './utils';

/**
 * Template variables for prompt templates
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Fill a prompt template with variables
 * @param template The prompt template with {{variable}} placeholders
 * @param variables The variables to fill in the template
 * @returns Filled template
 */
export function fillPromptTemplate(template: string, variables: TemplateVariables): string {
  let result = template;
  
  // Replace all variables in the template
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''));
  }
  
  return result;
}

/**
 * Standard system message for planning
 */
export const PLANNING_SYSTEM_PROMPT = `You are an expert software planner with deep knowledge of modern web development practices.
Your task is to help plan and organize software features based on user requirements.
Provide clear, organized, and detailed planning documents that can guide developers.`;

/**
 * Standard system message for schema generation
 */
export const SCHEMA_SYSTEM_PROMPT = `You are an expert in creating form schemas based on feature requirements.
Your task is to analyze feature ideas and generate appropriate form fields to help plan the feature.
Create schemas that are comprehensive yet focused on the most relevant aspects of the feature.`;

/**
 * Standard system message for general content generation
 */
export const CONTENT_SYSTEM_PROMPT = `You are a helpful AI assistant with expertise in software development.
Provide clear, accurate, and well-organized information to help users with their questions.`;

/**
 * Create a prompt with system and user instructions
 * @param systemPrompt The system prompt to use
 * @param userPrompt The user prompt to use
 * @param maxTokens Maximum tokens for the combined prompt
 * @returns Combined prompt
 */
export function createCombinedPrompt(
  systemPrompt: string, 
  userPrompt: string, 
  maxTokens?: number
): string {
  let combined = `${systemPrompt}\n\n${userPrompt}`;
  
  if (maxTokens) {
    combined = truncateToTokenLimit(combined, maxTokens);
  }
  
  return combined;
}

/**
 * Format a prompt with chat-style messages
 * @param messages Array of messages in the format {role: 'system'|'user'|'assistant', content: string}
 * @returns Formatted chat prompt
 */
export function formatChatPrompt(
  messages: Array<{role: 'system' | 'user' | 'assistant', content: string}>
): string {
  return messages.map(message => {
    const rolePrefix = `<|im_start|>${message.role}`;
    return `${rolePrefix}\n${message.content}\n<|im_end|>`;
  }).join('\n');
}

/**
 * Create a planning prompt from a feature idea
 * @param featureIdea The feature idea to create a plan for
 * @param additionalContext Additional context for the plan
 * @returns Planning prompt
 */
export function createPlanningPrompt(featureIdea: string, additionalContext?: string): string {
  const template = `Create a comprehensive planning document for the following feature:

Feature idea: {{featureIdea}}
{{#additionalContext}}

Additional context:
{{additionalContext}}
{{/additionalContext}}

Your planning document should include:
1. A clear overview of the feature
2. The specific goals and objectives
3. Technical requirements and considerations
4. Implementation steps organized in phases
5. Potential challenges and how to address them

Make your plan specific, actionable, and organized with clear sections.`;

  return fillPromptTemplate(template, {
    featureIdea,
    additionalContext
  });
} 