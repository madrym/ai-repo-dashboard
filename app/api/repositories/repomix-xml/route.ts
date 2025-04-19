import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Create a simple in-memory cache for API results
const responseCache = new Map<string, {data: string, timestamp: number}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch') || 'main';
    
    // Create a cache key
    const cacheKey = `${owner}/${repo}/${branch}`;
    
    // Check cache first
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      console.log(`Using cached XML response for ${cacheKey}`);
      return new NextResponse(cachedResponse.data, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
    }
    
    console.log(`Accessing repomix XML for ${owner}/${repo} (${branch})`);
    
    // Validate parameters
    if (!owner || !repo) {
      console.log('Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo' },
        { status: 400 }
      );
    }
    
    // Try multiple possible paths for the repository's repomix file
    const possiblePaths = [
      // Original path
      path.join(process.env.REPO_STORAGE_PATH || './storage', owner, repo, 'repomix-output.xml'),
      // With branch
      path.join(process.env.REPO_STORAGE_PATH || './storage', owner, repo, branch, 'repomix-output.xml'),
      // With 'repos' directory
      path.join(process.env.REPO_STORAGE_PATH || './storage/repos', owner, repo, 'repomix-output.xml'),
      // With 'repos' directory and branch
      path.join(process.env.REPO_STORAGE_PATH || './storage/repos', owner, repo, branch, 'repomix-output.xml'),
      // Main/code variations
      path.join(process.env.REPO_STORAGE_PATH || './storage', owner, repo, 'main', 'code', 'repomix-output.xml'),
      path.join(process.env.REPO_STORAGE_PATH || './storage', owner, repo, 'code', 'main', 'repomix-output.xml'),
      path.join(process.env.REPO_STORAGE_PATH || './storage/repos', owner, repo, 'main', 'code', 'repomix-output.xml'),
      path.join(process.env.REPO_STORAGE_PATH || './storage/repos', owner, repo, 'code', 'main', 'repomix-output.xml')
    ];
    
    let foundPath = null;
    
    // Try each path until we find one that exists
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log(`Found repomix file at: ${testPath}`);
        foundPath = testPath;
        break;
      }
    }
    
    // If no valid path was found, return an error
    if (!foundPath) {
      console.log('No repomix file found in any of the expected locations');
      return NextResponse.json(
        { error: 'Repomix file not found in any of the expected locations' },
        { status: 404 }
      );
    }
    
    // Read the repomix file
    const fileContent = fs.readFileSync(foundPath, 'utf8');
    console.log(`Read ${fileContent.length} bytes from ${foundPath}`);
    
    // Check if the content is valid XML
    const looksLikeXml = fileContent.trim().startsWith('<?xml') || 
                         fileContent.trim().startsWith('<');
    
    let responseContent: string;
    
    if (!looksLikeXml) {
      console.log('File does not appear to be valid XML, converting to XML format');
      // If it's not XML, create a simple XML wrapper for the content
      responseContent = `<?xml version="1.0" encoding="UTF-8"?>
<repository>
  <overview>Repository analysis from repomix</overview>
  <content><![CDATA[${fileContent}]]></content>
</repository>`;
    } else {
      responseContent = fileContent;
    }
    
    // Store in cache
    responseCache.set(cacheKey, {
      data: responseContent,
      timestamp: Date.now()
    });
    
    // Return the content as XML
    return new NextResponse(responseContent, {
      headers: {
        'Content-Type': 'application/xml'
      }
    });
    
  } catch (error) {
    console.error('Error fetching repomix XML:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 