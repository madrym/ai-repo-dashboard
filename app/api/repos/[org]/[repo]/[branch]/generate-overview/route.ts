import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
// Import from the new server-side LLM utility file
import { createLLMProvider } from '@/lib/llm-server'; 
import { repoMixAnalysisPrompt } from '@/lib/prompts/repoMixAnalysisPrompt'; // Adjusted relative path

// Ensure storage directory exists (consider moving this to app startup if needed)
const storageBasePath = path.resolve(process.cwd(), 'storage', 'repos'); 
// Note: Using absolute path based on user info. Be cautious if deploying elsewhere.
// const storageBasePath = '/Users/madry/Documents/Dev/ai-repo-dashboard/storage/repos';

export async function POST(
  request: NextRequest,
  { params }: { params: { org: string; repo: string; branch: string } }
) {
  // Access params directly inside the function
  const org = params.org;
  const repo = params.repo;
  const branch = params.branch;
  
  let apiKey: string | undefined;
  let provider: string | undefined;

  try {
    const body = await request.json();
    apiKey = body.apiKey;
    provider = body.provider || 'gemini'; // Default to gemini as requested

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const repoDir = path.join(storageBasePath, org, repo, branch);
  const xmlFilePath = path.join(repoDir, 'repomix-output.xml');
  const outputFilePath = path.join(repoDir, 'ai-repo-overview.md');

  // 1. Read repomix-output.xml
  let xmlContent: string;
  try {
    xmlContent = fs.readFileSync(xmlFilePath, 'utf-8');
  } catch (error: any) {
    console.error(`Error reading repomix file ${xmlFilePath}:`, error);
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: `repomix-output.xml not found for ${org}/${repo}/${branch}` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to read repository data file' }, { status: 500 });
  }

  // 2. Call LLM Provider
  try {
    const llmProvider = createLLMProvider(apiKey, provider);
    const result = await llmProvider.chat({
      messages: [
        // Use the imported comprehensive prompt
        { role: 'user', content: `${repoMixAnalysisPrompt}

Repository XML Data:
${xmlContent.substring(0, 150000)}` } // Limit input size
      ],
      temperature: 0.5, // Adjust temperature as needed
      max_tokens: 4000   // Adjust max tokens as needed
    });

    const markdownContent = result.content;

    // 3. Ensure directory exists and save the Markdown file
    try {
      fs.mkdirSync(repoDir, { recursive: true });
      fs.writeFileSync(outputFilePath, markdownContent, 'utf-8');
      console.log(`AI overview saved to ${outputFilePath}`);
    } catch (error) {
      console.error(`Error writing overview file ${outputFilePath}:`, error);
      return NextResponse.json({ error: 'Failed to save generated overview file' }, { status: 500 });
    }

    return NextResponse.json({ message: 'AI overview generated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error(`Error calling LLM provider (${provider}):`, error);
    // Provide more specific feedback if possible
    const errorMessage = error.message?.includes('API key') 
      ? 'Invalid API Key or configuration issue.' 
      : 'Failed to generate analysis due to LLM provider error.';
    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
} 