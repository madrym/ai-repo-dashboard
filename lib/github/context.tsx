"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Repository, 
  Branch, 
  Contributor, 
  RepositoryIdentifier,
  FileNode,
  parseRepositoryUrl,
  getRepositoryStats,
  getRepositoryDetailedStats,
  getRepositoryFileStructure
} from '@/lib/github';

// Repository data interface
interface RepositoryData {
  repository: Repository;
  branches: Branch[];
  contributors: Contributor[];
  languages: Record<string, number>;
  fileStructure?: FileNode[];
  pullRequests?: any[];
  commitActivity?: any;
  codeFrequency?: any;
  participation?: any;
  localPath?: string; // Add local path for cloned repos
  isLocal?: boolean; // Flag to indicate if the repo is available locally
  repomixSummary?: any; // Add repomix summary
  repomixContent?: string; // Add this line
}

// Context interface
interface RepositoryContextType {
  repositories: Record<string, RepositoryData>;
  currentRepository: string | null;
  isLoading: boolean;
  error: string | null;
  connectRepository: (url: string) => Promise<void>;
  selectRepository: (repoFullName: string) => void;
  getRepositoryData: (repoFullName: string) => RepositoryData | null;
  getRepositoryFiles: (repoFullName: string) => Promise<FileNode[]>;
  getRepositoryFileContent: (repoFullName: string, path: string) => Promise<string>;
  getRepositoryDetailedStats: (repoFullName: string) => Promise<void>;
  getLocalRepositoryStructure: (repoFullName: string) => Promise<FileNode[]>;
  getLocalFileContent: (repoFullName: string, filePath: string) => Promise<string>;
  getRepomixSummary: (repoFullName: string) => Promise<any>;
  getRepomixFiles: (repoFullName: string) => Promise<string[]>;
  generateRepomixSummary: (repoFullName: string) => Promise<boolean>;
}

// Create the context
const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

