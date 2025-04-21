"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  Package,
  GitBranch,
  CalendarDays,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Save,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { useRepository } from "@/lib/github/context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Define types
interface FeatureSpec {
  id: string
  title: string
  status: "draft" | "in-progress" | "completed" | "archived"
  createdAt: string
  updatedAt: string
  description: string
  problem: string
  outOfScope: string
  goals?: string
  implementation?: string
  testing?: string
  notes?: string
}

export default function FeatureSpecPage() {
  const router = useRouter()
  const params = useParams()
  const org = params.org as string
  const repo = params.repo as string
  const branch = params.branch as string
  const id = params.id as string
  
  const { 
    currentRepository, 
    repositories, 
    selectRepository, 
    connectRepository 
  } = useRepository()
  
  const [feature, setFeature] = useState<FeatureSpec | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Editable feature state
  const [editableFeature, setEditableFeature] = useState<FeatureSpec | null>(null)
  
  // Initialize repository from URL parameters
  useEffect(() => {
    // Skip if we already have the right repository selected
    if (currentRepository === `${org}/${repo}`) {
      console.log("Repository already initialized:", currentRepository);
      return;
    }

    // Set the current repository based on URL parameters
    console.log(`Initializing repository from URL params: ${org}/${repo}`);
    
    // Check if the repository is in the list of repositories
    if (repositories[`${org}/${repo}`]) {
      // If it's already in the list, just select it
      console.log("Repository found in context, selecting it");
      selectRepository(`${org}/${repo}`);
    } else {
      // Repository not found in context, we need to fetch it
      console.log("Repository not found in context, attempting to fetch and connect");
      
      // Try to connect to the repository
      (async () => {
        try {
          // Try to connect by constructing GitHub URL
          const githubUrl = `https://github.com/${org}/${repo}`;
          console.log("Connecting to repository:", githubUrl);
          
          await connectRepository(githubUrl);
          console.log("Repository connected successfully");
        } catch (err) {
          console.error("Error connecting to repository:", err);
          setError("Failed to initialize repository. Please return to the repository page and try again.");
          toast({
            title: "Repository Error",
            description: "Failed to initialize repository. Please return to the repository page and try again.",
            variant: "destructive",
          });
        }
      })();
    }
  }, [org, repo, currentRepository, repositories, selectRepository, connectRepository]);
  
  // Check if params are valid
  useEffect(() => {
    if (!org || !repo || !branch || !id) {
      router.push("/repo")
    }
  }, [org, repo, branch, id, router])
  
  // Load feature spec
  useEffect(() => {
    if (org && repo && branch && id) {
      const fetchFeature = async () => {
        setIsLoading(true)
        setError(null)
        
        try {
          const response = await fetch(`/api/feature-specs/${id}?org=${org}&repo=${repo}&branch=${branch}`)
          
          if (!response.ok) {
            throw new Error(`Failed to fetch feature spec: ${response.status}`)
          }
          
          const data = await response.json()
          setFeature(data)
          setEditableFeature(data)
        } catch (err: any) {
          console.error("Error loading feature:", err)
          setError(err.message || "Failed to load feature specification")
          toast({
            title: "Error",
            description: err.message || "Failed to load feature specification",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchFeature()
    }
  }, [org, repo, branch, id])
  
  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(`/repo/${org}/${repo}/${branch}/${path}`)
  }
  
  // Handle feature update
  const handleSaveFeature = async () => {
    if (!editableFeature) return
    
    setIsSaving(true)
    
    try {
      const response = await fetch(`/api/feature-specs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org,
          repo,
          branch,
          ...editableFeature,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update feature spec")
      }
      
      const data = await response.json()
      setFeature(data)
      setIsEditing(false)
      
      toast({
        title: "Success",
        description: "Feature specification updated successfully",
      })
    } catch (err: any) {
      console.error("Error updating feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to update feature specification",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle feature deletion
  const handleDeleteFeature = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/feature-specs/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          org,
          repo,
          branch,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete feature spec")
      }
      
      toast({
        title: "Success",
        description: "Feature specification deleted successfully",
      })
      
      // Navigate back to feature specs list
      handleNavigation("feature-specs")
    } catch (err: any) {
      console.error("Error deleting feature:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to delete feature specification",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }
  
  // Handle cancel editing
  const handleCancelEditing = () => {
    setEditableFeature(feature)
    setIsEditing(false)
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let variant = "outline"
    
    switch (status) {
      case "draft":
        variant = "outline"
        break
      case "in-progress":
        variant = "secondary"
        break
      case "completed":
        variant = "default"
        break
      case "archived":
        variant = "destructive"
        break
    }
    
    return (
      <Badge variant={variant as any}>
        {status === "in-progress"
          ? "In Progress"
          : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }
  
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("feature-specs")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Features</span>
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => handleNavigation("dashboard")}>
              <FileText className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigation("dependencies")}>
              <Package className="mr-2 h-4 w-4" />
              Dependencies
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-6">
          {/* Repository info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="outline" className="text-sm font-medium">
                {org}/{repo}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                <GitBranch className="mr-1 h-3.5 w-3.5" />
                {branch}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                <FileText className="mr-1 h-3.5 w-3.5" />
                Feature Specs / {id}
              </Badge>
            </div>
          </div>
          
          {isLoading ? (
            // Loading state
            <div className="space-y-4">
              <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
              <div className="h-48 rounded bg-muted animate-pulse" />
              <div className="h-48 rounded bg-muted animate-pulse" />
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-medium mb-2">Error Loading Feature</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button variant="outline" onClick={() => handleNavigation("feature-specs")}>
                Return to Feature Specs
              </Button>
            </div>
          ) : feature ? (
            // Feature content
            <div className="space-y-6">
              {/* Feature header */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 items-start">
                <div>
                  {isEditing ? (
                    <Input
                      value={editableFeature?.title || ""}
                      onChange={(e) =>
                        setEditableFeature((prev) => prev ? { ...prev, title: e.target.value } : null)
                      }
                      className="text-2xl font-bold h-auto py-1 px-2"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold">{feature.title}</h1>
                  )}
                  <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Created: {formatDate(feature.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Updated: {formatDate(feature.updatedAt)}</span>
                    </div>
                    {!isEditing && (
                      <StatusBadge status={feature.status} />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancelEditing} disabled={isSaving}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button onClick={handleSaveFeature} disabled={isSaving}>
                        {isSaving ? (
                          <>Saving...</>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the feature specification and cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteFeature}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
              
              {/* Status selection when editing */}
              {isEditing && (
                <div className="flex items-center gap-4">
                  <Label htmlFor="status">Status:</Label>
                  <Select
                    value={editableFeature?.status || "draft"}
                    onValueChange={(value) =>
                      setEditableFeature((prev) => 
                        prev ? { ...prev, status: value as FeatureSpec["status"] } : null
                      )
                    }
                  >
                    <SelectTrigger id="status" className="w-40">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Feature content tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="implementation">Implementation</TabsTrigger>
                  <TabsTrigger value="testing">Testing</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                
                {/* Overview tab */}
                <TabsContent value="overview" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                      <CardDescription>What this feature is about</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.description || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, description: e.target.value } : null
                            )
                          }
                          className="min-h-[150px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.description || "No description provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Problem Statement</CardTitle>
                      <CardDescription>The problem this feature solves</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.problem || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, problem: e.target.value } : null
                            )
                          }
                          className="min-h-[150px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.problem || "No problem statement provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Out of Scope</CardTitle>
                      <CardDescription>What this feature explicitly does not include</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.outOfScope || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, outOfScope: e.target.value } : null
                            )
                          }
                          className="min-h-[150px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.outOfScope || "No out of scope information provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Implementation tab */}
                <TabsContent value="implementation" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Implementation Details</CardTitle>
                      <CardDescription>How this feature will be implemented</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.implementation || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, implementation: e.target.value } : null
                            )
                          }
                          className="min-h-[300px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.implementation || "No implementation details provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Testing tab */}
                <TabsContent value="testing" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Testing Strategy</CardTitle>
                      <CardDescription>How this feature will be tested</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.testing || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, testing: e.target.value } : null
                            )
                          }
                          className="min-h-[300px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.testing || "No testing strategy provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Notes tab */}
                <TabsContent value="notes" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Notes</CardTitle>
                      <CardDescription>Miscellaneous notes and information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={editableFeature?.notes || ""}
                          onChange={(e) =>
                            setEditableFeature((prev) => 
                              prev ? { ...prev, notes: e.target.value } : null
                            )
                          }
                          className="min-h-[300px]"
                        />
                      ) : (
                        <div className="prose max-w-none dark:prose-invert">
                          {feature.notes || "No additional notes provided."}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
} 