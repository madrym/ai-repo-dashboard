"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Star, StarOff, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownEditor } from "@/components/markdown-editor"
import { toast } from "@/components/ui/use-toast"
import { templateData } from "@/lib/template-data"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

export default function TemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [template, setTemplate] = useState<any>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [planningContent, setPlanningContent] = useState("")
  const [taskContent, setTaskContent] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [featureName, setFeatureName] = useState("")

  useEffect(() => {
    // Find template by ID
    const foundTemplate = templateData.find((t) => t.id === params.id)
    if (foundTemplate) {
      setTemplate(foundTemplate)
      setPlanningContent(foundTemplate.planningMd)
      setTaskContent(foundTemplate.taskMd)
      setIsFavorite(foundTemplate.isFavorite || false)
    }
  }, [params.id])

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast({
      title: isFavorite ? "Removed from favorites" : "Added to favorites",
      description: isFavorite ? "Template removed from favorites" : "Template added to favorites",
    })
  }

  const handleUseTemplate = () => {
    if (!featureName) {
      toast({
        title: "Feature name required",
        description: "Please enter a name for your feature",
        variant: "destructive",
      })
      return
    }

    // In a real app, we would save this to the user's session or database
    localStorage.setItem(
      "currentFeature",
      JSON.stringify({
        name: featureName,
        planningMd: planningContent,
        taskMd: taskContent,
        templateId: template.id,
      }),
    )

    toast({
      title: "Template applied",
      description: "Template has been applied to your new feature",
    })

    router.push("/planner")
  }

  const handleDeleteTemplate = () => {
    // In a real app, we would delete from the database
    toast({
      title: "Template deleted",
      description: "The template has been deleted",
    })
    setIsDeleteDialogOpen(false)
    router.push("/templates")
  }

  if (!template) {
    return (
      <div className="container flex h-[50vh] items-center justify-center">
        <p>Template not found</p>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{template.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
            {isFavorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/templates/${params.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Template</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this template? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteTemplate}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
              <p className="mt-1">{template.category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
              <p className="mt-1">{template.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {template.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Created By</h3>
              <p className="mt-1">{template.author}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
              <p className="mt-1">{template.updatedAt}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Use This Template</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Feature from Template</DialogTitle>
                  <DialogDescription>Enter a name for your new feature based on this template.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="feature-name">Feature Name</Label>
                  <Input
                    id="feature-name"
                    placeholder="e.g., GitHub OAuth Integration"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleUseTemplate}>Create Feature</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>Preview the template content</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="planning">
              <TabsList className="w-full">
                <TabsTrigger value="planning" className="flex-1">
                  planning.md
                </TabsTrigger>
                <TabsTrigger value="task" className="flex-1">
                  task.md
                </TabsTrigger>
              </TabsList>
              <TabsContent value="planning" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4">
                    <MarkdownEditor value={planningContent} onChange={setPlanningContent} readOnly />
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="task" className="mt-4">
                <ScrollArea className="h-[400px] rounded-md border">
                  <div className="p-4">
                    <MarkdownEditor value={taskContent} onChange={setTaskContent} readOnly />
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
