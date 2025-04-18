"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  X,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Info,
  ChevronRight,
  FileCode,
  FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { DependencyGraph } from "@/components/dependency-graph"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Mock data for dependency analysis
const mockAnalysisData = {
  lastUpdated: "2024-04-18T10:30:00Z",
  totalFiles: 156,
  totalDependencies: 423,
  circularDependencies: 3,
  unusedDependencies: 12,
  tool: "DepCruise",
}

// Mock file structure for the repository
const mockFileStructure = [
  {
    name: "app",
    type: "directory",
    children: [
      {
        name: "dashboard",
        type: "directory",
        children: [
          { name: "page.tsx", type: "file", path: "app/dashboard/page.tsx" },
          { name: "loading.tsx", type: "file", path: "app/dashboard/loading.tsx" },
        ],
      },
      {
        name: "dependencies",
        type: "directory",
        children: [
          { name: "page.tsx", type: "file", path: "app/dependencies/page.tsx" },
          { name: "loading.tsx", type: "file", path: "app/dependencies/loading.tsx" },
        ],
      },
      { name: "layout.tsx", type: "file", path: "app/layout.tsx" },
      { name: "page.tsx", type: "file", path: "app/page.tsx" },
    ],
  },
  {
    name: "components",
    type: "directory",
    children: [
      {
        name: "ui",
        type: "directory",
        children: [
          { name: "button.tsx", type: "file", path: "components/ui/button.tsx" },
          { name: "card.tsx", type: "file", path: "components/ui/card.tsx" },
          { name: "input.tsx", type: "file", path: "components/ui/input.tsx" },
          { name: "tabs.tsx", type: "file", path: "components/ui/tabs.tsx" },
          { name: "badge.tsx", type: "file", path: "components/ui/badge.tsx" },
        ],
      },
      { name: "dependency-graph.tsx", type: "file", path: "components/dependency-graph.tsx" },
      { name: "dependency-details.tsx", type: "file", path: "components/dependency-details.tsx" },
      { name: "theme-toggle.tsx", type: "file", path: "components/theme-toggle.tsx" },
    ],
  },
  {
    name: "lib",
    type: "directory",
    children: [{ name: "utils.ts", type: "file", path: "lib/utils.ts" }],
  },
  { name: "package.json", type: "file", path: "package.json" },
  { name: "tsconfig.json", type: "file", path: "tsconfig.json" },
]

