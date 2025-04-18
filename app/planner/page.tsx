"use client"

import { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Edit,
  Github,
  Loader2,
  SendHorizontal,
  LayoutTemplateIcon as Template,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MarkdownEditor } from "@/components/markdown-editor"
import { toast } from "@/components/ui/use-toast"
import { Stepper, Step } from "@/components/stepper"
import { Badge } from "@/components/ui/badge"
import type { FormField } from "@/app/api/analyze-feature/route"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock template data
const templateData = [
  {
    id: "1",
    name: "Basic Feature",
    category: "General",
    description: "A simple template for basic features.",
  },
  {
    id: "2",
    name: "User Authentication",
    category: "Authentication",
    description: "Template for implementing user authentication.",
  },
  {
    id: "3",
    name: "Data Visualization",
    category: "Analytics",
    description: "Template for creating data visualizations.",
  },
  {
    id: "4",
    name: "E-commerce Product Page",
    category: "E-commerce",
    description: "Template for designing an e-commerce product page.",
  },
]

export default function PlannerPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [featureIdea, setFeatureIdea] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [featureType, setFeatureType] = useState("")
  const [featureSummary, setFeatureSummary] = useState("")
  const [customForm, setCustomForm] = useState<null | {
    fields: FormField[]
  }>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [planningContent, setPlanningContent] = useState("")
  const [taskContent, setTaskContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Check if there's a saved feature from a template
  useEffect(() => {
    const savedFeature = localStorage.getItem("currentFeature")
    if (savedFeature) {
      try {
        const parsedFeature = JSON.parse(savedFeature)
        setFeatureIdea(parsedFeature.name)
        setPlanningContent(parsedFeature.planningMd)
        setTaskContent(parsedFeature.taskMd)
        // Skip to review step
        setCurrentStep(1)
        // Clear the saved feature
        localStorage.removeItem("currentFeature")

        toast({
          title: "Template applied",
          description: "Your feature has been created from the template",
        })
      } catch (error) {
        console.error("Error parsing saved feature:", error)
      }
    }
  }, [])

  // Update the handleAnalyzeFeature function to handle errors better
  const handleAnalyzeFeature = async () => {
    if (!featureIdea) {
      toast({
        title: "Error",
        description: "Please enter a feature idea",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-feature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featureIdea }),
      })

      // First check if the response is OK
      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      // Now try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        throw new Error("Failed to parse server response. The server might be experiencing issues.")
      }

      // Validate the response data
      if (!data || !data.fields) {
        throw new Error("Invalid response data from server")
      }

      // Initialize form values with empty defaults
      const initialValues: Record<string, any> = {}
      data.fields.forEach((field: FormField) => {
        initialValues[field.id] = field.type === "checkbox" ? [] : ""
      })

      setCustomForm({ fields: data.fields })
      setFormValues(initialValues)
      setFeatureType(data.featureType || "Feature")
      setFeatureSummary(data.featureSummary || "")
    } catch (error) {
      console.error("Error analyzing feature:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze feature. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateFormField = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  // Update the handleGeneratePlan function to handle errors better
  const handleGeneratePlan = async () => {
    if (!customForm) return

    setIsGeneratingPlan(true)

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureIdea,
          formData: formValues,
          featureType,
        }),
      })

      // First check if the response is OK
      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = `Server error: ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      // Now try to parse the response as JSON
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Error parsing response:", parseError)
        throw new Error("Failed to parse server response. The server might be experiencing issues.")
      }

      // Validate the response data
      if (!data || !data.planningMd || !data.taskMd) {
        throw new Error("Invalid response data from server")
      }

      setPlanningContent(data.planningMd)
      setTaskContent(data.taskMd)
      setCurrentStep(1)
    } catch (error) {
      console.error("Error generating plan:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const handleCreatePR = () => {
    setLoading(true)

    // Simulate PR creation
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Pull Request Created",
        description: "Successfully created a new branch and PR with your feature plans",
      })
      setCurrentStep(2)
    }, 2000)
  }

  const renderFormField = (field: FormField) => {
    switch (field.type) {
      case "select":
        return (
          <div className="space-y-2" key={field.id}>
            <div className="flex items-center gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <Select value={formValues[field.id] || ""} onValueChange={(value) => updateFormField(field.id, value)}>
              <SelectTrigger id={field.id}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "checkbox":
        return (
          <div className="space-y-2" key={field.id}>
            <div className="flex items-center gap-2">
              <Label>{field.label}</Label>
              {field.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {field.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(formValues[field.id] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFormField(field.id, [...(formValues[field.id] || []), option])
                      } else {
                        updateFormField(
                          field.id,
                          (formValues[field.id] || []).filter((item: string) => item !== option),
                        )
                      }
                    }}
                  />
                  <label
                    htmlFor={`${field.id}-${option}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )

      case "textarea":
        return (
          <div className="space-y-2" key={field.id}>
            <div className="flex items-center gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <Textarea
              id={field.id}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={formValues[field.id] || ""}
              onChange={(e) => updateFormField(field.id, e.target.value)}
              rows={3}
            />
          </div>
        )

      case "text":
        return (
          <div className="space-y-2" key={field.id}>
            <div className="flex items-center gap-2">
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.required && (
                <Badge variant="outline" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            <Input
              id={field.id}
              placeholder={`Enter ${field.label.toLowerCase()}...`}
              value={formValues[field.id] || ""}
              onChange={(e) => updateFormField(field.id, e.target.value)}
            />
          </div>
        )

      default:
        return null
    }
  }

  const validateForm = () => {
    if (!customForm) return false

    const requiredFields = customForm.fields.filter((field) => field.required)

    for (const field of requiredFields) {
      const value = formValues[field.id]
      if (!value || (Array.isArray(value) && value.length === 0)) {
        toast({
          title: "Missing required fields",
          description: `Please fill in the ${field.label} field`,
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Feature Planner</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      <Stepper currentStep={currentStep} className="mb-8">
        <Step title="Define Feature" description="Describe your feature idea" />
        <Step title="Review & Edit" description="Review and edit generated documents" />
        <Step title="Create PR" description="Submit to GitHub repository" />
      </Stepper>

      {currentStep === 0 && !customForm && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>What feature would you like to plan?</CardTitle>
            <CardDescription>Enter a one-liner idea or brief description of your feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g., Add user authentication with GitHub OAuth"
                  value={featureIdea}
                  onChange={(e) => setFeatureIdea(e.target.value)}
                />
              </div>
              <Button onClick={handleAnalyzeFeature} disabled={!featureIdea}>
                <SendHorizontal className="mr-2 h-4 w-4" />
                Analyze
              </Button>
              <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
                <Template className="mr-2 h-4 w-4" />
                Use Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 0 && isAnalyzing && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-center text-muted-foreground">
              Analyzing your feature idea to create a custom planning form...
            </p>
          </CardContent>
        </Card>
      )}

      {currentStep === 0 && customForm && !isAnalyzing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Feature: {featureIdea}</CardTitle>
                <CardDescription className="mt-1">{featureSummary}</CardDescription>
              </div>
              <Badge variant="secondary">{featureType}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">{customForm.fields.map(renderFormField)}</CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => {
                if (validateForm()) {
                  handleGeneratePlan()
                }
              }}
              disabled={isGeneratingPlan}
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate Plan"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 1 && (
        <>
          <Tabs defaultValue="planning" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="planning">planning.md</TabsTrigger>
              <TabsTrigger value="task">task.md</TabsTrigger>
            </TabsList>
            <TabsContent value="planning" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Planning Document</CardTitle>
                    <CardDescription>Goals, background, and purpose of the feature</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <MarkdownEditor value={planningContent} onChange={setPlanningContent} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="task" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Task Document</CardTitle>
                    <CardDescription>Implementation steps and tasks</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent>
                  <MarkdownEditor value={taskContent} onChange={setTaskContent} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setCurrentStep(0)}>
              Back to Feature Definition
            </Button>
            <Button onClick={handleCreatePR}>
              <Github className="mr-2 h-4 w-4" />
              Create GitHub PR
            </Button>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Pull Request Created
            </CardTitle>
            <CardDescription>Your feature plan has been submitted to the repository</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4">
              <h3 className="font-medium">PR Details</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-mono">
                    feature/{featureIdea.toLowerCase().replace(/\s+/g, "-").substring(0, 20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Files:</span>
                  <span>
                    specs/{featureIdea.toLowerCase().replace(/\s+/g, "-").substring(0, 20)}/planning.md, task.md
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-600">Open</span>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium">Next Steps</h3>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  Review the PR in your GitHub repository
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  Request feedback from team members
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  Merge the PR when ready to start implementation
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/planner">Plan Another Feature</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>Select a template to use as a starting point for your feature</DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto py-4 md:grid-cols-2">
            {/* Template cards */}
            {templateData.slice(0, 4).map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-primary ${
                  selectedTemplate === template.id ? "border-2 border-primary" : ""
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedTemplate) {
                  // Navigate to the template page
                  window.location.href = `/templates/${selectedTemplate}`
                } else {
                  toast({
                    title: "No template selected",
                    description: "Please select a template to continue",
                    variant: "destructive",
                  })
                }
              }}
              disabled={!selectedTemplate}
            >
              Use Selected Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
