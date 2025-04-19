import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { FileNode } from '@/lib/github/types';

// Set up the local storage directory for cloned repositories
const REPO_STORAGE_DIR = path.join(process.cwd(), 'storage', 'repos');

/**
 * Recursively builds a file tree from the directory
 * @param dir Directory to scan
 * @param basePath Base path for relative paths
 * @returns File tree structure
 */
async function buildFileTree(dir: string, basePath: string = ''): Promise<FileNode[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const result: FileNode[] = [];
  
  for (const entry of entries) {
    // Skip .git directories and node_modules for performance
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    
    const relativePath = path.join(basePath, entry.name);
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, relativePath);
      result.push({
        name: entry.name,
        type: 'directory',
        children
      });
    } else {
      result.push({
        name: entry.name,
        type: 'file',
        path: relativePath
      });
    }
  }
  
  // Sort directories first, then files alphabetically
  result.sort((a, b) => {
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
  
  return result;
}

/**
 * POST /api/repositories/local-structure
 * Gets the file structure of a locally cloned repository
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo } = body;
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Repository owner and name are required' },
        { status: 400 }
      );
    }
    
    // Construct the path to the repository
    const repoDir = path.join(REPO_STORAGE_DIR, owner, repo);
    
    // Check if the repository exists
    if (!fs.existsSync(repoDir)) {
      return NextResponse.json(
        { error: 'Repository not found locally' },
        { status: 404 }
      );
    }
    
    try {
      // Build the file tree
      const fileTree = await buildFileTree(repoDir);
      
      // Return the file structure
      return NextResponse.json({
        success: true,
        owner,
        repo,
        fileTree
      });
    } catch (error) {
      console.error('Error building file tree:', error);
      return NextResponse.json(
        { error: 'Failed to build file tree' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling structure request:', error);
    
    return NextResponse.json(
      { error: 'Failed to get repository structure' },
      { status: 500 }
    );
  }
} 