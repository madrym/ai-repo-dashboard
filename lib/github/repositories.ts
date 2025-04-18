/**
 * GitHub repository API functions
 */
import { API_ENDPOINTS, CACHE_CONFIG } from './config';
import githubApiClient, { cachedRequest } from './client';
import { Repository, Branch, Contributor, RepositoryIdentifier, CacheOptions, FileNode } from './types';
import { isValidRepositoryIdentifier } from './utils';

/**
 * Gets a repository by owner and name
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Repository data
 */
export async function getRepository(
  repo: RepositoryIdentifier, 
  options?: CacheOptions
): Promise<Repository> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}`;
  
  return cachedRequest<Repository>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets branches for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Array of branches
 */
export async function getRepositoryBranches(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<Branch[]> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/branches`;
  
  return cachedRequest<Branch[]>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets contributors for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Array of contributors
 */
export async function getRepositoryContributors(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<Contributor[]> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/contributors`;
  
  return cachedRequest<Contributor[]>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets languages used in a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Object mapping language name to bytes of code
 */
export async function getRepositoryLanguages(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<Record<string, number>> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/languages`;
  
  return cachedRequest<Record<string, number>>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Checks if a repository exists and is accessible
 * @param repo Repository identifier
 * @returns Whether the repository exists and is accessible
 */
export async function checkRepositoryExists(repo: RepositoryIdentifier): Promise<boolean> {
  if (!isValidRepositoryIdentifier(repo)) {
    return false;
  }
  
  try {
    await getRepository(repo, { forceRefresh: true });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets repository statistics
 * @param repo Repository identifier
 * @returns Repository statistics
 */
export async function getRepositoryStats(repo: RepositoryIdentifier): Promise<{
  repository: Repository;
  branches: Branch[];
  contributors: Contributor[];
  languages: Record<string, number>;
}> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const [repository, branches, contributors, languages] = await Promise.all([
    getRepository(repo),
    getRepositoryBranches(repo),
    getRepositoryContributors(repo),
    getRepositoryLanguages(repo),
  ]);
  
  return {
    repository,
    branches,
    contributors,
    languages,
  };
}

/**
 * Gets contents of a repository directory or file
 * @param repo Repository identifier
 * @param path Path within the repository (defaults to root)
 * @param options Cache options
 * @returns Repository contents
 */
export async function getRepositoryContents(
  repo: RepositoryIdentifier,
  path: string = '',
  options?: CacheOptions
): Promise<any> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const encodedPath = path ? encodeURIComponent(path) : '';
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/contents/${encodedPath}`;
  
  return cachedRequest<any>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets a file tree for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Tree structure of the repository
 */
export async function getRepositoryFileTree(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<any> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/git/trees/${repo.branch || 'HEAD'}?recursive=1`;
  
  return cachedRequest<any>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets pull requests for a repository
 * @param repo Repository identifier
 * @param state Filter by state: open, closed, or all
 * @param options Cache options
 * @returns Array of pull requests
 */
export async function getRepositoryPullRequests(
  repo: RepositoryIdentifier,
  state: 'open' | 'closed' | 'all' = 'open',
  options?: CacheOptions
): Promise<any[]> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/pulls`;
  
  return cachedRequest<any[]>(
    endpoint, 
    { params: { state } }, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.REPO_DATA_TTL,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets commit activity for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Commit activity data
 */
export async function getRepositoryCommitActivity(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<any> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/stats/commit_activity`;
  
  return cachedRequest<any>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.STATS_TTL || 86400,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets code frequency statistics for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Code frequency data
 */
export async function getRepositoryCodeFrequency(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<any> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/stats/code_frequency`;
  
  return cachedRequest<any>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.STATS_TTL || 86400,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets participation statistics for a repository
 * @param repo Repository identifier
 * @param options Cache options
 * @returns Participation data
 */
export async function getRepositoryParticipation(
  repo: RepositoryIdentifier,
  options?: CacheOptions
): Promise<any> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  const { owner, repo: repoName } = repo;
  const endpoint = `${API_ENDPOINTS.REPOS}/${owner}/${repoName}/stats/participation`;
  
  return cachedRequest<any>(
    endpoint, 
    undefined, 
    { 
      ttl: options?.ttl || CACHE_CONFIG.STATS_TTL || 86400,
      forceRefresh: options?.forceRefresh 
    }
  );
}

/**
 * Gets detailed statistics for a repository
 * @param repo Repository identifier
 * @returns Repository statistics
 */
export async function getRepositoryDetailedStats(repo: RepositoryIdentifier): Promise<{
  repository: Repository;
  branches: Branch[];
  contributors: Contributor[];
  languages: Record<string, number>;
  pullRequests: any[];
  commitActivity: any;
  codeFrequency: any;
  participation: any;
}> {
  if (!isValidRepositoryIdentifier(repo)) {
    throw new Error('Invalid repository identifier');
  }
  
  // Get basic stats
  const basicStats = await getRepositoryStats(repo);
  
  // Get additional stats
  const [pullRequests, commitActivity, codeFrequency, participation] = await Promise.all([
    getRepositoryPullRequests(repo),
    getRepositoryCommitActivity(repo),
    getRepositoryCodeFrequency(repo),
    getRepositoryParticipation(repo),
  ]);
  
  return {
    ...basicStats,
    pullRequests,
    commitActivity,
    codeFrequency,
    participation,
  };
}

/**
 * Gets the file structure of a repository as a tree
 * @param repo Repository identifier 
 * @returns File structure as a tree
 */
export async function getRepositoryFileStructure(
  repo: RepositoryIdentifier
): Promise<FileNode[]> {
  const tree = await getRepositoryFileTree(repo);
  
  if (!tree || !tree.tree || !Array.isArray(tree.tree)) {
    return [];
  }
  
  // Build a tree structure from the flat list
  const rootNode: FileNode[] = [];
  const pathMap: Record<string, FileNode> = {};
  
  // First pass: create all nodes
  tree.tree.forEach((item: any) => {
    const isDirectory = item.type === 'tree';
    const path = item.path;
    
    pathMap[path] = {
      name: path.split('/').pop(),
      type: isDirectory ? 'directory' : 'file',
      path: isDirectory ? undefined : path,
      children: isDirectory ? [] : undefined
    };
  });
  
  // Second pass: build hierarchy
  tree.tree.forEach((item: any) => {
    const path = item.path;
    const pathParts = path.split('/');
    const name = pathParts.pop();
    const parentPath = pathParts.join('/');
    
    if (parentPath) {
      if (pathMap[parentPath]) {
        pathMap[parentPath].children = pathMap[parentPath].children || [];
        pathMap[parentPath].children!.push(pathMap[path]);
      }
    } else {
      rootNode.push(pathMap[path]);
    }
  });
  
  // Sort nodes - directories first, then files alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };
  
  sortNodes(rootNode);
  return rootNode;
} 