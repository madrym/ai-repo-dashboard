import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getApiKeyForProvider, createLLMProvider } from "@/lib/llm-server";

// Define the base feature spec path
const FEATURE_SPEC_BASE_PATH = ".ai/feature-specs";
// Define the storage path
const STORAGE_PATH = "storage/repos";

interface GenerateFeatureSpecRequest {
  id: string;
  title: string;
  description?: string;
  problem?: string;
  outOfScope?: string;
  apiKey?: string;
  provider?: string;
}

// Helper function to copy a directory recursively
async function copyDir(src: string, dest: string) {
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
}

export async function POST(
  request: Request,
  { params }: { params: { org: string; repo: string; branch: string } }
) {
  try {
    // Fix: Explicitly await params object before destructuring
    const paramsObj = await Promise.resolve(params);
    const { org, repo, branch } = paramsObj;
    
    // Log for debugging
    console.log(`AI generating feature spec for ${org}/${repo}/${branch}`);
    
    const body = await request.json();
    const { id, title, description, problem, outOfScope, apiKey, provider = 'gemini' } = body as GenerateFeatureSpecRequest;

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

    // Current date for the templates
    const currentDate = new Date().toISOString().split("T")[0];

    // Generate content using AI
    const aiGeneratedContent = await generateContentWithAI(
      formattedId,
      title,
      description || "",
      problem || "",
      outOfScope || "",
      org,
      repo,
      branch,
      currentDate,
      apiKey,
      provider
    );

    // Create the main directories
    await fs.mkdir(featurePath, { recursive: true });
    await fs.mkdir(path.join(featurePath, "history"), { recursive: true });
    await fs.mkdir(path.join(featurePath, "plan"), { recursive: true });

    // Create the template files
    const files = [
      {
        path: path.join(featurePath, "final-spec.md"),
        content: aiGeneratedContent.finalSpec,
      },
      {
        path: path.join(featurePath, "history", "draft-1.md"),
        content: aiGeneratedContent.draftSpec,
      },
      {
        path: path.join(featurePath, "metadata.md"),
        content: aiGeneratedContent.metadata,
      },
      {
        path: path.join(featurePath, "architecture.md"),
        content: aiGeneratedContent.architecture,
      },
      {
        path: path.join(featurePath, "plan", "PLANNING.md"),
        content: aiGeneratedContent.planning,
      },
      {
        path: path.join(featurePath, "plan", "TASK.md"),
        content: aiGeneratedContent.tasks,
      },
    ];

    // Write all files
    for (const file of files) {
      await fs.writeFile(file.path, file.content);
    }

    // Also copy the feature spec to the storage location
    try {
      const storagePath = path.join(STORAGE_PATH, org, repo, branch, "features", dirName);
      await copyDir(featurePath, storagePath);
      console.log(`Feature spec ${formattedId} copied to ${storagePath}`);
    } catch (copyError) {
      console.error("Error copying feature spec to storage:", copyError);
      // Don't fail the request if copying fails, just log the error
    }

    return NextResponse.json({
      success: true,
      id: formattedId,
      title,
      path: featurePath,
    });
  } catch (error) {
    console.error("Error creating AI generated feature spec:", error);
    return NextResponse.json(
      { error: "Failed to create AI-generated feature specification", details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generateContentWithAI(
  id: string,
  title: string,
  description: string,
  problem: string,
  outOfScope: string,
  org: string,
  repo: string,
  branch: string,
  date: string,
  clientApiKey?: string,
  provider = 'gemini'  // Default to Gemini
) {
  // Get API key - first try from client, then try server
  const apiKey = clientApiKey || await getApiKeyForProvider(provider);
  
  if (!apiKey) {
    throw new Error(`No API key available for ${provider}. Please set GEMINI_API_KEY in your environment variables or provide an API key.`);
  }
  
  // Create LLM provider
  const llmProvider = createLLMProvider(provider, apiKey);
  
  if (!llmProvider) {
    throw new Error(`Failed to create LLM provider for ${provider}. Please check your provider configuration.`);
  }

  // Prepare the prompt for the AI - enhanced for better JSON response
  const prompt = `You are a helpful AI product collaborator. I need you to create a feature specification for a feature with the following details:

ID: ${id}
Title: ${title}
Description: ${description || "No description provided"}
Problem to solve: ${problem || "Not specified"}
Out of scope: ${outOfScope || "Not specified"}
For repository: ${org}/${repo} (branch: ${branch})
Date: ${date}

Generate content for each of the following files, using valid Markdown format with appropriate headers:

1. finalSpec - A comprehensive specification with overview, goals, non-goals, user experience, technical implementation, and security considerations.
2. draftSpec - An initial draft of the specification including open questions and implementation ideas.
3. metadata - Metadata about the feature including stakeholders, priority, effort, dependencies, etc.
4. architecture - Technical architecture overview with components and data flow.
5. planning - Approach, timeline, resources, and risks.
6. tasks - A structured breakdown of tasks, backlog, and subtasks.

Respond with a valid JSON object with exactly these keys: 
{
  "finalSpec": "markdown content...",
  "draftSpec": "markdown content...",
  "metadata": "markdown content...",
  "architecture": "markdown content...",
  "planning": "markdown content...",
  "tasks": "markdown content..."
}

Make sure to include appropriate markdown headers and formatting in each section. Keep your content concise but informative.

IMPORTANT: You must respond with ONLY a valid JSON object. DO NOT wrap your response in a code block with triple backticks. Just return the plain JSON object directly. No explanations or markdown formatting outside the JSON values.`;

  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1} to generate content with ${provider}`);
      
      // Call the LLM
      const response = await llmProvider.generate({
        messages: [
          { 
            role: "system", 
            content: "You are a helpful AI software engineer specializing in creating detailed and structured feature specifications." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        maxTokens: 64000, // Increased token limit
        responseFormat: { type: "json_object" }
      });

      // Parse the response
      if (!response || !response.content) {
        throw new Error("Empty response from AI provider.");
      }
      
      try {
        console.log("AI response received, parsing JSON...");
        const generatedContent = JSON.parse(response.content);
        
        // Validate the response has the expected fields
        const requiredFields = ['finalSpec', 'draftSpec', 'metadata', 'architecture', 'planning', 'tasks'];
        const missingFields = requiredFields.filter(field => !generatedContent[field]);
        
        if (missingFields.length > 0) {
          throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Check that no field is empty
        const emptyFields = requiredFields.filter(field => !generatedContent[field]?.trim());
        if (emptyFields.length > 0) {
          throw new Error(`AI generated empty content for fields: ${emptyFields.join(', ')}`);
        }
        
        console.log("Successfully parsed AI response with all required fields");
        return generatedContent;
      } catch (parseError) {
        if (retryCount < maxRetries) {
          console.warn(`Failed to parse AI response as JSON (attempt ${retryCount + 1}): ${(parseError as Error).message}`);
          retryCount++;
          continue;
        }
        throw new Error(`Failed to parse AI response as JSON: ${(parseError as Error).message}. The AI model may not have returned valid JSON.`);
      }
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`Error generating content (attempt ${retryCount + 1}): ${(error as Error).message}`);
        retryCount++;
        continue;
      }
      throw new Error(`Error generating content with AI (${provider}): ${(error as Error).message}`);
    }
  }
} 