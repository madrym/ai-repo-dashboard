import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getRepomixSummaryPath, getCodePath } from '../repomix-summary/utils';

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner') || 'example';
    const repo = url.searchParams.get('repo') || 'repo';
    const branch = url.searchParams.get('branch') || 'main';
    
    // Check storage directories
    const storagePath = path.join(process.cwd(), 'storage');
    const reposPath = path.join(storagePath, 'repos');
    const repoPath = path.join(reposPath, owner, repo);
    const branchPath = path.join(repoPath, branch);
    const codePath = getCodePath(owner, repo, branch);
    const repomixPath = getRepomixSummaryPath(owner, repo, branch);
    
    // Check existence
    const storageExists = fs.existsSync(storagePath);
    const reposExists = fs.existsSync(reposPath);
    const repoExists = fs.existsSync(repoPath);
    const branchExists = fs.existsSync(branchPath);
    const codeExists = fs.existsSync(codePath);
    const repomixExists = fs.existsSync(repomixPath);
    
    // Return debug info
    return NextResponse.json({
      currentDirectory: process.cwd(),
      paths: {
        storage: storagePath,
        repos: reposPath,
        repo: repoPath,
        branch: branchPath,
        code: codePath,
        repomix: repomixPath,
      },
      exists: {
        storage: storageExists,
        repos: reposExists,
        repo: repoExists,
        branch: branchExists,
        code: codeExists,
        repomix: repomixExists,
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug endpoint error' }, { status: 500 });
  }
} 