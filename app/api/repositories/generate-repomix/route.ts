import { NextRequest, NextResponse } from 'next/server';
import { generateRepomixSummary } from '@/lib/services/repomix-generator';

/**
 * POST /api/repositories/generate-repomix
 * Generates a repomix summary for a repository
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, branch = 'main' } = body;
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner and repo' },
        { status: 400 }
      );
    }
    
    // Generate the repomix summary
    const result = await generateRepomixSummary(owner, repo, branch);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      owner,
      repo,
      branch,
      outputPath: result.outputPath
    });
  } catch (error) {
    console.error('Error generating repomix summary:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate repomix summary' },
      { status: 500 }
    );
  }
} 