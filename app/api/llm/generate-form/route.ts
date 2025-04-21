import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique IDs
import { 
  createLLMProvider, 
  getApiKeyForProvider, 
  LLMMessage 
} from '@/lib/llm-server'; // Import server-side LLM functions

// --- Remove Mock Data --- 
// const MOCK_FORM_MARKDOWN = `...`;

// --- API Handler --- 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { idea, org, repo, branch } = body;

    // --- Input Validation ---
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return NextResponse.json({ error: 'Feature idea is required.' }, { status: 400 });
    }
    if (!org || !repo || !branch) {
      return NextResponse.json({ error: 'Repository context (org, repo, branch) is required.' }, { status: 400 });
    }

    // --- Construct FormArchitect-GPT Prompt ---
    const prompt = `\n### ROLE / SYSTEM\nYou are **FormArchitect‑GPT**, a specialist in translating high‑level product ideas into concise, multi‑step requirement forms.\nYour goals:\n\n1.   **Analyse the idea** supplied below. Identify its domain, core features, and likely engineering concerns.\n2.   **ALWAYS include questions** for \"Feature Title\" (text input) and \"Feature ID\" (text input, explaining it should be a URL-safe slug) at the beginning of Step 1.\n3.   **Select additional question blocks** from a wide question‑bank (authentication, data storage, APIs, analytics, export formats, UI design, etc.)—but include only those relevant to the idea plus always‑useful generic blocks.\n4.   **Output a two‑step form**:\n     • **Step 1 – \"Project Requirements\"** → gather everything an engineer needs before estimating.  \n     • **Step 2 – \"Tasks\"** → leave this as a placeholder heading; it will be auto‑populated later once answers are known.\n5.   **Return *only* structured Markdown** using this pattern  \n     \`\`\`\n     ## Step 1 – Project Requirements\n     ### Feature Definition\n     *Feature Title*\n     _(input-type: text)_\n     ---\n     ### Feature Definition\n     *Feature ID (URL-safe slug)*\n     _(input-type: text)_\n     ---\n     ### Block Name\n     *Question text*  \n     _(input‑type: radio / checkbox list / text area / dropdown / slider)_\n\n     [for checkbox/radio blocks, list options as bullet points]\n     ---\n     ## Step 2 – Tasks\n     *(placeholder – to be filled after Step 1 answers)*\n     \`\`\`\n6.   Do **not** add commentary or explain what you're doing.\n\n### USER INPUT\n<initial_prompt>\n${idea}\n</initial_prompt>\n    `;

    console.log("--- Sending Prompt to LLM for Form Generation ---");
    // console.log(prompt); // Keep prompt logging minimal unless debugging
    
    // --- Initialize LLM --- 
    const providerName = process.env.LLM_PROVIDER || 'gemini'; // Default to gemini or read from env
    const apiKey = await getApiKeyForProvider(providerName);
    if (!apiKey) {
      return NextResponse.json({ error: `API key for provider '${providerName}' is not configured.` }, { status: 500 });
    }
    
    const llmProvider = createLLMProvider(providerName, apiKey);
    if (!llmProvider) {
      return NextResponse.json({ error: `Failed to create LLM provider '${providerName}'.` }, { status: 500 });
    }

    // --- Call LLM --- 
    const messages: LLMMessage[] = [
       // Note: FormArchitect prompt is implicitly a system/instruction prompt
       // For Gemini, system prompts are handled differently (prepended to user message)
       // We send the whole prompt as a single user message here for simplicity with the current llm-server structure
       { role: 'user', content: prompt }
    ];

    console.log(`Calling ${providerName} to generate form markdown...`);
    const llmResponse = await llmProvider.generate({
      messages: messages,
      temperature: 0.5, // Slightly lower temp for more deterministic structure
      maxTokens: 64000 // Reverted to user preference
    });

    let generatedMarkdown = llmResponse.content;

    // --- Clean the response: Remove potential code fences --- 
    const codeBlockMatch = generatedMarkdown.match(/^\`\`\`(?:markdown)?\s*([\s\S]*?)\`\`\`$/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      generatedMarkdown = codeBlockMatch[1].trim();
      console.log("Stripped markdown code block formatting from LLM response.");
    } else {
      // Trim whitespace just in case
      generatedMarkdown = generatedMarkdown.trim();
    }
    // --- End Cleaning ---

    if (!generatedMarkdown || generatedMarkdown.trim().length === 0) {
      console.error("LLM returned empty content for form generation.");
      return NextResponse.json({ error: 'LLM failed to generate form content. Please try again.' }, { status: 500 });
    }
    
    console.log("--- Cleaned LLM Response (Markdown) ---");
    // console.log(generatedMarkdown);

    // --- Generate Unique ID --- 
    const ideaId = `idea-${uuidv4()}`; 

    // --- (SIMULATED) Temporary Storage --- 
    // Still simulating storage, but using the actual LLM response now
    console.log(`Generated ideaId: ${ideaId}. Storing idea and actual markdown (simulated).`);
    // Example: await tempStore.set(ideaId, { idea, markdown: generatedMarkdown });
    
    // --- Return Response --- 
    return NextResponse.json({ ideaId, formMarkdown: generatedMarkdown });

  } catch (error) {
    console.error("Error in /api/llm/generate-form:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    // Provide more specific error if possible
    const status = (error as any)?.response?.status || 500; // Check for status on error object
    return NextResponse.json({ error: "Failed to generate form structure via LLM", details: errorMessage }, { status });
  }
} 