// Provider component
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const [repositories, setRepositories] = useState<Record<string, RepositoryData>>({});
  const [currentRepository, setCurrentRepository] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from session storage on mount
  useEffect(() => {
    console.log("🔍 [DEBUG] RepositoryProvider initialization useEffect triggered");
    
    const storedData = sessionStorage.getItem('repositoryData');
    console.log("🔍 [DEBUG] Found stored repository data:", !!storedData);
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        console.log("🔍 [DEBUG] Parsed stored data:", !!data);
        
        if (data.repository && data.repository.full_name) {
          console.log(`🔍 [DEBUG] Initializing repository from storage: ${data.repository.full_name}`);
          
          setRepositories({
            [data.repository.full_name]: {
              repository: data.repository,
              branches: data.branches || [],
              contributors: data.contributors || [],
              languages: data.languages || {},
              isLocal: data.isLocal || false,
              localPath: data.localPath
            }
          });
          setCurrentRepository(data.repository.full_name);
          
          // Important: Don't set the user_selected_repo flag during initialization
          // That should only be set when a user explicitly selects a repository
          console.log("🔍 [DEBUG] Repository initialized from storage but not marked as user-selected");
        }
      } catch (err) {
        console.error('Error parsing stored repository data:', err);
        console.log("🔍 [DEBUG] Error parsing stored data:", err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, []);

  // Connect to a repository
  const connectRepository = async (url: string) => {
    console.log(`🔍 [DEBUG] connectRepository called with URL: ${url}`);
    setIsLoading(true);
    setError(null);

    try {
      // Parse repository URL
      const repoIdentifier = parseRepositoryUrl(url);
      
      if (!repoIdentifier) {
        console.log(`🔍 [DEBUG] connectRepository - Invalid GitHub repository URL: ${url}`);
        throw new Error('Invalid GitHub repository URL');
      }
      
      // First, try to clone the repository locally
      console.log(`🔍 [DEBUG] connectRepository - Attempting to clone repository: ${url}`);
      const cloneResponse = await fetch('/api/repositories/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repositoryUrl: url }),
      });
      
      const cloneData = await cloneResponse.json();
      
      if (!cloneResponse.ok) {
        console.error('Warning: Could not clone repository locally:', cloneData.error);
        console.log(`🔍 [DEBUG] connectRepository - Clone failed: ${cloneData.error}`);
        // Continue with remote API if local clone fails
      } else {
        console.log(`🔍 [DEBUG] connectRepository - Repository cloned successfully at: ${cloneData.localPath}`);
      }
      
      // Fetch repository data from GitHub API
      console.log(`🔍 [DEBUG] connectRepository - Fetching repository data from GitHub API`);
      const response = await fetch('/api/repositories/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repositoryUrl: url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log(`🔍 [DEBUG] connectRepository - GitHub API error: ${data.error}`);
        throw new Error(data.error || 'Failed to connect to repository');
      }
      
      // Store in state
      const repoFullName = data.repository.full_name;
      console.log(`🔍 [DEBUG] connectRepository - Connected to repository: ${repoFullName}`);
      
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          repository: data.repository,
          branches: data.branches,
          contributors: data.contributors,
          languages: data.languages,
          isLocal: cloneResponse.ok, // Flag if the repo was cloned successfully
          localPath: cloneResponse.ok ? cloneData.localPath : undefined
        }
      }));
      
      setCurrentRepository(repoFullName);
      
      // Set a flag in session storage to indicate this was an explicit user selection
      sessionStorage.setItem('user_selected_repo', repoFullName);
      console.log(`🔍 [DEBUG] connectRepository - Set user_selected_repo in sessionStorage: ${repoFullName}`);
      
      // Store in session storage
      sessionStorage.setItem('repositoryData', JSON.stringify({
        ...data,
        isLocal: cloneResponse.ok,
        localPath: cloneResponse.ok ? cloneData.localPath : undefined
      }));
      console.log(`🔍 [DEBUG] connectRepository - Stored repository data in sessionStorage`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.log(`🔍 [DEBUG] connectRepository - Error: ${errorMessage}`);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Select a repository
  const selectRepository = (repoFullName: string) => {
    if (repositories[repoFullName]) {
      setCurrentRepository(repoFullName);
      
      // Set a flag in session storage to indicate this was an explicit user selection
      sessionStorage.setItem('user_selected_repo', repoFullName);
    }
  };

  // Get repository data
  const getRepositoryData = (repoFullName: string): RepositoryData | null => {
    return repositories[repoFullName] || null;
  };

  // Get repository file structure
  const getRepositoryFiles = async (repoFullName: string): Promise<FileNode[]> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }
    
    try {
      setIsLoading(true);
      
      // If repository is available locally, use local file structure
      if (repositories[repoFullName].isLocal) {
        return getLocalRepositoryStructure(repoFullName);
      }
      
      // Otherwise, fallback to GitHub API
      const [owner, repo] = repoFullName.split('/');
      const repoIdentifier: RepositoryIdentifier = { owner, repo };
      
      // Get file structure
      const fileStructure = await getRepositoryFileStructure(repoIdentifier);
      
      // Update repositories state
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          fileStructure
        }
      }));
      
      return fileStructure;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get repository files';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get repository file content
  const getRepositoryFileContent = async (repoFullName: string, path: string): Promise<string> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }
    
    try {
      setIsLoading(true);
      
      // If repository is available locally, use local file content
      if (repositories[repoFullName].isLocal) {
        return getLocalFileContent(repoFullName, path);
      }
      
      // Otherwise, fallback to GitHub API
      const response = await fetch('/api/repositories/file-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repositoryFullName: repoFullName, path }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get file content');
      }
      
      return data.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file content';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get detailed repository statistics
  const fetchDetailedRepositoryStats = async (repoFullName: string): Promise<void> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }
    
    try {
      setIsLoading(true);
      
      // Parse repository identifier
      const [owner, repo] = repoFullName.split('/');
      const repoIdentifier: RepositoryIdentifier = { owner, repo };
      
      // Get detailed stats
      const detailedStats = await getRepositoryDetailedStats(repoIdentifier);
      
      // Update repositories state
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          pullRequests: detailedStats.pullRequests,
          commitActivity: detailedStats.commitActivity,
          codeFrequency: detailedStats.codeFrequency,
          participation: detailedStats.participation
        }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get repository statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get local repository structure
  const getLocalRepositoryStructure = async (repoFullName: string): Promise<FileNode[]> => {
    if (!repositories[repoFullName] || !repositories[repoFullName].isLocal) {
      throw new Error('Repository not available locally');
    }
    
    try {
      setIsLoading(true);
      
      const [owner, repo] = repoFullName.split('/');
      
      // Fetch local file structure
      const response = await fetch('/api/repositories/local-structure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get local repository structure');
      }
      
      // Update repositories state
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          fileStructure: data.fileTree
        }
      }));
      
      return data.fileTree;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get local repository structure';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get local file content
  const getLocalFileContent = async (repoFullName: string, filePath: string): Promise<string> => {
    if (!repositories[repoFullName] || !repositories[repoFullName].isLocal) {
      throw new Error('Repository not available locally');
    }
    
    try {
      setIsLoading(true);
      
      const [owner, repo] = repoFullName.split('/');
      
      // Fetch local file content
      const response = await fetch('/api/repositories/local-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, filePath }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get local file content');
      }
      
      return data.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get local file content';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get repomix summary for a repository
  const getRepomixSummary = async (repoFullName: string): Promise<any> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }

    try {
      // If we already have repomix summary, return existing data
      // Keep the repomixContent check for now, might be used elsewhere
      if (repositories[repoFullName].repomixSummary) {
        console.log("Using cached repomix summary data - preventing redundant API calls");
        return repositories[repoFullName].repomixSummary;
      }

      setIsLoading(true);

      // If repository is not available locally, throw error
      if (!repositories[repoFullName].isLocal) {
        // Allow fetching summary even if not local, as the file might exist from a previous clone
        console.warn('Repository not available locally, but attempting to fetch repomix summary.');
        // throw new Error('Repository not available locally'); 
      }

      const [owner, repo] = repoFullName.split('/');
      const branch = repositories[repoFullName].repository.default_branch || 'main';

      // Get the summary using the repomix-summary endpoint (POST)
      console.log(`Fetching repomix summary from /api/repositories/repomix-summary for ${owner}/${repo}/${branch}`);
      const response = await fetch('/api/repositories/repomix-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, branch }),
      });

      if (!response.ok) {
        // Handle 404 specifically - summary file not found
        if (response.status === 404) {
            console.log(`Repomix summary file not found for ${owner}/${repo}/${branch}.`);
            // Set summary to null or an empty object to indicate it's not available
            setRepositories(prev => ({
                ...prev,
                [repoFullName]: {
                  ...prev[repoFullName],
                  repomixSummary: null, // Indicate summary not found
                }
            }));
            return null; // Return null or handle as needed in the UI
        }
        // Handle other errors
        const errorData = await response.json();
        console.error(`Error fetching repomix summary (${response.status}):`, errorData.error);
        throw new Error(errorData.error || `Failed to get repomix summary (${response.status})`);
      }

      // Parse the response which contains { summary: ... }
      const responseData = await response.json();
      const summaryData = responseData.summary; // Extract the summary object
      
      console.log("Successfully fetched and parsed repomix summary:", !!summaryData);


      // Get the raw XML content (keep this fetch for now, might be used by AIAnalysis or other components)
      console.log(`Fetching raw repomix content from /api/repositories/repomix-xml for ${owner}/${repo}/${branch}`);
      const xmlResponse = await fetch(`/api/repositories/repomix-xml?owner=${owner}&repo=${repo}&branch=${branch}`);

      let xmlContent = '';
      if (xmlResponse.ok) {
        xmlContent = await xmlResponse.text();
        console.log("Successfully fetched raw repomix content, length:", xmlContent.length);
      } else {
         console.warn(`Failed to fetch raw repomix content (${xmlResponse.status})`);
      }

      // Update repository data with repomix summary and content
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          ...prev[repoFullName],
          repomixSummary: summaryData, // Store the extracted summary object
          repomixContent: xmlContent
        }
      }));

      return summaryData; // Return the extracted summary object
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get repomix summary';
      console.error('Error generating repomix summary:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get repomix files for a repository
  const getRepomixFiles = async (repoFullName: string): Promise<string[]> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }
    
    try {
      setIsLoading(true);
      
      // If repository is not available locally, throw error
      if (!repositories[repoFullName].isLocal) {
        throw new Error('Repository not available locally');
      }
      
      const [owner, repo] = repoFullName.split('/');
      const branch = repositories[repoFullName].repository.default_branch || 'main';
      
      // Fetch repomix files
      const response = await fetch('/api/repositories/repomix-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, branch }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get repomix files');
      }
      
      return data.files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get repomix files';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Generate repomix summary for a repository
  const generateRepomixSummary = async (repoFullName: string): Promise<boolean> => {
    if (!repositories[repoFullName]) {
      throw new Error('Repository not connected');
    }
    
    try {
      setIsLoading(true);
      
      // If repository is not available locally, throw error
      if (!repositories[repoFullName].isLocal) {
        throw new Error('Repository not available locally');
      }
      
      const [owner, repo] = repoFullName.split('/');
      const branch = repositories[repoFullName].repository.default_branch || 'main';
      
      console.log(`Attempting to generate repomix summary for ${owner}/${repo} (${branch})`);
      
      // Generate repomix summary
      const response = await fetch('/api/repositories/generate-repomix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, branch }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to generate repomix summary:', data.error);
        throw new Error(data.error || 'Failed to generate repomix summary');
      }
      
      console.log('Repomix summary generated successfully, now fetching the content');
      
      // Fetch the updated summary
      await getRepomixSummary(repoFullName);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate repomix summary';
      console.error('Error generating repomix summary:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Provide context
  return (
    <RepositoryContext.Provider 
      value={{
        repositories,
        currentRepository,
        isLoading,
        error,
        connectRepository,
        selectRepository,
        getRepositoryData,
        getRepositoryFiles,
        getRepositoryFileContent,
        getRepositoryDetailedStats: fetchDetailedRepositoryStats,
        getLocalRepositoryStructure,
        getLocalFileContent,
        getRepomixSummary,
        getRepomixFiles,
        generateRepomixSummary,
      }}
    >
      {children}
    </RepositoryContext.Provider>
  );
}

// Hook for using repository context
export function useRepository() {
  const context = useContext(RepositoryContext);
  
  if (context === undefined) {
    throw new Error('useRepository must be used within a RepositoryProvider');
  }
  
  return context;
} 