import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getApiKeyForProvider, createLLMProvider } from "@/lib/llm-server";
import { parseRepositoryUrl } from "@/lib/github";
import { REPO_STORAGE_DIR } from "@/lib/services/repomix-generator";

// Define the base feature spec path
const FEATURE_SPEC_BASE_PATH = ".ai/feature-specs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  provider?: string;
  apiKey?: string;
}

// Function to find a feature spec directory by ID
async function findFeatureSpecById(id: string, repositoryUrl: string): Promise<string | null> {
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
    
    return featurePath;
  } catch (error) {
    console.error(`Error finding feature spec for ID ${id}:`, error);
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { messages, model, provider, apiKey, repositoryUrl } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
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
    const featurePath = await findFeatureSpecById(id, repositoryUrl);
    
    if (!featurePath) {
      return NextResponse.json(
        { error: `Feature spec with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Read the feature spec files for context
    const finalSpecPath = path.join(featurePath, "final-spec.md");
    const architecturePath = path.join(featurePath, "architecture.md");
    const planningPath = path.join(featurePath, "plan", "PLANNING.md");
    const taskPath = path.join(featurePath, "plan", "TASK.md");
    const metadataPath = path.join(featurePath, "metadata.md");
    
    // Read all files in parallel
    const [finalSpecContent, architectureContent, planningContent, taskContent, metadataContent] =
      await Promise.all([
        fs.readFile(finalSpecPath, "utf-8").catch(() => ""),
        fs.readFile(architecturePath, "utf-8").catch(() => ""),
        fs.readFile(planningPath, "utf-8").catch(() => ""),
        fs.readFile(taskPath, "utf-8").catch(() => ""),
        fs.readFile(metadataPath, "utf-8").catch(() => ""),
      ]);
    
    // Extract basic metadata
    const idMatch = metadataContent.match(/ID:\s*([A-Z0-9-]+)/);
    const titleMatch = metadataContent.match(/Title:\s*(.+)$/m);
    
    // Construct context message
    const featureSpecContext = `
# Feature Spec: ${idMatch?.[1] || id} - ${titleMatch?.[1] || ""}

## Metadata
${metadataContent}

## Final Spec
${finalSpecContent}

## Architecture
${architectureContent}

## Planning
${planningContent}

## Tasks
${taskContent}
`;
    
    // Create system message with context
    const systemMessage: ChatMessage = {
      role: "system",
      content: `You are an AI assistant helping with a feature specification. 
Here is the current feature specification context:

${featureSpecContext}

Please help the user with any questions about this feature spec, suggest improvements, or assist with implementation details.
Be specific and reference relevant parts of the specification in your answers.`,
    };
    
    // Get the API key
    let effectiveApiKey = apiKey || getApiKeyForProvider(provider);
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }
    
    // Create LLM provider client
    const llmProvider = createLLMProvider(provider || "openai", effectiveApiKey);
    
    // Add system message at the beginning if not already there
    const formattedMessages = messages[0]?.role === "system" 
      ? messages 
      : [systemMessage, ...messages];
    
    // Call the LLM provider
    const response = await llmProvider.chat(formattedMessages, model);
    
    return NextResponse.json({
      response: response.content,
      model: response.model || model,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Error in feature spec chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat request", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to load feature spec content
async function loadFeatureSpecContent(featurePath: string) {
  const content: Record<string, string> = {};
  
  // Read metadata.md
  try {
    const metadataPath = path.join(featurePath, "metadata.md");
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    
    // Extract title and description
    const titleMatch = metadataContent.match(/Title:\s*(.+)$/m);
    content.title = titleMatch ? titleMatch[1] : "";
    
    // Extract description
    const descriptionRegex = /## Description\s*\n\s*(.+)/;
    const standardDescriptionMatch = metadataContent.match(descriptionRegex);
    
    if (standardDescriptionMatch) {
      content.description = standardDescriptionMatch[1];
    } else {
      // Try to extract the whole section and get the first line
      const descriptionSection = metadataContent.split('## Description')[1];
      if (descriptionSection) {
        const lines = descriptionSection.split('\n').filter(line => line.trim());
        if (lines.length) {
          content.description = lines[0].trim();
        }
      }
    }
  } catch (error) {
    console.error("Error reading metadata:", error);
  }
  
  // Read final-spec.md
  try {
    const finalSpecPath = path.join(featurePath, "final-spec.md");
    content.finalSpec = await fs.readFile(finalSpecPath, "utf-8");
  } catch (error) {
    console.error("Error reading final spec:", error);
  }
  
  // Read architecture.md
  try {
    const architecturePath = path.join(featurePath, "architecture.md");
    content.architecture = await fs.readFile(architecturePath, "utf-8");
  } catch (error) {
    console.error("Error reading architecture:", error);
  }
  
  return content;
}

// Helper function to save messages to chat history
async function saveMessageToHistory(
  chatHistoryDir: string,
  message: ChatMessage,
  timestamp: string
) {
  // Format the timestamp for the filename
  const filenameTimestamp = timestamp
    .replace(/:/g, "-")
    .replace(/\./g, "-");
  
  const filename = `${filenameTimestamp}-${message.role}.md`;
  const filePath = path.join(chatHistoryDir, filename);
  
  const content = `# ${message.role.charAt(0).toUpperCase() + message.role.slice(1)} Message
Time: ${timestamp}

${message.content}
`;
  
  await fs.writeFile(filePath, content);
}

// GET endpoint to retrieve chat history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Feature spec ID is required" },
        { status: 400 }
      );
    }

    // Format ID for consistency
    const formattedId = id.trim().toUpperCase();
    // Create the directory name
    const dirName = `feature-${formattedId}`;
    // Define the full path
    const featurePath = path.join(FEATURE_SPEC_BASE_PATH, dirName);
    const chatHistoryDir = path.join(featurePath, "chat-history");

    // Check if the feature spec exists
    try {
      await fs.access(featurePath);
    } catch (error) {
      return NextResponse.json(
        { error: `Feature spec with ID ${formattedId} not found` },
        { status: 404 }
      );
    }
    
    // Check if chat history exists
    try {
      await fs.access(chatHistoryDir);
    } catch (error) {
      // Return empty history if no chat history yet
      return NextResponse.json({ messages: [] });
    }
    
    // Read chat history files
    const files = await fs.readdir(chatHistoryDir);
    
    // Sort files by timestamp (which is in the filename)
    files.sort();
    
    // Process each file and build messages array
    const messages: ChatMessage[] = [];
    
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      
      const filePath = path.join(chatHistoryDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      
      // Extract role from filename
      const roleMatch = file.match(/-([a-z]+)\.md$/);
      const role = roleMatch ? roleMatch[1] as "user" | "assistant" | "system" : "user";
      
      // Extract message content (everything after the first empty line)
      const contentStart = content.indexOf("\n\n");
      if (contentStart !== -1) {
        const messageContent = content.substring(contentStart + 2).trim();
        messages.push({
          role,
          content: messageContent
        });
      }
    }
    
    return NextResponse.json({ messages });
    
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history", details: (error as Error).message },
      { status: 500 }
    );
  }
} 