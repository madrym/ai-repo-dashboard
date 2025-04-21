import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseRepositoryUrl } from "@/lib/github";
import { REPO_STORAGE_DIR } from "@/lib/services/repomix-generator";

// Type definitions for extracted metadata
interface DescriptionMatch {
  captured: string;
}

interface FeatureSpecMetadata {
  stakeholders: string[];
  priority: string;
  estimatedEffort: string;
  dependencies: string[];
  tags: string[];
}

interface HistoryItem {
  version: string;
  title: string;
  content: string;
  date: string;
}

interface RepositoryInfo {
  owner: string;
  repo: string;
  branch: string;
}

// Function to find a feature spec directory by ID
async function findFeatureSpecById(id: string, repositoryUrl: string): Promise<{ path: string, repoInfo: RepositoryInfo } | null> {
  try {
    // Parse repository URL
    const repoInfo = parseRepositoryUrl(repositoryUrl);
    
    if (!repoInfo) {
      throw new Error("Invalid repository URL");
    }
    
    const { owner, repo } = repoInfo;
    const branch = "main"; // Default to main branch
    
    // Format ID for consistency
    const formattedId = id.trim().toUpperCase();
    // Create a safe directory name
    const dirName = `feature-${formattedId}`;
    
    // Define the full path
    const featurePath = path.join(REPO_STORAGE_DIR, owner, repo, branch, "features", dirName);
    
    // Check if the directory exists
    await fs.access(featurePath);
    
    return { 
      path: featurePath,
      repoInfo: { owner, repo, branch }
    };
  } catch (error) {
    console.error(`Error finding feature spec for ID ${id}:`, error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const repositoryUrl = searchParams.get('repositoryUrl');
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }
    
    // Find the feature spec directory
    const featureSpecDir = await findFeatureSpecById(id, repositoryUrl);
    
    if (!featureSpecDir) {
      return NextResponse.json(
        { error: `Feature spec with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    const featurePath = featureSpecDir.path;
    
    // Read the feature spec files
    const finalSpecPath = path.join(featurePath, "final-spec.md");
    const architecturePath = path.join(featurePath, "architecture.md");
    const planningPath = path.join(featurePath, "plan", "PLANNING.md");
    const taskPath = path.join(featurePath, "plan", "TASK.md");
    const metadataPath = path.join(featurePath, "metadata.md");
    const historyPath = path.join(featurePath, "history");
    
    // Read the feature spec files
    const [finalSpecContent, architectureContent, planningContent, taskContent, metadataContent] =
      await Promise.all([
        fs.readFile(finalSpecPath, "utf-8").catch(() => ""),
        fs.readFile(architecturePath, "utf-8").catch(() => ""),
        fs.readFile(planningPath, "utf-8").catch(() => ""),
        fs.readFile(taskPath, "utf-8").catch(() => ""),
        fs.readFile(metadataPath, "utf-8").catch(() => ""),
      ]);
    
    // Extract metadata
    const stakeholders = (metadataContent.match(/Stakeholders:[^\n]*(?:\n[^\n]+)*/i)?.[0].match(/- [^:]+: [^\n]+/g) || [])
      .map(s => s.trim());
    
    const priorityMatch = metadataContent.match(/Priority:\s*(.+)$/m);
    const estimatedEffortMatch = metadataContent.match(/Estimated Effort:\s*(.+)$/m);
    const dependenciesMatch = metadataContent.match(/Dependencies:[^\n]*(?:\n- [^\n]+)*/i)?.[0];
    const tagsMatch = metadataContent.match(/Tags:[^\n]*(?:\n- [^\n]+)*/i)?.[0];
    
    const dependencies = (dependenciesMatch?.match(/- [^\n]+/g) || [])
      .map(d => d.replace(/^- /, "").trim());
    
    const tags = (tagsMatch?.match(/- [^\n]+/g) || [])
      .map(t => t.replace(/^- /, "").trim());
    
    // Parse basic metadata
    const idMatch = metadataContent.match(/ID:\s*([A-Z0-9-]+)/);
    const titleMatch = metadataContent.match(/Title:\s*(.+)$/m);
    const statusMatch = metadataContent.match(/Status:\s*(.+)$/m);
    const createdMatch = metadataContent.match(/Created:\s*(.+)$/m);
    const updatedMatch = metadataContent.match(/Last Updated:\s*(.+)$/m);
    const authorMatch = metadataContent.match(/Author:\s*(.+)$/m);
    const descriptionMatch = metadataContent.match(/## Description\s*\n\s*(.+)$/m);
    
    // Get history files
    const historyEntries = await fs.readdir(historyPath, { withFileTypes: true });
    const historyFiles = historyEntries
      .filter(entry => entry.isFile() && entry.name.endsWith(".md") && entry.name.startsWith("draft-"))
      .map(entry => entry.name);
    
    // Read history files
    const historyItems: HistoryItem[] = [];
    for (const file of historyFiles) {
      try {
        const historyContent = await fs.readFile(path.join(historyPath, file), "utf-8");
        const versionMatch = file.match(/draft-(\d+)/i);
        const titleFromHistoryMatch = historyContent.match(/# [^:]+: (.+?) - Draft/);
        
        if (versionMatch) {
          historyItems.push({
            version: versionMatch[1],
            title: titleFromHistoryMatch?.[1] || "",
            content: historyContent,
            date: createdMatch?.[1] || "", // Use created date as fallback
          });
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`Error reading history file ${file}:`, error);
      }
    }
    
    // Sort history items by version (newest first)
    historyItems.sort((a, b) => parseInt(b.version) - parseInt(a.version));
    
    // Construct the response
    return NextResponse.json({
      featureSpec: {
        id: idMatch?.[1] || id,
        title: titleMatch?.[1] || "",
        description: descriptionMatch?.[1] || "",
        status: statusMatch?.[1]?.toLowerCase() || "planned",
        createdAt: createdMatch?.[1] || "",
        lastUpdated: updatedMatch?.[1] || "",
        author: authorMatch?.[1] || "",
        path: featurePath,
        finalSpec: finalSpecContent,
        architecture: architectureContent,
        planning: planningContent,
        tasks: taskContent,
        history: historyItems,
        metadata: {
          stakeholders,
          priority: priorityMatch?.[1] || "MEDIUM",
          estimatedEffort: estimatedEffortMatch?.[1] || "TBD",
          dependencies,
          tags,
        },
        repository: featureSpecDir.repoInfo
      },
    });
  } catch (error) {
    console.error("Error fetching feature spec:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature specification", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { section, content, comment, repositoryUrl } = body;
    
    if (!section || !content) {
      return NextResponse.json(
        { error: "Section and content are required" },
        { status: 400 }
      );
    }
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }
    
    // Find the feature spec directory
    const featureSpecDir = await findFeatureSpecById(id, repositoryUrl);
    
    if (!featureSpecDir) {
      return NextResponse.json(
        { error: `Feature spec with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    const featurePath = featureSpecDir.path;
    
    // Determine which file to update
    let filePath;
    switch (section) {
      case "finalSpec":
        filePath = path.join(featurePath, "final-spec.md");
        break;
      case "architecture":
        filePath = path.join(featurePath, "architecture.md");
        break;
      case "planning":
        filePath = path.join(featurePath, "plan", "PLANNING.md");
        break;
      case "tasks":
        filePath = path.join(featurePath, "plan", "TASK.md");
        break;
      default:
        return NextResponse.json(
          { error: `Invalid section: ${section}` },
          { status: 400 }
        );
    }
    
    // Update the file
    await fs.writeFile(filePath, content);
    
    // Update the last updated date in metadata
    const metadataPath = path.join(featurePath, "metadata.md");
    try {
      const metadataContent = await fs.readFile(metadataPath, "utf-8");
      const updatedDate = new Date().toISOString().split("T")[0];
      
      // Replace the last updated date
      const updatedMetadata = metadataContent.replace(
        /Last Updated:\s*.+$/m,
        `Last Updated: ${updatedDate}`
      );
      
      // Write the updated metadata
      await fs.writeFile(metadataPath, updatedMetadata);
      
      // Create a new history entry if there's a substantive change
      if (section === "finalSpec" && comment) {
        const historyPath = path.join(featurePath, "history");
        const historyEntries = await fs.readdir(historyPath, { withFileTypes: true });
        
        // Find the highest draft version
        const draftVersions = historyEntries
          .filter(entry => entry.isFile() && entry.name.startsWith("draft-") && entry.name.endsWith(".md"))
          .map(entry => {
            const match = entry.name.match(/draft-(\d+)\.md/i);
            return match ? parseInt(match[1]) : 0;
          });
        
        const nextVersion = Math.max(0, ...draftVersions) + 1;
        const draftFileName = `draft-${nextVersion}.md`;
        
        // Read the title from the final spec
        const titleMatch = content.match(/# ([^:]+): (.+?)(?:\n|$)/);
        const title = titleMatch ? titleMatch[2] : "Updated Specification";
        
        // Create the draft content
        const draftContent = `# ${id}: ${title} - Draft ${nextVersion}\n\n_${comment}_\n\n${content}`;
        
        // Write the draft file
        await fs.writeFile(path.join(historyPath, draftFileName), draftContent);
      }
      
      return NextResponse.json({
        success: true,
        message: "Feature spec updated successfully",
      });
    } catch (error) {
      console.error("Error updating metadata:", error);
      
      // Even if metadata update fails, we succeeded in updating the main content
      return NextResponse.json({
        success: true,
        message: "Feature spec updated successfully, but failed to update metadata",
      });
    }
  } catch (error) {
    console.error("Error updating feature spec:", error);
    return NextResponse.json(
      { error: "Failed to update feature specification", details: (error as Error).message },
      { status: 500 }
    );
  }
} 