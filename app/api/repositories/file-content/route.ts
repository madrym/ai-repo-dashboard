import { NextRequest, NextResponse } from 'next/server';
import { 
  getRepositoryContents, 
  RepositoryIdentifier 
} from '@/lib/github';

/**
 * POST /api/repositories/file-content
 * Retrieves file content from a GitHub repository
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryFullName, path } = body;
    
    if (!repositoryFullName) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      );
    }
    
    if (!path) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Parse repository full name
    const [owner, repo] = repositoryFullName.split('/');
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Invalid repository name format' },
        { status: 400 }
      );
    }
    
    const repoIdentifier: RepositoryIdentifier = { owner, repo };
    
    // Get file contents
    const fileContent = await getRepositoryContents(repoIdentifier, path);
    
    // GitHub API returns different response formats based on whether it's a file or directory
    if (Array.isArray(fileContent)) {
      return NextResponse.json(
        { error: 'Path points to a directory, not a file' },
        { status: 400 }
      );
    }
    
    if (!fileContent.content) {
      return NextResponse.json(
        { error: 'File content not available' },
        { status: 404 }
      );
    }
    
    // File content is base64 encoded
    const content = Buffer.from(fileContent.content, 'base64').toString('utf-8');
    
    // Return file content
    return NextResponse.json({
      success: true,
      path: fileContent.path,
      name: fileContent.name,
      content,
      sha: fileContent.sha,
      size: fileContent.size,
      type: fileContent.type,
      encoding: fileContent.encoding,
    });
  } catch (error) {
    console.error('Error fetching file content:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: `Failed to fetch file content: ${errorMessage}` },
      { status: 500 }
    );
  }
} 