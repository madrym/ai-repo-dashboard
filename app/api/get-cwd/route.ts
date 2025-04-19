import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    // Get current working directory as base
    const cwd = process.cwd();
    
    // Path to the storage directory where repositories are stored
    const storageBasePath = path.join(cwd, 'storage', 'repos');
    
    let repoInfo = {
      path: '',
      organization: '',
      repository: '',
      branch: ''
    };
    
    try {
      // Check if the storage directory exists
      await fs.stat(storageBasePath);
      
      // Get organizations
      const organizations = await fs.readdir(storageBasePath);
      
      if (organizations.length > 0) {
        // Use the first organization found (or query param in future)
        const org = organizations[0];
        repoInfo.organization = org;
        
        // Get repositories
        const reposPath = path.join(storageBasePath, org);
        const repositories = await fs.readdir(reposPath);
        
        if (repositories.length > 0) {
          // Use the first repository found (or query param in future)
          const repo = repositories[0];
          repoInfo.repository = repo;
          
          // Get branches
          const branchesPath = path.join(reposPath, repo);
          const branches = await fs.readdir(branchesPath);
          
          if (branches.length > 0) {
            // Use the first branch found (or query param in future)
            const branch = branches[0];
            repoInfo.branch = branch;
            
            // Full path to the repository code
            const repoPath = path.join(branchesPath, branch, 'code');
            
            // Verify code directory exists
            try {
              await fs.stat(repoPath);
              repoInfo.path = repoPath;
            } catch (e) {
              console.error('Repository code directory not found:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error finding repository in storage directory:', error);
    }
    
    return NextResponse.json({
      cwd: repoInfo.path || cwd,
      repoInfo: repoInfo,
      storageBasePath,
      originalCwd: cwd,
      homeDir: os.homedir(),
      platform: os.platform()
    });
  } catch (error) {
    console.error('Error getting repository directory:', error);
    return NextResponse.json({ error: 'Failed to get repository directory' }, { status: 500 });
  }
} 