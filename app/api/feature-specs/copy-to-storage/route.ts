import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseRepositoryUrl } from "@/lib/github";
import { REPO_STORAGE_DIR } from "@/lib/services/repomix-generator";

// Define the source path
const SOURCE_PATH = ".ai/feature-specs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, repositoryUrl } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Feature spec ID is required" },
        { status: 400 }
      );
    }

    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Parse repository URL
    const repoInfo = parseRepositoryUrl(repositoryUrl);
    
    if (!repoInfo) {
      return NextResponse.json(
        { error: "Invalid repository URL" },
        { status: 400 }
      );
    }

    const { owner, repo } = repoInfo;
    const branch = "main"; // Default to main branch

    // Format ID for consistency
    const formattedId = id.trim().toUpperCase();
    // Create the directory name
    const sourceDirName = `feature-${formattedId}`;
    // Define full paths
    const sourcePath = path.join(SOURCE_PATH, sourceDirName);
    const targetPath = path.join(REPO_STORAGE_DIR, owner, repo, branch, 'features', sourceDirName);

    // Check if the source feature spec exists
    try {
      await fs.access(sourcePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Feature spec with ID ${formattedId} not found` },
        { status: 404 }
      );
    }

    // Create target directory recursively
    await fs.mkdir(targetPath, { recursive: true });

    // Copy function to recursively copy directories
    const copyDir = async (src: string, dest: string) => {
      // Create destination directory
      await fs.mkdir(dest, { recursive: true });
      
      // Read source directory
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively copy directory
          await copyDir(srcPath, destPath);
        } else {
          // Copy file
          await fs.copyFile(srcPath, destPath);
        }
      }
    };

    // Copy the feature spec directory recursively
    await copyDir(sourcePath, targetPath);

    return NextResponse.json({
      success: true,
      message: `Feature spec ${formattedId} copied to ${targetPath}`,
      sourcePath,
      targetPath,
      repository: {
        owner,
        repo,
        branch
      }
    });
  } catch (error) {
    console.error("Error copying feature spec:", error);
    return NextResponse.json(
      { error: "Failed to copy feature specification", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Also add a GET endpoint to copy all feature specs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const repositoryUrl = searchParams.get('repositoryUrl');
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }
    
    // Parse repository URL
    const repoInfo = parseRepositoryUrl(repositoryUrl);
    
    if (!repoInfo) {
      return NextResponse.json(
        { error: "Invalid repository URL" },
        { status: 400 }
      );
    }
    
    const { owner, repo } = repoInfo;
    const branch = "main"; // Default to main branch
    
    // Define target path using the repository information
    const targetFeaturePath = path.join(REPO_STORAGE_DIR, owner, repo, branch, 'features');
    
    // Ensure target directory exists
    await fs.mkdir(targetFeaturePath, { recursive: true });
    
    // Check if the source directory exists
    try {
      await fs.access(SOURCE_PATH);
    } catch (error) {
      return NextResponse.json(
        { error: "Source feature specs directory not found" },
        { status: 404 }
      );
    }
    
    // Read all entries in the source directory
    const entries = await fs.readdir(SOURCE_PATH, { withFileTypes: true });
    const featureDirs = entries.filter(entry => 
      entry.isDirectory() && entry.name.startsWith("feature-")
    );
    
    // Copy function to recursively copy directories
    const copyDir = async (src: string, dest: string) => {
      // Create destination directory
      await fs.mkdir(dest, { recursive: true });
      
      // Read source directory
      const entries = await fs.readdir(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively copy directory
          await copyDir(srcPath, destPath);
        } else {
          // Copy file
          await fs.copyFile(srcPath, destPath);
        }
      }
    };
    
    // Copy each feature spec directory
    const results = [];
    for (const dir of featureDirs) {
      const sourcePath = path.join(SOURCE_PATH, dir.name);
      const targetPath = path.join(targetFeaturePath, dir.name);
      
      await copyDir(sourcePath, targetPath);
      
      results.push({
        id: dir.name,
        sourcePath,
        targetPath
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Copied ${results.length} feature specs to ${targetFeaturePath}`,
      copies: results,
      repository: {
        owner,
        repo,
        branch
      }
    });
  } catch (error) {
    console.error("Error copying all feature specs:", error);
    return NextResponse.json(
      { error: "Failed to copy feature specifications", details: (error as Error).message },
      { status: 500 }
    );
  }
} 