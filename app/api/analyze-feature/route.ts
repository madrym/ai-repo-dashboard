import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { getSchemaClient, handleOpenAIError, isRetryableError, SCHEMA_SYSTEM_PROMPT } from "@/lib/openai"
import { z } from "zod"

// Define the structure for our form fields
export interface FormField {
  id: string
  type: "select" | "checkbox" | "text" | "textarea"
  label: string
  description?: string
  options?: string[]
  required?: boolean
}

// Define the structure for our form schema
export interface FormSchema {
  fields: FormField[]
  featureType: string
  featureSummary: string
}

// Zod schema for form validation
const formFieldSchema = z.object({
  id: z.string(),
  type: z.enum(["select", "checkbox", "text", "textarea"]),
  label: z.string(),
  description: z.string().optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

const formSchemaZod = z.object({
  fields: z.array(formFieldSchema),
  featureType: z.string(),
  featureSummary: z.string(),
});

// Mock data to use as fallback when the AI service is unavailable
const mockFormSchema: FormSchema = {
  fields: [
    {
      id: "target-audience",
      type: "select",
      label: "Target Audience",
      description: "Who will be using this feature?",
      options: ["Developers", "End Users", "Administrators", "All Users"],
      required: true,
    },
    {
      id: "priority-level",
      type: "select",
      label: "Priority Level",
      options: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    {
      id: "related-features",
      type: "checkbox",
      label: "Related Features",
      options: ["Authentication", "Dashboard", "User Management", "Reporting", "Settings"],
    },
    {
      id: "implementation-approach",
      type: "select",
      label: "Implementation Approach",
      options: ["Frontend Only", "Backend Only", "Full Stack", "Third-party Integration"],
      required: true,
    },
    {
      id: "additional-considerations",
      type: "textarea",
      label: "Additional Considerations",
      description: "Any other details or requirements for this feature",
    },
  ],
  featureType: "Feature",
  featureSummary: "A new feature to be implemented in the application.",
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch((error) => {
      console.error("Error parsing request body:", error)
      return null
    })

    // Check if body was successfully parsed
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { featureIdea } = body

    if (!featureIdea) {
      return NextResponse.json({ error: "Feature idea is required" }, { status: 400 })
    }

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Get the OpenAI client specifically configured for schema generation
        const schemaClient = getSchemaClient();
        
        // Generate a custom form schema based on the feature idea
        const { object: formSchema, usage } = await generateObject<FormSchema>({
          model: schemaClient,
          schema: formSchemaZod,
          prompt: `
            Analyze this feature idea for a software development project and create a custom form schema:
            "${featureIdea}"
            
            Based on the feature idea, determine what type of feature it is (authentication, dashboard, API, etc.)
            and generate appropriate form fields that would help a developer plan this feature.
            
            Return a JSON object with:
            1. fields: An array of form field objects with these properties:
               - id: A unique identifier for the field (kebab-case)
               - type: One of "select", "checkbox", "text", or "textarea"
               - label: A human-readable label for the field
               - description: (optional) A helpful description of what this field is for
               - options: (required for select and checkbox) An array of possible options
               - required: (optional) Whether this field is required
            2. featureType: A string categorizing the type of feature (e.g., "Authentication", "Dashboard", "API")
            3. featureSummary: A brief 1-2 sentence summary of the feature
            
            Always include these common fields:
            - Target audience (select)
            - Priority level (select with options: "Low", "Medium", "High", "Critical")
            - Related features (checkbox)
            - Additional considerations (textarea)
            
            Then add 2-4 fields that are specifically relevant to this type of feature.
          `,
          temperature: 0.7,
        });

        // Log token usage for monitoring
        console.log(`Schema generation token usage:`, usage);
        
        return NextResponse.json(formSchema);
      } catch (aiError) {
        const openAIError = handleOpenAIError(aiError);
        console.error("AI service error:", openAIError);
        
        // Retry if the error is retryable and we haven't exceeded retries
        if (isRetryableError(openAIError) && retryCount < maxRetries) {
          console.log(`Retrying request (${retryCount + 1}/${maxRetries})...`);
          retryCount++;
          // Add exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          continue;
        }
        
        // If we can't retry, use mock data as a fallback
        console.log("Using mock data as fallback");
        return NextResponse.json({
          ...mockFormSchema,
          featureSummary: `Analysis of: "${featureIdea}"`,
        });
      }
    }
    
    // This should never be reached given the loop above
    return NextResponse.json({
      ...mockFormSchema,
      featureSummary: `Analysis of: "${featureIdea}"`,
    });
  } catch (error) {
    console.error("Error in analyze-feature API route:", error);
    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "Failed to analyze feature",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
