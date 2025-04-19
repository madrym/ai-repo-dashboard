"use client"

import { useState, useEffect } from 'react';

// Keep only the client-side hook

// Removed LLM Interfaces (defined in server file or could be shared in a types file)
// Removed Provider Implementations (moved to server file)
// Removed Factory function (moved to server file)
// Removed Server-side helpers (like getApiKeyForProvider)
// Removed analyzeRepositoryWithAI function
// Removed system prompts and error utils if they aren't used client-side

// Hook for managing API keys - Stays on the client
export function useLLMApiKey() {
  const [apiKey, setApiKey] = useState<string>('');
  // Default provider from NEXT_PUBLIC env var
  const [provider, setProvider] = useState<string>(() => {
      // Read initial provider from localStorage or env var safely on client
      if (typeof window !== 'undefined') {
          return localStorage.getItem('llm_provider') || process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai';
      }
      return process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai'; // Fallback for server-side rendering if needed, though primarily client
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load initial provider
    const initialProvider = localStorage.getItem('llm_provider') || process.env.NEXT_PUBLIC_LLM_PROVIDER || 'openai';
    setProvider(initialProvider);

    // Load API key from localStorage
    const storedKey = localStorage.getItem('llm_api_key');
    setApiKey(storedKey || ''); 
    
    setIsLoading(false);
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem('llm_api_key', key); 
    setApiKey(key);
    // Maybe remove old provider-specific keys if they existed
    // localStorage.removeItem('openai_api_key'); 
    // localStorage.removeItem('gemini_api_key');
    // localStorage.removeItem('claude_api_key');
  };

  const saveProvider = (providerName: string) => {
    localStorage.setItem('llm_provider', providerName);
    setProvider(providerName);
  };

  return { apiKey, provider, saveApiKey, saveProvider, isLoading };
} 