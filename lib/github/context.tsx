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
    const storedData = sessionStorage.getItem('repositoryData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        if (data.repository && data.repository.full_name) {
          setRepositories({
            [data.repository.full_name]: {
              repository: data.repository,
              branches: data.branches || [],
              contributors: data.contributors || [],
              languages: data.languages || {},
            }
          });
          setCurrentRepository(data.repository.full_name);
        }
      } catch (err) {
        console.error('Error parsing stored repository data:', err);
      }
    }
  }, []);

  // Connect to a repository
  const connectRepository = async (url: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse repository URL
      const repoIdentifier = parseRepositoryUrl(url);
      
      if (!repoIdentifier) {
        throw new Error('Invalid GitHub repository URL');
      }
      
      // Fetch repository data
      const response = await fetch('/api/repositories/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repositoryUrl: url }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect to repository');
      }
      
      // Store in state
      const repoFullName = data.repository.full_name;
      
      setRepositories(prev => ({
        ...prev,
        [repoFullName]: {
          repository: data.repository,
          branches: data.branches,
          contributors: data.contributors,
          languages: data.languages,
        }
      }));
      
      setCurrentRepository(repoFullName);
      
      // Store in session storage
      sessionStorage.setItem('repositoryData', JSON.stringify(data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
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
      
      // Parse repository identifier
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
      
      // Fetch file content through API route
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