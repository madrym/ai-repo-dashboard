import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  createLLMProvider, 
  getApiKeyForProvider, 
  LLMMessage 
} from '@/lib/llm-server';
import { REPO_STORAGE_DIR } from '@/lib/services/repomix-generator'; // Assuming this is the base storage path

// --- Helper: Define File Generation Templates --- 
// (These are basic templates; they should be enhanced based on your detailed requirements)
const generateFinalSpec = (id: string, title: string, idea: string, llmContent: any): string => `
---\nfeature_id: ${id}\ntitle: ${title}\nstatus: draft\ntags: []\ncode_refs: []\nrelated_features: []\n---\n\n## User Story\n\n${llmContent?.userStory || idea}\n\n## BDD\n\n${llmContent?.bdd || '(BDD to be generated)'}\n\n## Acceptance Criteria\n\n${llmContent?.acceptanceCriteria || '(Acceptance Criteria to be generated)'}\n\n## Considerations\n\n${llmContent?.considerations || '(Considerations TBD)'}\n\n## Feature Linkage\n\n${llmContent?.featureLinkage || '(Feature Linkage TBD)'}\n`;

const generatePlanningMd = (id: string, title: string, idea: string, llmContent: any): string => `
# PLANNING.md – ${id}\n\n## Vision\n${llmContent?.vision || idea}\n\n## Architecture Considerations\n${llmContent?.architectureConsiderations || '(Architecture TBD)'}\n\n## Constraints\n${llmContent?.constraints || '(Constraints TBD)'}\n\n## Stack\n${llmContent?.stack || '(Stack TBD)'}\n`;

const generateTaskMd = (id: string, title: string, llmContent: any): string => `
# TASK.md – ${id}\n\n## To Do\n${(llmContent?.initialTasks || ['- [ ] Define detailed tasks']).join('\n')}\n\n## In Progress\n\n_No tasks in progress yet._\n\n## Done\n\n- [x] Initial feature idea captured\n- [x] Requirements gathered via form\n- [x] Initial Spec files generated\n\n## Notes\n\n_Initial tasks generated by AI based on requirements._\n`;

const generateArchitectureMd = (id: string, llmContent: any): string => `
# ARCHITECTURE.md – ${id}\n\n\`\`\`mermaid\n${llmContent?.mermaidDiagram || 'graph TD\\nA[User] --> B(Feature);'}\n\`\`\`\n\n*(Initial diagram generated by AI)*\n`;

const generateMetadataMd = (id: string, title: string, idea: string, answers: any, llmPrompt: string): string => `
# Metadata Log – ${id}\n\n## Summary\nFeature journey captured from initial user idea to generated specification files based on form answers and LLM generation.\n\n## Steps\n\n### Step 1: Idea Capture\n- Timestamp: ${new Date().toISOString()}\n- Actor: User\n- Action: Entered initial idea: \"${idea}\"\n\n### Step 2: Form Generation\n- Timestamp: ${new Date().toISOString()} \n- Actor: AI (FormArchitect-GPT)\n- Action: Generated requirements form based on idea.\n\n### Step 3: Form Completion\n- Timestamp: ${new Date().toISOString()}\n- Actor: User\n- Action: Submitted answers to requirements form.\n- Details: ${JSON.stringify(answers, null, 2)}\n\n### Step 4: Specification Generation\n- Timestamp: ${new Date().toISOString()}\n- Actor: AI (SpecWriter-GPT)\n- Action: Generated initial specification files based on idea and answers.\n- Prompt Used (abbreviated):\n\`\`\`\n${llmPrompt.substring(0, 500)}...\n\`\`\`\n- Output Files:\n    - final-spec.md\n    - metadata.md\n    - plan/PLANNING.md\n    - plan/TASK.md\n    - architecture.md\n    - history/draft-1.md\n`;

