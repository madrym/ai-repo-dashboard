"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Filter, Plus, Search, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateCard } from "@/components/template-card"
import { templateData } from "@/lib/template-data"
import { ThemeToggle } from "@/components/theme-toggle"

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Extract unique categories from template data
  const categories = Array.from(new Set(templateData.map((template) => template.category)))

  // Filter templates based on search query and selected category
  const filteredTemplates = templateData.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory ? template.category === selectedCategory : true

    return matchesSearch && matchesCategory
  })

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Feature Templates</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild>
            <Link href="/templates/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Tags</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-auto">
          <TabsTrigger value="all" onClick={() => setSelectedCategory(null)}>
            All Templates
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} onClick={() => setSelectedCategory(category)}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates
                .filter((template) => template.category === category)
                .map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
