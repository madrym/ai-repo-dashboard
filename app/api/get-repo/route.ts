import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const org = searchParams.get('org');
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch') || 'main';
    
    // Validate required parameters
    if (!org || !repo) {
      return NextResponse.json({ 
        error: 'Missing required parameters. Please provide org and repo.' 
      }, { status: 400 });
    }
    
    // Get current working directory as base
    const cwd = process.cwd();
    
    // Construct the full path to the repository
    const repoPath = path.join(cwd, 'storage', 'repos', org, repo, branch, 'code');
    
    // Check if the repository path exists
    try {
      const stats = await fs.stat(repoPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({ 
          error: 'Repository path exists but is not a directory' 
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error accessing repository path:', error);
      return NextResponse.json({ 
        error: `Repository not found at path: ${repoPath}` 
      }, { status: 404 });
    }
    
    // Return repository information
    return NextResponse.json({
      repoInfo: {
        organization: org,
        repository: repo,
        branch: branch,
        path: repoPath
      },
      success: true
    });
  } catch (error) {
    console.error('Error getting repository information:', error);
    return NextResponse.json({ 
      error: 'Failed to get repository information' 
    }, { status: 500 });
  }
} 