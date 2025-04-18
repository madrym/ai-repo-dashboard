/**
 * GitHub API utility functions
 */
import { GitHubErrorResponse, RepositoryIdentifier } from './types';

/**
 * Extracts owner and repo name from a GitHub repository URL
 * @param url GitHub repository URL
 * @returns Object with owner and repo properties
 */
export function parseRepositoryUrl(url: string): RepositoryIdentifier | null {
  if (!url) return null;
  
  try {
    // Handle different URL formats
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') {
      return null;
    }
    
    // Split pathname and remove empty strings
    const parts = urlObj.pathname.split('/').filter(Boolean);
    
    if (parts.length < 2) {
      return null;
    }
    
    return {
      owner: parts[0],
      repo: parts[1],
    };
  } catch (error) {
    // Handle invalid URLs
    return null;
  }
}

/**
 * Builds a URL with query parameters
 * @param baseUrl Base URL
 * @param params Query parameters
 * @returns URL with query parameters
 */
export function buildUrl(baseUrl: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return baseUrl;
  
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Handles API errors and converts them to a standard format
 * @param error Error object
 * @returns Standardized error object
 */
export function handleApiError(error: unknown): Error {
  if (error instanceof Response) {
    return new Error(`GitHub API error: ${error.status} ${error.statusText}`);
  }
  
  if ((error as GitHubErrorResponse).message) {
    return new Error(`GitHub API error: ${(error as GitHubErrorResponse).message}`);
  }
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error('Unknown GitHub API error');
}

/**
 * Parses rate limit information from response headers
 * @param headers Response headers
 * @returns Rate limit information
 */
export function parseRateLimitHeaders(headers: Headers): {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
} {
  return {
    limit: parseInt(headers.get('x-ratelimit-limit') || '0', 10),
    remaining: parseInt(headers.get('x-ratelimit-remaining') || '0', 10),
    reset: parseInt(headers.get('x-ratelimit-reset') || '0', 10),
    used: parseInt(headers.get('x-ratelimit-used') || '0', 10),
  };
}

/**
 * Validates repository identifier
 * @param repo Repository identifier
 * @returns Whether the repository identifier is valid
 */
export function isValidRepositoryIdentifier(repo: RepositoryIdentifier | null): repo is RepositoryIdentifier {
  return !!repo && typeof repo.owner === 'string' && typeof repo.repo === 'string' && 
    repo.owner.trim() !== '' && repo.repo.trim() !== '';
} 