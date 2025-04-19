import { NextResponse } from 'next/server';
import { getRepomixFileList, repomixSummaryExists } from '../repomix-summary/utils';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { owner, repo, branch = 'main' } = body;
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner and repo' },
        { status: 400 }
      );
    }
    
    // Check if repomix summary exists
    const exists = repomixSummaryExists(owner, repo, branch);
    
    if (!exists) {
      return NextResponse.json(
        { error: `Repomix summary not found for ${owner}/${repo}/${branch}` },
        { status: 404 }
      );
    }
    
    // Get the file list from the repomix summary
    const files = getRepomixFileList(owner, repo, branch);
    
    // Return the files
    return NextResponse.json({ files });
  } catch (error) {
    console.error('Error getting repomix files:', error);
    
    return NextResponse.json(
      { error: 'Failed to get repomix files' },
      { status: 500 }
    );
  }
} 