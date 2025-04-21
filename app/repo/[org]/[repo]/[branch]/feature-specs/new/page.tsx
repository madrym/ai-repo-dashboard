"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function NewFeatureSpecPage() {
  const router = useRouter()
  const params = useParams()
  const org = params.org as string
  const repo = params.repo as string
  const branch = params.branch as string

  const [featureIdea, setFeatureIdea] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateForm = async () => {
    if (!featureIdea.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a short summary of your feature idea.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    
    try {
      // --- Call the backend API to generate form --- 
      console.log("Sending idea to backend:", featureIdea)
      const response = await fetch('/api/llm/generate-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: featureIdea, org, repo, branch }),
      });

      if (!response.ok) {
        let errorData = { error: 'Failed to generate form structure' };
        try {
           errorData = await response.json();
        } catch (jsonError) {
           const textError = await response.text();
           errorData.error = textError || `Request failed with status ${response.status}`;
        }
        throw new Error(errorData.error);
      }
      
      const { ideaId, formMarkdown } = await response.json();

      if (!ideaId || !formMarkdown) {
        throw new Error('Invalid response received from form generation API.');
      }
      
      // --- Store idea and markdown in localStorage --- 
      // Use ideaId as the key for the stored object
      localStorage.setItem(ideaId, JSON.stringify({ 
        idea: featureIdea, 
        markdown: formMarkdown 
      }));

      toast({
        title: "Generated Requirements Form",
        description: "Please fill out the details below.",
      })

      // --- Navigate to the form page --- 
      // Pass only the ideaId
      router.push(`/repo/${org}/${repo}/${branch}/feature-specs/new/form?ideaId=${ideaId}`)

    } catch (error: any) {
      console.error("Error generating form:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start feature specification process.",
        variant: "destructive",
      })
      setIsGenerating(false) // Only set to false on error
    } 
  }

  const featureSpecsUrl = `/repo/${org}/${repo}/${branch}/feature-specs`;

  return (
    <div className="container mx-auto max-w-3xl py-8">
       <Link href={featureSpecsUrl} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feature Specs
        </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Feature Specification</CardTitle>
          <CardDescription>
            Start by describing the feature you want to build. Our AI will then generate a set of questions to refine the requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feature-idea">Feature Idea Summary</Label>
            <Textarea
              id="feature-idea"
              placeholder="Example: 'Implement a user authentication system using email/password and Google OAuth'"
              value={featureIdea}
              onChange={(e) => setFeatureIdea(e.target.value)}
              rows={5}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Provide a concise summary. The more detail, the better the AI can tailor the questions.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateForm} disabled={isGenerating || !featureIdea.trim()} className="ml-auto">
            {isGenerating ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Requirements Form
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 