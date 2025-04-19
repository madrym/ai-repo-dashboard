import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { parseRepositoryUrl } from '@/lib/github';
import { 
  REPO_STORAGE_DIR, 
  getRepoCodeDir, 
  getRepoBranchDir,
  generateRepomixSummary
} from '@/lib/services/repomix-generator';

// Convert exec to promise-based
const execPromise = util.promisify(exec);

/**
 * Ensures the repository storage directory exists
 */
async function ensureStorageDir() {
  try {
    await fs.promises.mkdir(REPO_STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
    throw new Error('Failed to create repository storage directory');
  }
}

/**
 * POST /api/repositories/clone
 * Clones a GitHub repository locally
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repositoryUrl } = body;
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }
    
    // Parse repository URL
    const repoIdentifier = parseRepositoryUrl(repositoryUrl);
    
    if (!repoIdentifier) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }
    
    const { owner, repo } = repoIdentifier;
    const repoFullName = `${owner}/${repo}`;
    
    // Get default branch (assume 'main' for now)
    const branch = 'main'; // Could fetch this from GitHub API
    
    // Get paths
    const repoDir = path.join(REPO_STORAGE_DIR, owner, repo);
    const branchDir = getRepoBranchDir(owner, repo, branch);
    const codeDir = getRepoCodeDir(owner, repo, branch);
    
    // Ensure the storage directory exists
    await ensureStorageDir();
    
    // Check if repository already exists locally
    const repoExists = fs.existsSync(codeDir);
    
    if (repoExists) {
      try {
        // Pull latest changes if repo already exists
        console.log(`Updating repository ${repoFullName}...`);
        await execPromise(`cd ${codeDir} && git pull`);
        console.log(`Repository ${repoFullName} updated successfully`);
        
        // Regenerate repomix summary
        const repomixResult = await generateRepomixSummary(owner, repo, branch);
        console.log(`Repomix summary regenerated: ${repomixResult.success}`);
      } catch (error) {
        console.error(`Failed to update repository ${repoFullName}:`, error);
        return NextResponse.json(
          { error: 'Failed to update repository' },
          { status: 500 }
        );
      }
    } else {
      try {
        // Create needed directories
        await fs.promises.mkdir(branchDir, { recursive: true });
        
        // Clone the repository to the code subdirectory
        const githubUrl = `https://github.com/${repoFullName}.git`;
        console.log(`Cloning ${githubUrl} to ${codeDir}...`);
        await execPromise(`git clone ${githubUrl} ${codeDir}`);
        console.log(`Repository ${repoFullName} cloned successfully`);
        
        // Generate repomix summary
        const repomixResult = await generateRepomixSummary(owner, repo, branch);
        if (!repomixResult.success) {
          console.warn(`Warning: Failed to generate repomix summary: ${repomixResult.error}`);
        } else {
          console.log(`Repomix output generated: ${repomixResult.outputPath}`);
        }
      } catch (error) {
        console.error(`Failed to clone repository ${repoFullName}:`, error);
        return NextResponse.json(
          { error: 'Failed to clone repository' },
          { status: 500 }
        );
      }
    }
    
    // Return success response with repository path
    return NextResponse.json({
      success: true,
      repositoryUrl,
      localPath: codeDir,
      owner,
      repo,
      branch,
      fullName: repoFullName
    });
  } catch (error) {
    console.error('Error cloning repository:', error);
    
    return NextResponse.json(
      { error: 'Failed to clone repository' },
      { status: 500 }
    );
  }
} 