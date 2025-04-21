import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { parseRepositoryUrl } from "@/lib/github";
import { REPO_STORAGE_DIR } from "@/lib/services/repomix-generator";

interface FeatureSpecRequest {
  id: string;
  title: string;
  repositoryUrl: string;
}

// Type for the feature spec metadata
interface FeatureSpec {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  lastUpdated: string;
  author: string;
  path: string;
}

// Templates for feature spec files
function generateFinalSpecTemplate(id: string, title: string): string {
  return `# ${id}: ${title}\n\n## Overview\n\nBrief overview of the feature.\n\n## Detailed Specification\n\nDetailed specification of the feature, including technical details, API endpoints, database schema changes, etc.\n\n## UI/UX Design\n\nUI/UX design details, mockups, wireframes, etc.\n\n## Testing Strategy\n\nTesting strategy for the feature, including unit tests, integration tests, end-to-end tests, etc.\n\n## Deployment and Rollout Plan\n\nHow the feature will be deployed and rolled out to users.\n\n## Monitoring and Analytics\n\nHow the feature will be monitored and what analytics will be collected.\n`;
}

function generateDraftTemplate(id: string, title: string, version: string): string {
  return `# ${id}: ${title} - Draft ${version}\n\n_This is an initial draft of the feature specification._\n\n## Overview\n\nBrief overview of the feature.\n\n## Proposed Solution\n\nProposed solution for the feature.\n\n## Open Questions\n\nList of open questions that need to be answered before finalizing the specification.\n`;
}

function generateMetadataTemplate(id: string, title: string, date: string, org?: string, repo?: string, branch?: string): string {
  return `# Feature Specification Metadata\n\n- ID: ${id}\n- Title: ${title}\n- Status: PLANNED\n- Created: ${date}\n- Last Updated: ${date}\n- Author: System\n${org ? `- Repository: ${org}/${repo}\n` : ''}${branch ? `- Branch: ${branch}\n` : ''}\n\n## Description\n\nAdd a brief description of the feature here.\n\n## Stakeholders\n\n- Product Manager: TBD\n- Engineering Lead: TBD\n- UX Designer: TBD\n\n## Priority and Timeline\n\n- Priority: MEDIUM\n- Estimated Effort: TBD\n- Target Release: TBD\n\n## Dependencies\n\n- None identified yet\n\n## Tags\n\n- New Feature\n- MVP\n`;
}

function generateArchitectureTemplate(id: string, title: string): string {
  return `# ${id}: ${title} - Architecture\n\n## Overview\n\nBrief overview of the architecture of the feature.\n\n## Components\n\nList of components that make up the feature.\n\n## Data Flow\n\nDescription of how data flows between components.\n\n## Security Considerations\n\nSecurity considerations for the feature.\n\n## Performance Considerations\n\nPerformance considerations for the feature.\n\n## Scalability Considerations\n\nScalability considerations for the feature.\n`;
}

function generatePlanningTemplate(id: string, title: string): string {
  return `# ${id}: ${title} - Planning\n\n## Goals\n\nGoals of the feature.\n\n## Non-Goals\n\nWhat is explicitly not part of the feature.\n\n## Success Metrics\n\nHow the success of the feature will be measured.\n\n## Implementation Strategy\n\nHow the feature will be implemented.\n\n## Timeline\n\nEstimated timeline for implementation.\n\n## Resources\n\nResources required for implementation.\n`;
}

