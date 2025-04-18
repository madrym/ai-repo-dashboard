/**
 * GitHub API client
 */
import { cache } from 'react';
import { GITHUB_API_KEY, GITHUB_BASE_URL, DEFAULT_REQUEST_OPTIONS, CACHE_CONFIG, RATE_LIMIT_HEADERS } from './config';
import { GitHubRequestOptions, GitHubErrorResponse, CacheOptions } from './types';
import { buildUrl, handleApiError, parseRateLimitHeaders } from './utils';
import apiCache from './cache';

// Check if API key is configured
const isApiKeyConfigured = !!GITHUB_API_KEY;

/**
 * GitHub API client class
 */
class GitHubApiClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultOptions: RequestInit;
  
  /**
   * Creates a new GitHubApiClient instance
   */
  constructor() {
    this.baseUrl = GITHUB_BASE_URL;
    this.apiKey = GITHUB_API_KEY;
    this.defaultOptions = DEFAULT_REQUEST_OPTIONS;
    
    if (!this.apiKey) {
      console.warn('GitHub API key is not configured. API calls may be rate-limited.');
    }
  }
  
  /**
   * Makes an HTTP request to the GitHub API
   * @param endpoint API endpoint
   * @param options Request options
   * @returns Response data
   */
  async request<T>(endpoint: string, options?: GitHubRequestOptions): Promise<T> {
    if (!isApiKeyConfigured && !options?.skipAuthorization) {
      throw new Error('GitHub API key is not configured');
    }
    
    try {
      const url = buildUrl(`${this.baseUrl}${endpoint}`, options?.params);
      
      // Prepare request options
      const requestOptions: RequestInit = {
        ...this.defaultOptions,
        ...options,
        headers: {
          ...this.defaultOptions.headers,
          ...options?.headers,
          ...(options?.skipAuthorization ? {} : { 
            Authorization: `token ${this.apiKey}` 
          }),
        },
      };
      
      // Make request
      const response = await fetch(url, requestOptions);
      
      // Check for rate limiting
      const rateLimitInfo = parseRateLimitHeaders(response.headers);
      
      // Handle rate limit errors proactively
      if (rateLimitInfo.remaining === 0) {
        const resetTime = new Date(rateLimitInfo.reset * 1000);
        throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toISOString()}`);
      }
      
      // Handle unsuccessful responses
      if (!response.ok) {
        const errorData: GitHubErrorResponse = await response.json().catch(() => ({
          message: `HTTP error ${response.status} ${response.statusText}`,
        }));
        
        throw errorData;
      }
      
      // Parse and return response data
      const data = await response.json() as T;
      return data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
  
  /**
   * Makes a cached HTTP request to the GitHub API
   * @param endpoint API endpoint
   * @param options Request options
   * @param cacheOptions Cache options
   * @returns Response data
   */
  async cachedRequest<T>(
    endpoint: string, 
    options?: GitHubRequestOptions, 
    cacheOptions?: CacheOptions
  ): Promise<T> {
    // Skip cache if forceRefresh is true
    if (cacheOptions?.forceRefresh) {
      return this.request<T>(endpoint, options);
    }
    
    // Create a cache key based on the endpoint and options
    const cacheKey = `github:${endpoint}:${JSON.stringify(options?.params || {})}`;
    const ttl = cacheOptions?.ttl || CACHE_CONFIG.DEFAULT_TTL;
    
    // Use the cache
    return apiCache.getOrSet<T>(
      cacheKey,
      () => this.request<T>(endpoint, options),
      ttl
    );
  }
  
  /**
   * Gets the current rate limit status
   * @returns Rate limit information
   */
  async getRateLimit() {
    return this.request('/rate_limit');
  }
}

// Create a singleton instance of the GitHub API client
const githubApiClient = new GitHubApiClient();

/**
 * Cached API request function with React cache
 */
export const cachedRequest = cache(async <T>(
  endpoint: string, 
  options?: GitHubRequestOptions, 
  cacheOptions?: CacheOptions
): Promise<T> => {
  return githubApiClient.cachedRequest<T>(endpoint, options, cacheOptions);
});

// Export the GitHub API client
export default githubApiClient; 