const generateDraft1Md = (id: string, title: string, idea: string): string => `
# Draft 1 - ${id}: ${title}\n\nInitial generation based on user idea:\n\n> ${idea}\n\nRequirements gathered via form, then AI (SpecWriter-GPT) generated the initial file contents.\n`;

// --- Sanitization Helper ---
function sanitizeFilename(name: string): string {
  if (!name) return ''; // Handle empty input
  // Convert to lowercase
  let sanitized = name.toLowerCase();
  // Replace spaces and common separators with hyphens
  sanitized = sanitized.replace(/[\s_.:]+/g, '-');
  // Remove any characters that are not alphanumeric, hyphen, or period (allow periods for potential extensions later, though maybe not needed for dirs)
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  // Collapse consecutive hyphens
  sanitized = sanitized.replace(/-{2,}/g, '-');
  // Prevent names that are just dots or hyphens
  if (/^[.-]+$/.test(sanitized)) return ''; 
  // Limit length (optional but recommended)
  return sanitized.slice(0, 100); // Max length 100 chars
}

// --- API Handler --- 
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      ideaId, // ID from the previous step
      originalIdea, 
      answers, 
      org, 
      repo, 
      branch 
    } = body;

    // --- Input Validation ---
    if (!ideaId || !originalIdea || !answers || !org || !repo || !branch) {
      return NextResponse.json({ error: 'Missing required fields for spec generation.' }, { status: 400 });
    }

    // --- Get Feature ID from answers (user-provided) ---
    const idQuestionKey = Object.keys(answers).find(key => key.startsWith('feature-id')); // Find the key used for feature ID
    const userProvidedId = idQuestionKey ? answers[idQuestionKey] as string : '';

    // --- Sanitize and Validate Feature ID ---
    let featureId = sanitizeFilename(userProvidedId);
    
    // If sanitized ID is empty or invalid, generate a fallback ID
    if (!featureId) {
      console.warn(`User provided ID \"${userProvidedId}\" sanitized to empty. Generating fallback ID.`);
      // Generate a fallback based on title (if available) or UUID
      const titleQuestionKey = Object.keys(answers).find(key => key.startsWith('feature-title'));
      const title = titleQuestionKey ? answers[titleQuestionKey] as string : '';
      featureId = sanitizeFilename(title) || `ft-${uuidv4().substring(0, 8).toLowerCase()}`; 
    } else {
      // Prefix user-provided IDs for consistency (optional)
      if (!featureId.startsWith('ft-')) {
        featureId = `ft-${featureId}`;
      }
    }
    featureId = featureId.slice(0, 100); // Ensure final ID respects length limit

    // --- Feature Title --- 
    const titleQuestionKey = Object.keys(answers).find(key => key.startsWith('feature-title'));
    const featureTitle = (titleQuestionKey ? answers[titleQuestionKey] as string : '') || originalIdea.substring(0, 50);

    console.log(`Generating Feature Spec: ID=${featureId}, Title=${featureTitle}`);

    // --- Prepare File Paths (using SANITIZED featureId) --- 
    const featureDirPath = path.join(REPO_STORAGE_DIR, org, repo, branch, "feature-specs", featureId);
    const historyPath = path.join(featureDirPath, "history");
    const planPath = path.join(featureDirPath, "plan");

    // --- Check if directory already exists (using SANITIZED featureId) ---
    try {
      await fs.access(featureDirPath);
      // If access doesn't throw, directory exists
      console.error(`Directory already exists for feature ID: ${featureId}`);
      return NextResponse.json(
        { error: `A feature specification with the ID '${featureId}' (derived from '${userProvidedId}') already exists.` },
        { status: 409 } // Conflict
      );
    } catch (accessError) {
      // Directory doesn't exist, proceed (this is the expected case)
    }

    // --- Construct SpecWriter-GPT Prompt ---
    const specPrompt = `
### ROLE / SYSTEM
You are **SpecWriter-GPT**, an expert AI assistant specializing in translating user ideas and requirement answers into comprehensive, structured software feature specifications. Your task is to generate the core content for various specification documents based on the provided context.

### CONTEXT
You are given the following information about a new feature:

1.  **Initial User Idea:**
    \`\`\`text
    ${originalIdea}
    \`\`\`

2.  **Detailed Requirements (User Answers from Form):**
    \`\`\`json
    ${JSON.stringify(answers, null, 2)}
    \`\`\`

### TASK
Your goal is to synthesize the Initial User Idea and the Detailed Requirements into structured content suitable for populating specific sections of different specification documents (\`final-spec.md\`, \`PLANNING.md\`, \`TASK.md\`, \`architecture.md\`).

### OUTPUT FORMAT
**Return ONLY a single, valid JSON object** matching the schema below. Do not include any conversational text, explanations, introductions, or markdown formatting around the JSON block itself.

\`\`\`json
{
  "finalSpecContent": {
    "userStory": "string (Generate a concise user story based on the idea and requirements)",
    "bdd": "string (Generate 2-3 BDD scenarios in Given/When/Then format, separated by double newlines, based on requirements)",
    "acceptanceCriteria": "string (Generate a bulleted list string '- Criteria 1\\\\n- Criteria 2...' of specific, measurable acceptance criteria based on requirements)",
    "considerations": "string (Generate a bulleted list string '- Consideration 1\\\\n- Consideration 2...' of technical, security, or performance considerations identified from requirements. If none apparent, state 'None identified yet.')",
    "featureLinkage": "string (Generate a bulleted list string '- Linkage 1...' of potential related features or dependencies inferred from requirements. If none apparent, state 'TBD')"
  },
  "planningContent": {
    "vision": "string (Generate a brief, 1-2 sentence restatement of the feature's primary goal/vision)",
    "architectureConsiderations": "string (Generate a bulleted list string '- Consideration 1...' of high-level architecture points or components suggested by the requirements. If none apparent, state 'Initial architecture TBD.')",
    "constraints": "string (Generate a bulleted list string '- Constraint 1...' of constraints explicitly mentioned or strongly implied in the requirements. If none apparent, state 'None identified yet.')",
    "stack": "string (Suggest a potential tech stack (e.g., 'Frontend: React, Backend: Node.js, DB: PostgreSQL') based on requirements, if possible. Otherwise, state 'TBD')"
  },
  "taskContent": {
    "initialTasks": [
      "string (Generate 3-5 high-level initial tasks required to implement the feature, each formatted as '- [ ] Task description')"
    ]
  },
  "architectureContent": {
    "mermaidDiagram": "string (Generate Mermaid 'graph TD' syntax representing the primary user flow or component interaction based on requirements. Keep it high-level. If insufficient detail, provide a simple placeholder like 'graph TD\\\\nA[User] --> B(Feature);')"
  }
}
\`\`\`

### INSTRUCTIONS & GUIDELINES
1.  **Synthesize Deeply:** Don't just echo the inputs. Analyze the \`Initial User Idea\` and the \`Detailed Requirements\` together to generate insightful and relevant content for each field.
2.  **Be Specific:** For BDD and Acceptance Criteria, aim for clarity and testability based on the answers provided.
3.  **Infer Reasonably:** Make logical inferences where appropriate (e.g., suggesting a stack based on platform choice), but use placeholders like \"TBD\" or \"None identified yet\" if the information isn't present in the requirements.
4.  **Format Correctly:** Ensure all string outputs containing lists use Markdown bullet points (\`- \`) and are properly formatted as single strings with newline characters (\`\\\\n\`) where appropriate (e.g., for BDD scenarios, AC list, task list). The \`initialTasks\` field specifically requires an array of strings.
5.  **Mermaid Simplicity:** The initial architecture diagram should be a high-level overview. Don't overcomplicate it unless the requirements are very detailed.
6.  **JSON Exclusivity:** The final output MUST be only the JSON object specified. No leading/trailing text or code fences around the JSON.
`;

    // --- Initialize LLM --- 
    const providerName = process.env.LLM_PROVIDER || 'gemini'; 
    const apiKey = await getApiKeyForProvider(providerName);
    if (!apiKey) {
      return NextResponse.json({ error: `API key for provider '${providerName}' is not configured.` }, { status: 500 });
    }
    const llmProvider = createLLMProvider(providerName, apiKey);
    if (!llmProvider) {
      return NextResponse.json({ error: `Failed to create LLM provider '${providerName}'.` }, { status: 500 });
    }

    // --- Call LLM for Content Generation --- 
    console.log(`Calling ${providerName} to generate specification content...`);
    const messages: LLMMessage[] = [
      // SpecWriter prompt is user role as it contains instructions + context
      { role: 'user', content: specPrompt }
    ];

    const llmResponse = await llmProvider.generate({
      messages: messages,
      temperature: 0.6,
      maxTokens: 64000, // Increased token limit
      responseFormat: { type: "json_object" } // Request JSON output
    });

    console.log("--- LLM Response Received (Content JSON) ---");
    // console.log(llmResponse.content); // Log raw response if debugging

    // --- Parse LLM Response --- 
    let generatedContent: any;
    try {
      generatedContent = JSON.parse(llmResponse.content);
      if (!generatedContent || typeof generatedContent !== 'object') {
        throw new Error('LLM response is not a valid JSON object.');
      }
      // Basic validation of expected structure
      if (!generatedContent.finalSpecContent || !generatedContent.planningContent || !generatedContent.taskContent || !generatedContent.architectureContent) {
         throw new Error('LLM JSON response is missing expected top-level keys.');
      }
    } catch (parseError: any) {
      console.error("Failed to parse LLM response as JSON:", llmResponse.content, parseError);
      // Fallback or error handling needed - maybe return error or try again?
      // For now, we'll throw an error to the client
      return NextResponse.json({ 
        error: "LLM generated invalid content structure.", 
        details: `Failed to parse JSON. ${parseError.message}`,
        rawContent: llmResponse.content // Include raw content for debugging
      }, { status: 500 });
    }

    console.log("Successfully parsed LLM content.");

    // --- Generate File Content using LLM Output --- 
    const fileContents = {
        "final-spec.md": generateFinalSpec(featureId, featureTitle, originalIdea, generatedContent.finalSpecContent),
        "metadata.md": generateMetadataMd(featureId, featureTitle, originalIdea, answers, specPrompt),
        "plan/PLANNING.md": generatePlanningMd(featureId, featureTitle, originalIdea, generatedContent.planningContent),
        "plan/TASK.md": generateTaskMd(featureId, featureTitle, generatedContent.taskContent),
        "architecture.md": generateArchitectureMd(featureId, generatedContent.architectureContent),
        "history/draft-1.md": generateDraft1Md(featureId, featureTitle, originalIdea)
    };

    // --- Create Directories & Write Files --- 
    await fs.mkdir(historyPath, { recursive: true });
    await fs.mkdir(planPath, { recursive: true });

    for (const [fileName, content] of Object.entries(fileContents)) {
        const filePath = path.join(featureDirPath, fileName);
        await fs.writeFile(filePath, content);
        console.log(`Created file: ${filePath}`);
    }

    // --- Clean up temporary data (if applicable) ---
    // localStorage is client-side, so no server-side cleanup needed for that.
    // If you implement server-side temporary storage for ideaId, clean it here.

    // --- Return Success --- 
    return NextResponse.json({ success: true, newFeatureId: featureId });

  } catch (error) {
    console.error("Error in /api/feature-specs/generate:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const status = (error as any)?.response?.status || 500;
    return NextResponse.json({ error: "Failed to generate feature specification files", details: errorMessage }, { status });
  }
} 