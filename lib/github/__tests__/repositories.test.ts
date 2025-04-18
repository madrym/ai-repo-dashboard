import {
  getRepository,
  getRepositoryBranches,
  getRepositoryContributors,
  getRepositoryLanguages,
  getRepositoryStats,
  getRepositoryContents,
  getRepositoryPullRequests,
  getRepositoryCommitActivity,
  getRepositoryParticipation,
  getRepositoryFileStructure,
  getRepositoryDetailedStats
} from '../repositories';
import githubApiClient, { cachedRequest } from '../client';
import { RepositoryIdentifier } from '../types';

// Mock the GitHub API client and cached request
jest.mock('../client', () => {
  const originalModule = jest.requireActual('../client');
  return {
    __esModule: true,
    ...originalModule,
    default: {
      request: jest.fn(),
      cachedRequest: jest.fn()
    },
    cachedRequest: jest.fn()
  };
});

describe('GitHub Repository API Functions', () => {
  const mockRepoId: RepositoryIdentifier = { owner: 'test-owner', repo: 'test-repo' };
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getRepository', () => {
    it('should fetch repository data and return it', async () => {
      const mockRepo = { name: 'test-repo', id: 123 };
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockRepo);
      
      const result = await getRepository(mockRepoId);
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo',
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockRepo);
    });
    
    it('should throw an error for invalid repository', async () => {
      const invalidRepo = { owner: '', repo: '' };
      
      await expect(getRepository(invalidRepo)).rejects.toThrow('Invalid repository identifier');
      expect(cachedRequest).not.toHaveBeenCalled();
    });
  });
  
  describe('getRepositoryContents', () => {
    it('should fetch repository contents with the correct path', async () => {
      const mockContents = [{ name: 'file.txt', path: 'file.txt', type: 'file' }];
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockContents);
      
      const result = await getRepositoryContents(mockRepoId, 'src');
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/contents/src',
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockContents);
    });
    
    it('should handle empty path to get root contents', async () => {
      const mockContents = [{ name: 'file.txt', path: 'file.txt', type: 'file' }];
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockContents);
      
      const result = await getRepositoryContents(mockRepoId);
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/contents/',
        undefined,
        expect.any(Object)
      );
      expect(result).toEqual(mockContents);
    });
  });
  
  describe('getRepositoryFileTree', () => {
    it('should fetch the repository file tree structure using default branch', async () => {
      const mockTree = { 
        tree: [
          { path: 'file.txt', type: 'blob' },
          { path: 'src', type: 'tree' }
        ] 
      };
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockTree);
      
      await getRepositoryFileStructure(mockRepoId);
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/git/trees/HEAD?recursive=1',
        undefined,
        expect.any(Object)
      );
    });
    
    it('should fetch the repository file tree using specified branch', async () => {
      const mockTree = { 
        tree: [
          { path: 'file.txt', type: 'blob' },
          { path: 'src', type: 'tree' }
        ] 
      };
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockTree);
      
      const repoWithBranch = { ...mockRepoId, branch: 'develop' };
      await getRepositoryFileStructure(repoWithBranch);
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/git/trees/develop?recursive=1',
        undefined,
        expect.any(Object)
      );
    });
  });
  
  describe('getRepositoryPullRequests', () => {
    it('should fetch open pull requests by default', async () => {
      const mockPRs = [{ id: 1, title: 'Test PR' }];
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockPRs);
      
      const result = await getRepositoryPullRequests(mockRepoId);
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/pulls',
        { state: 'open' },
        expect.any(Object)
      );
      expect(result).toEqual(mockPRs);
    });
    
    it('should fetch pull requests with the specified state', async () => {
      const mockPRs = [{ id: 1, title: 'Test PR' }];
      (cachedRequest as jest.Mock).mockResolvedValueOnce(mockPRs);
      
      const result = await getRepositoryPullRequests(mockRepoId, 'closed');
      
      expect(cachedRequest).toHaveBeenCalledWith(
        '/repos/test-owner/test-repo/pulls',
        { state: 'closed' },
        expect.any(Object)
      );
      expect(result).toEqual(mockPRs);
    });
  });
  
  describe('getRepositoryDetailedStats', () => {
    it('should fetch all repository statistics in parallel', async () => {
      // Mock the basic stats
      const mockBasicStats = {
        repository: { name: 'test-repo' },
        branches: [{ name: 'main' }],
        contributors: [{ login: 'user1' }],
        languages: { TypeScript: 1000 }
      };
      
      // Mock the additional stats
      const mockPRs = [{ id: 1 }];
      const mockCommitActivity = [{ week: 123, total: 5 }];
      const mockCodeFrequency = [[123, 100, -50]];
      const mockParticipation = { all: [1, 2, 3], owner: [0, 1, 0] };
      
      // Mock the getRepositoryStats function
      jest.spyOn(global, 'Promise').mockImplementationOnce(() => ({
        all: jest.fn().mockResolvedValue([
          mockBasicStats,
          mockPRs,
          mockCommitActivity,
          mockCodeFrequency,
          mockParticipation
        ])
      } as unknown as Promise<any>));
      
      const result = await getRepositoryDetailedStats(mockRepoId);
      
      expect(result).toEqual({
        ...mockBasicStats,
        pullRequests: mockPRs,
        commitActivity: mockCommitActivity,
        codeFrequency: mockCodeFrequency,
        participation: mockParticipation
      });
    });
  });
}); 