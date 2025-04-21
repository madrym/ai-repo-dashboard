// lib/llm-server.ts - Server-side LLM utilities

import { OpenAI } from "openai";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerateOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generate(options: LLMGenerateOptions): Promise<LLMResponse>;
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
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    try {
      // Handle response format for OpenAI
      const openAiOptions: any = {
        model: "gpt-4-turbo",
        messages: options.messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000
      };
      
      // Only add response_format if it's specifically json_object
      if (options.responseFormat?.type === "json_object") {
        openAiOptions.response_format = { type: "json_object" };
      }
      
      const completion = await this.client.chat.completions.create(openAiOptions);

      return {
        content: completion.choices[0]?.message?.content || '',
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
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

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    const geminiMessages = options.messages.map(message => {
      const role = message.role === 'system' ? 'user' : message.role; // Gemini uses 'user' or 'model'
      return {
        role: role === 'assistant' ? 'model' : 'user', // Map assistant to model
        parts: [{ text: message.content }]
      };
    });
    
    // Request body with improved configuration
    const requestBody: any = {
      contents: geminiMessages,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 8000,
        topP: 0.9,
        topK: 32,
      },
    };

    // Add JSON instructions but don't use responseFormat field (not supported by Gemini API)
    if (options.responseFormat?.type === "json_object") {
      // For Gemini, we need to add instructions to ensure JSON output
      // Add a system instruction for JSON format
      const lastMessageIndex = requestBody.contents.length - 1;
      if (lastMessageIndex >= 0) {
        const lastContent = requestBody.contents[lastMessageIndex].parts[0].text;
        requestBody.contents[lastMessageIndex].parts[0].text = 
          `${lastContent}\n\nIMPORTANT: You must respond with a valid JSON object only. No explanations or markdown formatting. The response should be valid, parseable JSON.`;
      }
    }

    console.log("Gemini request configuration:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API Error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Better response validation and error handling
    if (!data.candidates || data.candidates.length === 0) {
      console.error("Empty candidates array from Gemini:", JSON.stringify(data, null, 2));
      throw new Error('Gemini returned no content. Try adjusting your prompt or parameters.');
    }
    
    const candidate = data.candidates[0];
    
    // Check finish reason
    if (candidate.finishReason === "MAX_TOKENS") {
      console.warn("Gemini response hit MAX_TOKENS limit. Content may be truncated.");
    }
    
    // Check content structure
    if (!candidate.content?.parts?.[0]?.text) {
      console.error("Unexpected Gemini response structure:", JSON.stringify(data, null, 2));
      throw new Error('Invalid or empty content structure from Gemini API');
    }
    
    const responseText = candidate.content.parts[0].text.trim();
    
    // Check for empty responses
    if (!responseText) {
      console.error("Gemini returned empty text:", JSON.stringify(data, null, 2));
      throw new Error('Gemini returned empty content. Try simplifying your prompt or adjusting parameters.');
    }
    
    // Handle JSON responses
    if (options.responseFormat?.type === "json_object") {
      try {
        // Clean up response text - remove any markdown code block markers
        let cleanedText = responseText;
        
        // Check if the response is wrapped in a markdown code block
        const codeBlockMatch = responseText.match(/^```(?:json)?\s*([\s\S]*?)```$/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          cleanedText = codeBlockMatch[1].trim();
          console.log("Stripped markdown code block formatting from Gemini response");
        }
        
        // Validate it's valid JSON by parsing and stringifying
        const jsonParsed = JSON.parse(cleanedText);
        // Return properly formatted JSON
        return { content: JSON.stringify(jsonParsed) };
      } catch (error) {
        console.error("Gemini returned invalid JSON:", responseText);
        throw new Error('Gemini did not return valid JSON. Please try again.');
      }
    }
    
    return { content: responseText };
  }

  // Legacy method for compatibility
  async chat(params: { 
    messages: { role: string; content: string }[]; 
    temperature?: number; 
    max_tokens?: number;
  }): Promise<LLMResponse> {
    return this.generate({
      messages: params.messages as LLMMessage[],
      temperature: params.temperature,
      maxTokens: params.max_tokens
    });
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

  async generate(options: LLMGenerateOptions): Promise<LLMResponse> {
    let systemPrompt: string | undefined;
    const claudeMessages = options.messages
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
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000, // Claude often supports larger token counts
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

  // Legacy method for compatibility
  async chat(params: { 
    messages: { role: string; content: string }[]; 
    temperature?: number; 
    max_tokens?: number;
  }): Promise<LLMResponse> {
    return this.generate({
      messages: params.messages as LLMMessage[],
      temperature: params.temperature,
      maxTokens: params.max_tokens
    });
  }
}

// Factory function - Now lives purely on the server
export function createLLMProvider(provider: string, apiKey: string): LLMProvider | null {
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
        ? new OpenAIProvider(apiKey)
        : new OpenAIProvider(apiKey);
  }
} 

// Helper to get API key from environment variables based on provider
export async function getApiKeyForProvider(provider: string): Promise<string> {
  const resolvedProvider = (provider || process.env.LLM_PROVIDER || 'openai').toLowerCase();
  
  switch (resolvedProvider) {
    case 'gemini':
    case 'google':
      return process.env.GEMINI_API_KEY || '';
    case 'claude':
    case 'anthropic':
      return process.env.CLAUDE_API_KEY || '';
    case 'openai':
    default:
      return process.env.OPENAI_API_KEY || '';
  }
}

// Helper to generate feature specs with any LLM provider
export async function generateFeatureSpecContent(
  provider: LLMProvider,
  id: string,
  title: string,
  description: string,
  problem: string,
  outOfScope: string,
  org: string,
  repo: string,
  branch: string,
  date: string
): Promise<Record<string, string>> {
  const prompt = `
You are an expert software engineer tasked with creating a detailed feature specification for a new feature.

# FEATURE DETAILS
- ID: ${id}
- Title: ${title}
- Description: ${description}
- Problem Statement: ${problem}
- Out of Scope: ${outOfScope}
- Organization: ${org}
- Repository: ${repo}
- Branch: ${branch}
- Date: ${date}

# TASK
Create a comprehensive feature specification that includes the following sections:

1. OVERVIEW: A brief introduction to the feature, its purpose, and what problem it solves.

2. PROBLEM STATEMENT: A detailed description of the problem being addressed, including the current state and its limitations.

3. PROPOSED SOLUTION: A high-level description of the solution, including architectural changes, data models, and workflows.

4. TECHNICAL DETAILS: A more detailed description of how the feature will be implemented, including:
   - APIs and interfaces
   - Data models and schema changes
   - Key algorithms or logic
   - Performance considerations

5. ACCEPTANCE CRITERIA: A list of criteria that must be met for the feature to be considered complete, described as "The feature should..."

6. OUT OF SCOPE: What is explicitly not included in this feature.

7. DEPENDENCIES: Any dependencies on other systems, features, or teams.

8. TIMELINE: A rough estimate of the development timeline, including phases or milestones.

Respond with a JSON object that contains each section as a field with the content as strings.
`;

  // Create a message for the LLM
  const messages: LLMMessage[] = [
    {
      role: "system",
      content: "You are a helpful expert software engineer tasked with creating detailed and accurate feature specifications."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  try {
    // Generate the feature spec using the LLM
    const response = await provider.generate({
      messages,
      temperature: 0.7,
      maxTokens: 4000,
      responseFormat: { type: "json_object" }
    });

    // Parse the response as JSON
    try {
      const content = JSON.parse(response.content);
      return content;
    } catch (error) {
      console.error("Failed to parse LLM response as JSON:", error);
      // Fallback to template if JSON parsing fails
      return {
        OVERVIEW: `${title}`,
        PROBLEM_STATEMENT: problem || "No problem statement provided.",
        PROPOSED_SOLUTION: description || "No description provided.",
        TECHNICAL_DETAILS: "Technical details to be determined.",
        ACCEPTANCE_CRITERIA: "Acceptance criteria to be determined.",
        OUT_OF_SCOPE: outOfScope || "No out-of-scope items specified.",
        DEPENDENCIES: "No dependencies identified.",
        TIMELINE: "Timeline to be determined."
      };
    }
  } catch (error) {
    console.error("Error generating feature spec with LLM:", error);
    // Return a template if the LLM call fails
    return {
      OVERVIEW: `${title}`,
      PROBLEM_STATEMENT: problem || "No problem statement provided.",
      PROPOSED_SOLUTION: description || "No description provided.",
      TECHNICAL_DETAILS: "Technical details to be determined.",
      ACCEPTANCE_CRITERIA: "Acceptance criteria to be determined.",
      OUT_OF_SCOPE: outOfScope || "No out-of-scope items specified.",
      DEPENDENCIES: "No dependencies identified.",
      TIMELINE: "Timeline to be determined."
    };
  }
} 