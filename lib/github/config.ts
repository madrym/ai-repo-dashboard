/**
 * GitHub API configuration
 */

// Environment variables for GitHub API authentication
export const GITHUB_API_KEY = process.env.GITHUB_API_KEY || process.env.NEXT_PUBLIC_GITHUB_API_KEY || '';
export const GITHUB_BASE_URL = process.env.GITHUB_BASE_URL || 'https://api.github.com';

// API endpoints
export const API_ENDPOINTS = {
  REPOS: '/repos',
  USER: '/user',
  USERS: '/users',
  SEARCH: '/search',
  RATE_LIMIT: '/rate_limit',
};

// GitHub API response headers
export const RATE_LIMIT_HEADERS = {
  LIMIT: 'x-ratelimit-limit',
  REMAINING: 'x-ratelimit-remaining',
  RESET: 'x-ratelimit-reset',
  USED: 'x-ratelimit-used',
};

// Default API request options
export const DEFAULT_REQUEST_OPTIONS = {
  headers: {
    Accept: 'application/vnd.github.v3+json',
  },
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 60 * 5, // 5 minutes in seconds
  REPO_DATA_TTL: 60 * 15, // 15 minutes in seconds
  USER_DATA_TTL: 60 * 30, // 30 minutes in seconds
  STATS_TTL: 60 * 60 * 24, // 24 hours in seconds
}; 