export default function DependenciesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showIndirectDeps, setShowIndirectDeps] = useState(false)
  const [depthLevel, setDepthLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("files")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["app", "components"]))
  const [filteredFiles, setFilteredFiles] = useState<any[]>([])

  // Handle file search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredFiles([])
      return
    }

    const results = searchFiles(mockFileStructure, searchQuery.toLowerCase())
    setFilteredFiles(results)
  }, [searchQuery])

  // Recursive function to search through file structure
  const searchFiles = (files: any[], query: string): any[] => {
    let results: any[] = []

    files.forEach((file) => {
      // Check if file name matches query
      if (file.name.toLowerCase().includes(query)) {
        results.push(file)
      }

      // If it's a directory, search its children
      if (file.type === "directory" && file.children) {
        const childResults = searchFiles(file.children, query)
        results = [...results, ...childResults]
      }
    })

    return results
  }

  // Handle refresh of dependency data
  const handleRefreshData = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Dependency graph updated",
        description: "The dependency graph has been refreshed with the latest data.",
      })
    }, 2000)
  }

  // Handle download of dependency data
  const handleDownloadData = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to download its dependency data.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Download started",
      description: `Dependency data for ${selectedFile} is being downloaded as JSON.`,
    })

    // In a real app, this would trigger a file download
    const element = document.createElement("a")
    const file = new Blob([JSON.stringify({ file: selectedFile, dependencies: "mock data" }, null, 2)], {
      type: "application/json",
    })
    element.href = URL.createObjectURL(file)
    element.download = `${selectedFile.replace(/\//g, "-")}-dependencies.json`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Toggle folder expansion
  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  // Render file structure recursively
  const renderFileStructure = (items: any[], basePath = "", level = 0) => {
    return items.map((item) => {
      const currentPath = basePath ? `${basePath}/${item.name}` : item.name

      if (item.type === "directory") {
        const isExpanded = expandedFolders.has(currentPath)
        return (
          <div key={currentPath}>
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => toggleFolder(currentPath)}
            >
              <ChevronRight
                className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")}
              />
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span>{item.name}</span>
            </div>
            {isExpanded && item.children && <div>{renderFileStructure(item.children, currentPath, level + 1)}</div>}
          </div>
        )
      } else {
        return (
          <div
            key={currentPath}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
              selectedFile === item.path && "bg-muted font-medium",
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => setSelectedFile(item.path)}
          >
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span>{item.name}</span>
          </div>
        )
      }
    })
  }

  // Render search results
  const renderSearchResults = () => {
    if (filteredFiles.length === 0) {
      return (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No files match your search
        </div>
      )
    }

    return filteredFiles.map((file) => (
      <div
        key={file.path || file.name}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          selectedFile === file.path && "bg-muted font-medium",
        )}
        onClick={() => file.path && setSelectedFile(file.path)}
      >
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <span>{file.path || file.name}</span>
      </div>
    ))
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
          <h1 className="text-2xl font-bold">Repository Dependency Graph</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleRefreshData} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh dependency data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownloadData}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download dependency data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card className="h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="popular">Popular</TabsTrigger>
                    <TabsTrigger value="recent">Recent</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-b p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search files..."
                      className="pl-8 pr-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-2">
                    <TabsContent value="files" className="m-0 p-0">
                      {searchQuery ? renderSearchResults() : renderFileStructure(mockFileStructure)}
                    </TabsContent>
                    <TabsContent value="popular" className="m-0 p-0">
                      <div className="space-y-1">
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("components/ui/button.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>components/ui/button.tsx</span>
                          <Badge className="ml-auto" variant="outline">
                            42 deps
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("app/layout.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>app/layout.tsx</span>
                          <Badge className="ml-auto" variant="outline">
                            38 deps
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("lib/utils.ts")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>lib/utils.ts</span>
                          <Badge className="ml-auto" variant="outline">
                            29 deps
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("components/ui/card.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>components/ui/card.tsx</span>
                          <Badge className="ml-auto" variant="outline">
                            24 deps
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("app/dashboard/page.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>app/dashboard/page.tsx</span>
                          <Badge className="ml-auto" variant="outline">
                            21 deps
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="recent" className="m-0 p-0">
                      <div className="space-y-1">
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("app/dependencies/page.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>app/dependencies/page.tsx</span>
                          <Badge className="ml-auto" variant="secondary">
                            Just now
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("components/dependency-graph.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>components/dependency-graph.tsx</span>
                          <Badge className="ml-auto" variant="secondary">
                            5m ago
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("components/ui/tabs.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>components/ui/tabs.tsx</span>
                          <Badge className="ml-auto" variant="secondary">
                            1h ago
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("app/dashboard/page.tsx")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>app/dashboard/page.tsx</span>
                          <Badge className="ml-auto" variant="secondary">
                            3h ago
                          </Badge>
                        </div>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          onClick={() => setSelectedFile("lib/utils.ts")}
                        >
                          <FileCode className="h-4 w-4 text-muted-foreground" />
                          <span>lib/utils.ts</span>
                          <Badge className="ml-auto" variant="secondary">
                            Yesterday
                          </Badge>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="md:col-span-2">
          {!selectedFile ? (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Select a file to view dependencies</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Choose a file from the file explorer to visualize its dependencies and dependents.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-center">
                  <Button variant="outline" onClick={() => setActiveTab("popular")}>
                    View popular files
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("recent")}>
                    View recent files
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full">
              <CardHeader className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base truncate">{selectedFile}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                            <X className="mr-2 h-4 w-4" />
                            Close
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Close dependency view</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Dependency Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="depth-level" className="text-xs">
                          Depth Level
                        </Label>
                        <span className="text-xs text-muted-foreground">{depthLevel}</span>
                      </div>
                      <Slider
                        id="depth-level"
                        min={1}
                        max={5}
                        step={1}
                        value={[depthLevel]}
                        onValueChange={(value) => setDepthLevel(value[0])}
                      />
                      <div className="flex items-center space-x-2">
                        <Switch id="show-indirect" checked={showIndirectDeps} onCheckedChange={setShowIndirectDeps} />
                        <Label htmlFor="show-indirect" className="text-xs">
                          Show indirect dependencies
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Visualization</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="zoom-level" className="text-xs">
                          Zoom Level
                        </Label>
                        <span className="text-xs text-muted-foreground">{Math.round(zoomLevel * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                        >
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <Slider
                          id="zoom-level"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[zoomLevel]}
                          onValueChange={(value) => setZoomLevel(value[0])}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[500px] border rounded-md overflow-hidden">
                  <DependencyGraph
                    filePath={selectedFile}
                    depthLevel={depthLevel}
                    showIndirectDeps={showIndirectDeps}
                    zoomLevel={zoomLevel}
                    onNodeSelect={setSelectedFile}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Dependencies</CardTitle>
                      <CardDescription className="text-xs">Files this component imports</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-3 space-y-1">
                          {/* Mock dependencies */}
                          {selectedFile === "app/dependencies/page.tsx" && (
                            <>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/dependency-graph.tsx")}
                              >
                                <span className="truncate">components/dependency-graph.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/ui/card.tsx")}
                              >
                                <span className="truncate">components/ui/card.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/ui/button.tsx")}
                              >
                                <span className="truncate">components/ui/button.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/ui/tabs.tsx")}
                              >
                                <span className="truncate">components/ui/tabs.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("lib/utils.ts")}
                              >
                                <span className="truncate">lib/utils.ts</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                            </>
                          )}
                          {selectedFile === "components/dependency-graph.tsx" && (
                            <>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("lib/utils.ts")}
                              >
                                <span className="truncate">lib/utils.ts</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/ui/button.tsx")}
                              >
                                <span className="truncate">components/ui/button.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                            </>
                          )}
                          {selectedFile !== "app/dependencies/page.tsx" &&
                            selectedFile !== "components/dependency-graph.tsx" && (
                              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                                {Math.random() > 0.5 ? "No dependencies found" : "Loading dependencies..."}
                              </div>
                            )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Dependents</CardTitle>
                      <CardDescription className="text-xs">Files that import this component</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-3 space-y-1">
                          {/* Mock dependents */}
                          {selectedFile === "components/dependency-graph.tsx" && (
                            <>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("app/dependencies/page.tsx")}
                              >
                                <span className="truncate">app/dependencies/page.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                            </>
                          )}
                          {selectedFile === "lib/utils.ts" && (
                            <>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("app/dependencies/page.tsx")}
                              >
                                <span className="truncate">app/dependencies/page.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/dependency-graph.tsx")}
                              >
                                <span className="truncate">components/dependency-graph.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                              <div
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer"
                                onClick={() => setSelectedFile("components/ui/button.tsx")}
                              >
                                <span className="truncate">components/ui/button.tsx</span>
                                <Badge variant="outline" className="ml-2">
                                  Direct
                                </Badge>
                              </div>
                            </>
                          )}
                          {selectedFile !== "components/dependency-graph.tsx" && selectedFile !== "lib/utils.ts" && (
                            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                              {Math.random() > 0.5 ? "No dependents found" : "Loading dependents..."}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
