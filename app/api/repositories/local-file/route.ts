import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Set up the local storage directory for cloned repositories
const REPO_STORAGE_DIR = path.join(process.cwd(), 'storage', 'repos');

/**
 * POST /api/repositories/local-file
 * Retrieves file content from a locally cloned repository
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo, filePath } = body;
    
    // Debug incoming request
    console.log("Local file request received:", { owner, repo, filePath });
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Repository owner and name are required' },
        { status: 400 }
      );
    }
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Construct the full path to the file
    const repoDir = path.join(REPO_STORAGE_DIR, owner, repo);
    const fullPath = path.join(repoDir, filePath);
    
    console.log("Constructed file path:", fullPath);
    console.log("Repository directory exists:", fs.existsSync(repoDir));
    
    // Make sure the path stays inside the repository directory (prevent path traversal attacks)
    if (!fullPath.startsWith(repoDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    // Check if the repository exists
    if (!fs.existsSync(repoDir)) {
      console.log("Repository directory not found:", repoDir);
      return NextResponse.json(
        { error: 'Repository not found locally' },
        { status: 404 }
      );
    }
    
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      console.log("File not found:", fullPath);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Check if the path is a directory
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      console.log("Path points to a directory, not a file:", fullPath);
      return NextResponse.json(
        { error: 'Path points to a directory, not a file' },
        { status: 400 }
      );
    }
    
    try {
      // Read the file content
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      
      // Log content details
      console.log("File read successfully:", {
        filePath,
        size: stats.size,
        contentLength: content.length,
        firstFewChars: content.substring(0, 50)
      });
      
      // Determine file type
      const extension = path.extname(fullPath).substring(1); // Remove the dot
      
      // Return file content and metadata
      return NextResponse.json({
        success: true,
        filePath,
        content,
        size: stats.size,
        extension,
        lastModified: stats.mtime
      });
    } catch (error) {
      console.error('Error reading file:', error);
      return NextResponse.json(
        { error: 'Failed to read file' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling file request:', error);
    
    return NextResponse.json(
      { error: 'Failed to get file content' },
      { status: 500 }
    );
  }
} 