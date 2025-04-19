import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Use the same base path determination as the generation endpoint
const storageBasePath = path.resolve(process.cwd(), 'storage', 'repos');
// const storageBasePath = '/Users/madry/Documents/Dev/ai-repo-dashboard/storage/repos';

export async function GET(
  request: NextRequest,
  // We won't use the params object directly anymore
  context: { params: { org: string; repo: string; branch: string } }
) {
  let org: string | undefined;
  let repo: string | undefined;
  let branch: string | undefined;

  try {
    // Extract segments from the URL path
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean); // Filter empty strings
    // Expected structure: ['api', 'repos', org, repo, branch, 'get-overview']
    if (pathSegments.length >= 6 && pathSegments[0] === 'api' && pathSegments[1] === 'repos' && pathSegments[5] === 'get-overview') {
      org = pathSegments[2];
      repo = pathSegments[3];
      branch = pathSegments[4];
    } else {
      console.error('Unexpected URL path structure:', url.pathname);
      return NextResponse.json({ error: 'Invalid request URL structure' }, { status: 400 });
    }

    if (!org || !repo || !branch) {
       return NextResponse.json({ error: 'Missing required path parameters (org, repo, branch)' }, { status: 400 });
    }

  } catch(error) {
      console.error('Error parsing request URL:', error);
      return NextResponse.json({ error: 'Internal server error processing request URL' }, { status: 500 });
  }
  
  const overviewFilePath = path.join(storageBasePath, org, repo, branch, 'ai-repo-overview.md');

  try {
    // Check if file exists first
    if (!fs.existsSync(overviewFilePath)) {
      console.log(`Overview file not found: ${overviewFilePath}`);
      return NextResponse.json({ error: 'AI overview file not found.' }, { status: 404 });
    }

    // Read the file content
    const markdownContent = fs.readFileSync(overviewFilePath, 'utf-8');
    console.log(`Returning overview content from: ${overviewFilePath}`);

    // Return the content as plain text or JSON
    return new NextResponse(markdownContent, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown' }, // Set correct content type
    });

    // // Or return as JSON:
    // return NextResponse.json({ content: markdownContent }, { status: 200 });

  } catch (error: any) {
    console.error(`Error reading overview file ${overviewFilePath}:`, error);
    // Avoid leaking detailed error info unless necessary
    return NextResponse.json({ error: 'Failed to retrieve AI overview.' }, { status: 500 });
  }
} 