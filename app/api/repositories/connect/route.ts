import { NextRequest, NextResponse } from 'next/server';
import { 
  parseRepositoryUrl, 
  checkRepositoryExists, 
  getRepositoryStats, 
  RepositoryIdentifier 
} from '@/lib/github';

/**
 * POST /api/repositories/connect
 * Connects to a GitHub repository and returns its metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryUrl } = body;
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }
    
    // Parse repository URL
    const repoIdentifier = parseRepositoryUrl(repositoryUrl);
    
    if (!repoIdentifier) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }
    
    // Check if repository exists and is accessible
    const exists = await checkRepositoryExists(repoIdentifier);
    
    if (!exists) {
      return NextResponse.json(
        { error: 'Repository not found or not accessible' },
        { status: 404 }
      );
    }
    
    // Get repository statistics
    const repoStats = await getRepositoryStats(repoIdentifier);
    
    // Return repository data
    return NextResponse.json({
      success: true,
      repository: repoStats.repository,
      branches: repoStats.branches,
      contributors: repoStats.contributors,
      languages: repoStats.languages,
    });
  } catch (error) {
    console.error('Error connecting to repository:', error);
    
    return NextResponse.json(
      { error: 'Failed to connect to repository' },
      { status: 500 }
    );
  }
} 