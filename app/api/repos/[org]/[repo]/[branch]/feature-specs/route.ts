import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Define the base feature spec path
const FEATURE_SPEC_BASE_PATH = ".ai/feature-specs";

interface FeatureSpecRequest {
  id: string;
  title: string;
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
}

export async function POST(
  request: Request,
  { params }: { params: { org: string; repo: string; branch: string } }
) {
  try {
    const { org, repo, branch } = params;
    
    // Log for debugging
    console.log(`Creating feature spec for ${org}/${repo}/${branch}`);
    
    const body = await request.json();
    const { id, title } = body as FeatureSpecRequest;

    // Validation
    if (!id || !title) {
      return NextResponse.json(
        { error: "Feature ID and title are required" },
        { status: 400 }
      );
    }

    // Format ID for consistency
    const formattedId = id.trim().toUpperCase();
    // Create a safe directory name
    const dirName = `feature-${formattedId}`;
    // Define the full path
    const featurePath = path.join(FEATURE_SPEC_BASE_PATH, dirName);

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
    });
  } catch (error) {
    console.error("Error creating feature spec:", error);
    return NextResponse.json(
      { error: "Failed to create feature specification" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { org: string; repo: string; branch: string } }
) {
  try {
    const { org, repo, branch } = params;
    
    // Log for debugging
    console.log(`Fetching feature specs for ${org}/${repo}/${branch}`);
    
    // Get all feature specs
    const featureSpecs: FeatureSpec[] = [];
    
    // Check if the base directory exists
    try {
      await fs.access(FEATURE_SPEC_BASE_PATH);
    } catch (error) {
      // Create the directory if it doesn't exist
      await fs.mkdir(FEATURE_SPEC_BASE_PATH, { recursive: true });
      return NextResponse.json({ featureSpecs });
    }
    
    // Read the directory to get all feature specs
    const entries = await fs.readdir(FEATURE_SPEC_BASE_PATH, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith("feature-")) {
        const dirPath = path.join(FEATURE_SPEC_BASE_PATH, entry.name);
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
      { error: "Failed to fetch feature specifications" },
      { status: 500 }
    );
  }
}

// Template generators
function generateFinalSpecTemplate(id: string, title: string): string {
  return `# Final Spec – ${id}: ${title}

## Overview
Provide a high-level overview of the feature.

## Goals
- Goal 1
- Goal 2

## Non-Goals
- Non-goal 1

## User Experience
Describe the user experience for this feature. Include mockups if applicable.

## Technical Implementation
Describe the technical implementation details.

## Security Considerations
Describe any security considerations for this feature.

## Privacy Considerations
Describe any privacy considerations for this feature.

## Testing Plan
Describe how this feature will be tested.

## Deployment Plan
Describe how this feature will be deployed.

## Documentation
Describe any documentation needs for this feature.

## Future Work
Describe any future work that might be needed after this feature is implemented.
`;
}

function generateDraftTemplate(id: string, title: string, version: string): string {
  return `# Draft ${version} – ${id}: ${title}

This is draft ${version} of the feature specification for ${title}.

## Current Status
Initial draft.

## Open Questions
- Question 1
- Question 2

## Implementation Ideas
- Idea 1
- Idea 2
`;
}

function generateMetadataTemplate(id: string, title: string, date: string, org: string, repo: string, branch: string): string {
  return `# Metadata – ${id}: ${title}

ID: ${id}
Title: ${title}
Status: planned
Created: ${date}
Last Updated: ${date}
Author: Team
Repository: ${org}/${repo}
Branch: ${branch}
Stakeholders: Engineering, Product
Priority: Medium
Estimated Effort: Medium
Dependencies: None

## Description
This is a feature specification for ${title}.
`;
}

function generateArchitectureTemplate(id: string, title: string): string {
  return `# Architecture – ${id}: ${title}

## Overview
Provide an overview of the architecture for this feature.

## Components
- Component 1
- Component 2

## Data Flow
Describe the data flow between components.

## Dependencies
Describe any dependencies on other systems or features.

## Alternatives Considered
Describe any alternative architectures that were considered and why they were rejected.
`;
}

function generatePlanningTemplate(id: string, title: string): string {
  return `# PLANNING.md – ${id}: ${title}

## Approach
Describe the approach to implementing this feature.

## Timeline
- Week 1: Planning
- Week 2: Implementation
- Week 3: Testing
- Week 4: Documentation and release

## Resources
- Resource 1
- Resource 2

## Risks
- Risk 1
- Risk 2
`;
}

function generateTaskTemplate(id: string, title: string): string {
  return `# TASK.md – ${id}: ${title}

## Current Tasks
- [ ] Design and document the architecture
- [ ] Implement core functionality
- [ ] Write tests
- [ ] Create documentation
- [ ] Review with stakeholders

## Backlog
- Additional features
- Performance optimizations

## Subtasks
- [ ] Subtask 1
- [ ] Subtask 2
`;
} 