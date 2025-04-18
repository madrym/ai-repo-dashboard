"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkdownEditor } from "@/components/markdown-editor"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CreateTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")
  const [planningContent, setPlanningContent] = useState(`# Feature: [Feature Name]

## Goals
- [Goal 1]
- [Goal 2]
- [Goal 3]

## Background
[Provide context and background information about this feature]

## Purpose
[Explain the purpose and value of this feature]

## Target Audience
[Describe the primary users of this feature]

## Technical Considerations
[List any technical considerations or constraints]

## Dependencies
[List any dependencies or prerequisites]
`)
  const [taskContent, setTaskContent] = useState(`# Implementation Tasks

## Phase 1: Research & Planning
- [ ] [Research task 1]
- [ ] [Research task 2]
- [ ] [Planning task 1]

## Phase 2: Development
- [ ] [Development task 1]
- [ ] [Development task 2]
- [ ] [Development task 3]

## Phase 3: Testing & Refinement
- [ ] [Testing task 1]
- [ ] [Testing task 2]
- [ ] [Refinement task 1]

## Phase 4: Deployment
- [ ] [Deployment task 1]
- [ ] [Deployment task 2]
- [ ] [Post-deployment task 1]
`)

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSaveTemplate = () => {
    if (!name) {
      toast({
        title: "Name required",
        description: "Please enter a name for your template",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for your template",
        variant: "destructive",
      })
      return
    }

    // In a real app, we would save to a database
    toast({
      title: "Template saved",
      description: "Your template has been saved successfully",
    })

    // Navigate back to templates page
    router.push("/templates")
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
          <h1 className="text-2xl font-bold">Create Template</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button onClick={handleSaveTemplate}>
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>Provide information about your template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Authentication Feature"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this template is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="authentication">Authentication</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="ui">UI Component</SelectItem>
                  <SelectItem value="data">Data Management</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>Create the content for your template</CardDescription>
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
                <MarkdownEditor value={planningContent} onChange={setPlanningContent} />
              </TabsContent>
              <TabsContent value="task" className="mt-4">
                <MarkdownEditor value={taskContent} onChange={setTaskContent} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/templates">Cancel</Link>
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
