import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Define the base feature spec path
const FEATURE_SPEC_BASE_PATH = ".ai/feature-specs";

interface FeatureSpecMetadata {
  stakeholders: string[];
  priority: string;
  estimatedEffort: string;
  dependencies: string[];
  tags: string[];
}

interface HistoryItem {
  version: string;
  date: string;
  content: string;
}

interface FeatureSpec {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  lastUpdated: string;
  author: string;
  path: string;
  finalSpec: string;
  metadata: FeatureSpecMetadata;
  architecture: string;
  planning: string;
  tasks: string;
  history: HistoryItem[];
}

export async function GET(
  request: Request,
  { params }: { params: { org: string; repo: string; branch: string; id: string } }
) {
  try {
    const { org, repo, branch, id } = params;
    
    // Log for debugging
    console.log(`Fetching feature spec ${id} for ${org}/${repo}/${branch}`);
    
    // Format ID for consistency
    const formattedId = id.trim().toUpperCase();
    // Create a safe directory name
    const dirName = `feature-${formattedId}`;
    // Define the full path
    const featurePath = path.join(FEATURE_SPEC_BASE_PATH, dirName);
    
    // Check if the feature spec exists
    try {
      await fs.access(featurePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Feature spec with ID ${formattedId} not found` },
        { status: 404 }
      );
    }
    
    // Read all the feature spec files
    const metadataPath = path.join(featurePath, "metadata.md");
    const finalSpecPath = path.join(featurePath, "final-spec.md");
    const architecturePath = path.join(featurePath, "architecture.md");
    const planningPath = path.join(featurePath, "plan", "PLANNING.md");
    const tasksPath = path.join(featurePath, "plan", "TASK.md");
    const historyDir = path.join(featurePath, "history");
    
    // Read metadata content
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    
    // Extract metadata information
    const idMatch = metadataContent.match(/ID:\s*([A-Z0-9-]+)/);
    const titleMatch = metadataContent.match(/Title:\s*(.+)$/m);
    const statusMatch = metadataContent.match(/Status:\s*(.+)$/m);
    const createdMatch = metadataContent.match(/Created:\s*(.+)$/m);
    const updatedMatch = metadataContent.match(/Last Updated:\s*(.+)$/m);
    const authorMatch = metadataContent.match(/Author:\s*(.+)$/m);
    const descriptionMatch = metadataContent.match(/## Description\s*\n\s*(.+)$/m);
    const stakeholdersMatch = metadataContent.match(/Stakeholders:\s*(.+)$/m);
    const priorityMatch = metadataContent.match(/Priority:\s*(.+)$/m);
    const effortMatch = metadataContent.match(/Estimated Effort:\s*(.+)$/m);
    const dependenciesMatch = metadataContent.match(/Dependencies:\s*(.+)$/m);
    
    // Read content of other files
    const finalSpecContent = await fs.readFile(finalSpecPath, "utf-8").catch(() => "");
    const architectureContent = await fs.readFile(architecturePath, "utf-8").catch(() => "");
    const planningContent = await fs.readFile(planningPath, "utf-8").catch(() => "");
    const tasksContent = await fs.readFile(tasksPath, "utf-8").catch(() => "");
    
    // Read history items
    const historyItems: HistoryItem[] = [];
    try {
      const historyFiles = await fs.readdir(historyDir);
      
      // Sort history files by version number
      const sortedHistoryFiles = historyFiles
        .filter(file => file.startsWith("draft-") && file.endsWith(".md"))
        .sort((a, b) => {
          const versionA = parseInt(a.replace("draft-", "").replace(".md", ""));
          const versionB = parseInt(b.replace("draft-", "").replace(".md", ""));
          return versionB - versionA; // Most recent first
        });
      
      // Read content of each history file
      for (const file of sortedHistoryFiles) {
        const filePath = path.join(historyDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        
        // Extract version from filename
        const versionMatch = file.match(/draft-(\d+)\.md/);
        const version = versionMatch ? versionMatch[1] : "unknown";
        
        // Try to extract date from content
        const dateMatch = content.match(/Current Status.*\n.*(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : (updatedMatch ? updatedMatch[1] : "");
        
        historyItems.push({
          version: `Draft ${version}`,
          date,
          content
        });
      }
    } catch (error) {
      console.error("Error reading history files:", error);
    }
    
    // Extract stakeholders, dependencies, and tags
    const stakeholders = stakeholdersMatch 
      ? stakeholdersMatch[1].split(",").map(s => s.trim()).filter(Boolean)
      : [];
      
    const dependencies = dependenciesMatch && dependenciesMatch[1].toLowerCase() !== "none"
      ? dependenciesMatch[1].split(",").map(d => d.trim()).filter(Boolean)
      : [];
      
    // Extract tags from description or set default
    const tags = descriptionMatch 
      ? descriptionMatch[1].match(/#([a-zA-Z0-9-_]+)/g)?.map(tag => tag.substring(1)) || []
      : [];
    
    // Construct the feature spec object
    const featureSpec: FeatureSpec = {
      id: idMatch ? idMatch[1] : formattedId,
      title: titleMatch ? titleMatch[1] : "Unknown",
      description: descriptionMatch ? descriptionMatch[1] : "",
      status: statusMatch ? statusMatch[1].toLowerCase() : "planned",
      createdAt: createdMatch ? createdMatch[1] : "",
      lastUpdated: updatedMatch ? updatedMatch[1] : "",
      author: authorMatch ? authorMatch[1] : "Team",
      path: featurePath,
      finalSpec: finalSpecContent,
      metadata: {
        stakeholders,
        priority: priorityMatch ? priorityMatch[1] : "Medium",
        estimatedEffort: effortMatch ? effortMatch[1] : "Medium",
        dependencies,
        tags
      },
      architecture: architectureContent,
      planning: planningContent,
      tasks: tasksContent,
      history: historyItems
    };
    
    return NextResponse.json({ featureSpec });
  } catch (error) {
    console.error("Error fetching feature spec:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature specification" },
      { status: 500 }
    );
  }
} 