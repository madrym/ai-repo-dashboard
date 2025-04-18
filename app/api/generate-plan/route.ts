import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { getPlanningClient, handleOpenAIError, isRetryableError, PLANNING_SYSTEM_PROMPT, createPlanningPrompt } from "@/lib/openai"
import { z } from "zod"

interface PlanningDocument {
  planningMd: string
  taskMd: string
}

// Zod schema for planning document validation
const planningDocSchema = z.object({
  planningMd: z.string(),
  taskMd: z.string(),
});

// Mock data to use as fallback when the AI service is unavailable
const mockPlanningDocument: PlanningDocument = {
  planningMd: `# Feature: {FEATURE_NAME}

## Goals
- Implement the requested functionality
- Ensure good user experience
- Maintain code quality and performance

## Background
This feature was requested to improve the application's functionality and user experience.

## Purpose
The purpose of this feature is to provide users with additional capabilities that enhance their workflow.

## Target Audience
The primary users of this application.

## Technical Considerations
- Integration with existing systems
- Performance impact
- Security considerations
- Maintainability

## Dependencies
- Current application architecture
- Available libraries and frameworks
`,
  taskMd: `# Implementation Tasks

## Phase 1: Research & Planning
- [ ] Review requirements and specifications
- [ ] Research best practices and approaches
- [ ] Create detailed implementation plan

## Phase 2: Development
- [ ] Set up development environment
- [ ] Implement core functionality
- [ ] Create necessary UI components
- [ ] Integrate with backend services

## Phase 3: Testing
- [ ] Write unit tests
- [ ] Perform integration testing
- [ ] Conduct user acceptance testing
- [ ] Fix identified issues

## Phase 4: Deployment
- [ ] Prepare deployment package
- [ ] Update documentation
- [ ] Deploy to staging environment
- [ ] Deploy to production
`,
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

    const { featureIdea, formData, featureType } = body

    if (!featureIdea || !formData) {
      return NextResponse.json({ error: "Feature idea and form data are required" }, { status: 400 })
    }

    // Convert form data to a string representation for the prompt
    const formDataString = Object.entries(formData)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`
        }
        return `${key}: ${value}`
      })
      .join("\n")

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        // Get the OpenAI client specifically configured for planning
        const planningClient = getPlanningClient();
        
        // Generate planning documents based on the feature idea and form data
        const { object: planningDocs, usage } = await generateObject<PlanningDocument>({
          model: planningClient,
          schema: planningDocSchema,
          prompt: `
            Create comprehensive planning documents for this feature:
            
            Feature Idea: "${featureIdea}"
            Feature Type: ${featureType}
            
            Form Data:
            ${formDataString}
            
            Generate two markdown documents:
            
            1. planningMd: A planning.md document that includes:
               - Feature title and summary
               - Goals and objectives
               - Background and context
               - Purpose
               - Target audience
               - Technical considerations
               - Dependencies
               - Any other relevant sections based on the feature type
            
            2. taskMd: A task.md document that includes:
               - Implementation tasks organized in phases
               - Each task should be a checkbox item (- [ ] Task description)
               - Include research, development, testing, and deployment phases
               - Include specific technical tasks relevant to this feature type
               - Include security, performance, and accessibility considerations where relevant
            
            Make both documents detailed, professional, and ready for a software development team to use.
          `,
          temperature: 0.7,
        })

        // Log token usage for monitoring
        console.log(`Plan generation token usage:`, usage);
        
        return NextResponse.json(planningDocs)
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

        // Customize the mock data with the feature idea
        const customizedMock = {
          planningMd: mockPlanningDocument.planningMd.replace("{FEATURE_NAME}", featureIdea),
          taskMd: mockPlanningDocument.taskMd,
        }

        return NextResponse.json(customizedMock)
      }
    }
    
    // This should never be reached given the loop above
    const customizedMock = {
      planningMd: mockPlanningDocument.planningMd.replace("{FEATURE_NAME}", featureIdea),
      taskMd: mockPlanningDocument.taskMd,
    }
    
    return NextResponse.json(customizedMock);
  } catch (error) {
    console.error("Error in generate-plan API route:", error)
    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "Failed to generate plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
