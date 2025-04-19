import { NextResponse } from 'next/server';
import { parseRepomixSummary, repomixSummaryExists } from './utils';

export async function POST(request: Request) {
  console.log("🔍 [DEBUG] API: /api/repositories/repomix-summary called");
  
  try {
    // Parse the request body
    const body = await request.json();
    const { owner, repo, branch = 'main' } = body;
    
    console.log(`🔍 [DEBUG] API: Request params - owner: ${owner}, repo: ${repo}, branch: ${branch}`);
    
    if (!owner || !repo) {
      console.log("🔍 [DEBUG] API: Missing parameters error");
      return NextResponse.json(
        { error: 'Missing required parameters: owner and repo' },
        { status: 400 }
      );
    }
    
    // Check if repomix summary exists
    const exists = repomixSummaryExists(owner, repo, branch);
    console.log(`🔍 [DEBUG] API: Summary exists: ${exists} for ${owner}/${repo}/${branch}`);
    
    if (!exists) {
      console.log(`🔍 [DEBUG] API: Summary not found for ${owner}/${repo}/${branch}`);
      return NextResponse.json(
        { error: `Repomix summary not found for ${owner}/${repo}/${branch}` },
        { status: 404 }
      );
    }
    
    // Parse the repomix summary
    const summary = await parseRepomixSummary(owner, repo, branch);
    console.log(`🔍 [DEBUG] API: Summary parsed successfully: ${!!summary}`);
    
    // Return the summary
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error getting repomix summary:', error);
    console.log(`🔍 [DEBUG] API: Error processing request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return NextResponse.json(
      { error: 'Failed to get repomix summary' },
      { status: 500 }
    );
  }
} 