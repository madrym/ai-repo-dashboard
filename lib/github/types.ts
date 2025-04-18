/**
 * GitHub API response types
 */

// Rate limit information
export interface RateLimitResponse {
  resources: {
    core: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    search: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    graphql: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    integration_manifest: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
    code_scanning_upload: {
      limit: number;
      used: number;
      remaining: number;
      reset: number;
    };
  };
  rate: {
    limit: number;
    used: number;
    remaining: number;
    reset: number;
  };
}

// Repository owner information
export interface RepositoryOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  url: string;
  html_url: string;
  type: string;
}

// Repository information
export interface Repository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: RepositoryOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  visibility?: string;
  license?: {
    key: string;
    name: string;
    url: string;
  } | null;
}

// Branch information
export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

// Contributor information
export interface Contributor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  url: string;
  html_url: string;
  type: string;
  contributions: number;
}

// Error response
export interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
}

// API request options
export interface GitHubRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthorization?: boolean;
}

// Cache control
export interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

// Repository URL components
export interface RepositoryIdentifier {
  owner: string;
  repo: string;
  branch?: string;
}

// File node for repository file structure
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path?: string;
  children?: FileNode[];
} 