function generateTaskTemplate(id: string, title: string): string {
  return `# ${id}: ${title} - Tasks\n\n## To Do\n\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n## In Progress\n\n_No tasks in progress yet._\n\n## Done\n\n_No tasks completed yet._\n\n## Notes\n\n_No notes yet._\n`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Read parameters sent from the frontend
    const { 
      id, 
      title, 
      org, 
      repo, 
      branch, 
      description, // Add description, problem, outOfScope if needed
      problem, 
      outOfScope, 
      useAiGeneration // Add useAiGeneration if needed by backend logic
    } = body;

    // Validation for new parameters
    if (!id || !title || !org || !repo || !branch) {
      return NextResponse.json(
        { error: "Feature ID, title, org, repo, and branch are required" },
        { status: 400 }
      );
    }

    // Use provided org, repo, branch
    const owner = org;
    
    // Format ID (assuming it comes pre-slugified from frontend)
    const formattedId = id.trim().toLowerCase(); // Use lowercase for consistency
    // Create a safe directory name
    const dirName = formattedId; // Use the ID directly as dir name
    
    // Define the full path for storage using provided parameters
    const featurePath = path.join(REPO_STORAGE_DIR, owner, repo, branch, "feature-specs", dirName);

    // Check if the feature spec already exists
    try {
      await fs.access(featurePath);
      return NextResponse.json(
        { error: `Feature spec with ID ${formattedId} already exists` },
        { status: 409 }
      );
    } catch (error) {
      // This is expected if the directory doesn't exist, we continue
    }

    // Create the main directories
    await fs.mkdir(featurePath, { recursive: true });
    await fs.mkdir(path.join(featurePath, "history"), { recursive: true });
    await fs.mkdir(path.join(featurePath, "plan"), { recursive: true });

    // Current date for the templates
    const currentDate = new Date().toISOString().split("T")[0];

    // Create the template files
    const files = [
      {
        path: path.join(featurePath, "final-spec.md"),
        content: generateFinalSpecTemplate(formattedId, title),
      },
      {
        path: path.join(featurePath, "history", "draft-1.md"),
        content: generateDraftTemplate(formattedId, title, "1"),
      },
      {
        path: path.join(featurePath, "metadata.md"),
        content: generateMetadataTemplate(formattedId, title, currentDate, org, repo, branch),
      },
      {
        path: path.join(featurePath, "architecture.md"),
        content: generateArchitectureTemplate(formattedId, title),
      },
      {
        path: path.join(featurePath, "plan", "PLANNING.md"),
        content: generatePlanningTemplate(formattedId, title),
      },
      {
        path: path.join(featurePath, "plan", "TASK.md"),
        content: generateTaskTemplate(formattedId, title),
      },
    ];

    // Write all files
    for (const file of files) {
      await fs.writeFile(file.path, file.content);
    }

    return NextResponse.json({
      success: true,
      id: formattedId,
      title,
      path: featurePath,
      repository: {
        owner,
        repo,
        branch
      }
    });
  } catch (error) {
    console.error("Error creating feature spec:", error);
    return NextResponse.json(
      { error: "Failed to create feature specification", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Read org, repo, and branch directly from searchParams
    const org = searchParams.get('org');
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch');

    // Validate the required parameters
    if (!org || !repo || !branch) {
      return NextResponse.json(
        { error: "Organization, repository, and branch parameters are required" },
        { status: 400 }
      );
    }

    // No need to parse repositoryUrl anymore
    // const repositoryUrl = searchParams.get('repositoryUrl');
    // if (!repositoryUrl) { ... }
    // const repoInfo = parseRepositoryUrl(repositoryUrl);
    // if (!repoInfo) { ... }
    // const { owner, repo: repoName } = repoInfo; // Renamed repo to avoid conflict

    // Use the provided org, repo, and branch
    const owner = org; // Use org directly
    // Use repo directly

    // Get all feature specs
    const featureSpecs: FeatureSpec[] = [];

    // Define the feature specs path using the correct parameters
    const featureSpecsPath = path.join(REPO_STORAGE_DIR, owner, repo, branch, "features");

    // Check if the directory exists
    try {
      await fs.access(featureSpecsPath);
    } catch (error) {
      // Create the directory if it doesn't exist
      await fs.mkdir(featureSpecsPath, { recursive: true });
      return NextResponse.json({ featureSpecs });
    }
    
    // Read the directory to get all feature specs
    const entries = await fs.readdir(featureSpecsPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("feature-")) {
        const dirPath = path.join(featureSpecsPath, entry.name);
        const metadataPath = path.join(dirPath, "metadata.md");
        
        try {
          // Check if metadata file exists
          await fs.access(metadataPath);
          
          // Read metadata to extract basic info
          const metadataContent = await fs.readFile(metadataPath, "utf-8");
          
          // Extract ID and title from metadata
          const idMatch = metadataContent.match(/ID:\s*([A-Z0-9-]+)/);
          const titleMatch = metadataContent.match(/Title:\s*(.+)$/m);
          const statusMatch = metadataContent.match(/Status:\s*(.+)$/m);
          const createdMatch = metadataContent.match(/Created:\s*(.+)$/m);
          const updatedMatch = metadataContent.match(/Last Updated:\s*(.+)$/m);
          const authorMatch = metadataContent.match(/Author:\s*(.+)$/m);
          const descriptionMatch = metadataContent.match(/## Description\s*\n\s*(.+)$/m);
          
          if (idMatch && titleMatch) {
            featureSpecs.push({
              id: idMatch[1],
              title: titleMatch[1],
              description: descriptionMatch ? descriptionMatch[1] : "",
              status: statusMatch ? statusMatch[1].toLowerCase() : "planned",
              createdAt: createdMatch ? createdMatch[1] : "",
              lastUpdated: updatedMatch ? updatedMatch[1] : "",
              author: authorMatch ? authorMatch[1] : "",
              path: dirPath,
            });
          }
        } catch (error) {
          // Skip directories with missing or invalid metadata
          continue;
        }
      }
    }
    
    return NextResponse.json({ featureSpecs });
  } catch (error) {
    console.error("Error fetching feature specs:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature specifications", details: (error as Error).message },
      { status: 500 }
    );
  }
} 