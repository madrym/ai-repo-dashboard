import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

// Convert exec to promise-based
const execPromise = util.promisify(exec);

/**
 * Base directory for repository storage
 */
export const REPO_STORAGE_DIR = path.join(process.cwd(), 'storage', 'repos');

/**
 * Get the path to a repository's branch directory
 */
export function getRepoBranchDir(owner: string, repo: string, branch = 'main'): string {
  return path.join(REPO_STORAGE_DIR, owner, repo, branch);
}

/**
 * Get the path to a repository's code directory
 */
export function getRepoCodeDir(owner: string, repo: string, branch = 'main'): string {
  return path.join(getRepoBranchDir(owner, repo, branch), 'code');
}

/**
 * Get the path to a repository's repomix output file
 */
export function getRepomixOutputPath(owner: string, repo: string, branch = 'main'): string {
  return path.join(getRepoBranchDir(owner, repo, branch), 'repomix-output.xml');
}

/**
 * Get the path to a repository's specs directory
 */
export function getRepoSpecsDir(owner: string, repo: string, branch = 'main'): string {
  return path.join(getRepoBranchDir(owner, repo, branch), 'specs');
}

/**
 * Check if repomix command is installed
 */
export async function checkRepomixInstalled(): Promise<boolean> {
  try {
    await execPromise('repomix --version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a repomix summary for a repository
 */
export async function generateRepomixSummary(
  owner: string, 
  repo: string, 
  branch = 'main'
): Promise<{ success: boolean; error?: string; outputPath?: string }> {
  try {
    // Check if repomix is installed
    const isRepomixInstalled = await checkRepomixInstalled();
    if (!isRepomixInstalled) {
      return { 
        success: false, 
        error: 'Repomix command not found. Install it with: npm install -g repomix' 
      };
    }
    
    // Get paths
    const codeDir = getRepoCodeDir(owner, repo, branch);
    const branchDir = getRepoBranchDir(owner, repo, branch);
    const outputPath = getRepomixOutputPath(owner, repo, branch);
    
    // Make sure the repository code directory exists
    if (!fs.existsSync(codeDir)) {
      return { 
        success: false, 
        error: `Repository code directory not found: ${codeDir}` 
      };
    }
    
    // Create specs directory if it doesn't exist
    const specsDir = getRepoSpecsDir(owner, repo, branch);
    if (!fs.existsSync(specsDir)) {
      await fs.promises.mkdir(specsDir, { recursive: true });
    }
    
    // Remove any existing repomix output file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    // Run repomix from the branch directory
    console.log(`Generating repomix summary for ${owner}/${repo}/${branch}...`);
    await execPromise(`cd ${branchDir} && repomix --compress ./code`);
    
    // Check if output was generated
    if (fs.existsSync(outputPath)) {
      return { 
        success: true, 
        outputPath 
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to generate repomix summary. No output file was created.' 
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating repomix summary:', errorMessage);
    return { 
      success: false, 
      error: `Failed to generate repomix summary: ${errorMessage}` 
    };
  }
} 