"use client"

import { useEffect } from "react"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Code,
  FileText,
  History,
  Info,
  Languages,
  Package,
  SearchIcon,
  TestTube,
  X,
  GitPullRequest,
  GitBranch,
  CheckCircle,
  Shield,
  Server,
  Workflow,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileExplorer } from "@/components/file-explorer"
import { CodeViewer } from "@/components/code-viewer"
import { RepoSummary } from "@/components/repo-summary"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { Input } from "@/components/ui/input"
import { SearchResults } from "@/components/search-results"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

// Enhanced mock data
const repoData = {
  name: "example-repo",
  description: "A sample repository for demonstration",
  languages: [
    { name: "TypeScript", version: "5.0.4", percentage: 68 },
    { name: "JavaScript", version: "ES2022", percentage: 22 },
    { name: "CSS", version: "CSS3", percentage: 10 },
  ],
  packageManagers: ["npm 9.6.7", "yarn 1.22.19"],
  runtimes: ["Node.js v18.16.0", "React 18.2.0", "Next.js 14.0.3"],
  testingFrameworks: ["Jest 29.5.0", "React Testing Library 14.0.0", "Cypress 12.13.0"],
  cicd: {
    provider: "GitHub Actions",
    workflows: [
      { name: "CI", triggers: ["push", "pull_request"], status: "active" },
      { name: "CD", triggers: ["release"], status: "active" },
      { name: "Nightly Tests", triggers: ["schedule"], status: "active" },
    ],
  },
  connectedTools: [
    { name: "Docker", type: "containerization", status: "connected" },
    { name: "Snyk", type: "security", status: "connected" },
    { name: "SonarQube", type: "code quality", status: "connected" },
    { name: "Perfecto", type: "testing", status: "connected" },
  ],
  prChecks: [
    { name: "Lint", required: true, status: "active" },
    { name: "Build", required: true, status: "active" },
    { name: "Unit Tests", required: true, status: "active" },
    { name: "Integration Tests", required: false, status: "active" },
    { name: "Snyk Security Scan", required: true, status: "active" },
    { name: "SonarQube Analysis", required: true, status: "active" },
  ],
  prWorkflows: [
    { name: "Automatic Dependency Updates", status: "enabled" },
    { name: "Code Owners Review", status: "enabled" },
    { name: "Stale PR Detection", status: "enabled" },
    { name: "Size Labeler", status: "enabled" },
  ],
  summary:
    "This repository is a Next.js application that provides a dashboard for GitHub repositories and a feature planner with AI assistance.",
  structure: [
    {
      name: "app",
      type: "directory",
      children: [
        { name: "page.tsx", type: "file", path: "app/page.tsx" },
        { name: "layout.tsx", type: "file", path: "app/layout.tsx" },
        {
          name: "dashboard",
          type: "directory",
          children: [{ name: "page.tsx", type: "file", path: "app/dashboard/page.tsx" }],
        },
        {
          name: "planner",
          type: "directory",
          children: [{ name: "page.tsx", type: "file", path: "app/planner/page.tsx" }],
        },
      ],
    },
    {
      name: "components",
      type: "directory",
      children: [
        { name: "file-explorer.tsx", type: "file", path: "components/file-explorer.tsx" },
        { name: "code-viewer.tsx", type: "file", path: "components/code-viewer.tsx" },
        { name: "repo-summary.tsx", type: "file", path: "components/repo-summary.tsx" },
      ],
    },
    { name: "package.json", type: "file", path: "package.json" },
    { name: "tsconfig.json", type: "file", path: "tsconfig.json" },
    { name: "README.md", type: "file", path: "README.md" },
  ],
}

export default function DashboardPage() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"code" | "docs">("code")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [inFileSearch, setInFileSearch] = useState("")
  const [language, setLanguage] = useState("text")
  const [infoTab, setInfoTab] = useState<"overview" | "cicd" | "tools" | "pr">("overview")

  // Handle file search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    // Simulate search delay
    const timer = setTimeout(() => {
      // Search through file structure
      const results = searchFiles(repoData.structure, searchQuery.toLowerCase())
      setSearchResults(results)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
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

  const handleFileSelect = (path: string | null) => {
    setSelectedFile(path)
    // Clear in-file search when selecting a new file
    setInFileSearch("")
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  useEffect(() => {
    if (!selectedFile) return

    const extension = selectedFile.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        setLanguage("typescript")
        break
      case "css":
        setLanguage("css")
        break
      case "html":
        setLanguage("html")
        break
      case "json":
        setLanguage("json")
        break
      case "md":
        setLanguage("markdown")
        break
      default:
        setLanguage("text")
    }
  }, [selectedFile])

  // Helper function to render status badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
      case "enabled":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400">{status}</Badge>
      case "inactive":
      case "disabled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{repoData.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" asChild>
            <Link href="/history">
              <History className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dependencies">
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Dependency Graph
            </Link>
          </Button>
          <Button asChild>
            <Link href="/planner">Plan New Feature</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Repository Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={infoTab} onValueChange={(value) => setInfoTab(value as any)} className="w-full">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="overview" className="flex-1">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cicd" className="flex-1">
                  CI/CD
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex-1">
                  Tools
                </TabsTrigger>
                <TabsTrigger value="pr" className="flex-1">
                  PR
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview">
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <Languages className="h-4 w-4 text-muted-foreground" />
                      Languages & Versions
                    </h3>
                    <div className="mt-2 space-y-2">
                      {repoData.languages.map((lang) => (
                        <div key={lang.name} className="flex items-center justify-between">
                          <span className="text-sm">{lang.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {lang.version}
                            </Badge>
                            <Badge className="bg-primary/10 text-xs">{lang.percentage}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      Runtimes
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {repoData.runtimes.map((runtime) => (
                        <Badge
                          key={runtime}
                          className="bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400"
                        >
                          {runtime}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Package Managers
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {repoData.packageManagers.map((pm) => (
                        <Badge key={pm} className="bg-primary/10">
                          {pm}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <TestTube className="h-4 w-4 text-muted-foreground" />
                      Testing Frameworks
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {repoData.testingFrameworks.map((tf) => (
                        <Badge key={tf} className="bg-primary/10">
                          {tf}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* CI/CD Tab */}
              <TabsContent value="cicd">
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      CI/CD Provider
                    </h3>
                    <div className="mt-1">
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400">
                        {repoData.cicd.provider}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      Workflows
                    </h3>
                    <div className="mt-2 space-y-2">
                      {repoData.cicd.workflows.map((workflow, index) => (
                        <div key={index} className="rounded-md border p-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{workflow.name}</span>
                            {renderStatusBadge(workflow.status)}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {workflow.triggers.map((trigger) => (
                              <Badge key={trigger} variant="outline" className="text-xs">
                                {trigger}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools">
                <div className="space-y-4 pt-4">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Connected Tools
                  </h3>
                  <div className="space-y-2">
                    {repoData.connectedTools.map((tool, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md border p-2">
                        <div>
                          <div className="font-medium text-sm">{tool.name}</div>
                          <div className="text-xs text-muted-foreground">{tool.type}</div>
                        </div>
                        {renderStatusBadge(tool.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* PR Tab */}
              <TabsContent value="pr">
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      PR Status Checks
                    </h3>
                    <div className="mt-2 space-y-2">
                      {repoData.prChecks.map((check, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{check.name}</span>
                            {check.required && (
                              <Badge variant="outline" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {renderStatusBadge(check.status)}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="flex items-center gap-2 font-medium">
                      <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                      PR Workflows
                    </h3>
                    <div className="mt-2 space-y-2">
                      {repoData.prWorkflows.map((workflow, index) => (
                        <div key={index} className="flex items-center justify-between rounded-md border p-2">
                          <span className="text-sm">{workflow.name}</span>
                          {renderStatusBadge(workflow.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>AI Summary</CardTitle>
            <CardDescription>Generated overview of the repository</CardDescription>
          </CardHeader>
          <CardContent>
            <RepoSummary summary={repoData.summary} />
          </CardContent>
        </Card>
      </div>

      {/* Code Explorer with Split View */}
      <Card className="mt-6 overflow-hidden">
        <CardHeader className="border-b bg-muted/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Repository Explorer</CardTitle>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "docs")}>
                <TabsList>
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger value="docs" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentation
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
            {/* File Explorer Panel */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r">
              <div className="flex h-full flex-col">
                {/* Search Bar */}
                <div className="border-b p-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search files..."
                      className="pl-8 pr-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* File Explorer or Search Results */}
                <div className="flex-1 overflow-auto">
                  {searchQuery ? (
                    <SearchResults
                      results={searchResults}
                      isSearching={isSearching}
                      query={searchQuery}
                      onSelectFile={handleFileSelect}
                      selectedFile={selectedFile}
                    />
                  ) : (
                    <FileExplorer
                      files={repoData.structure}
                      onSelectFile={handleFileSelect}
                      selectedFile={selectedFile}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>

            {/* Resizable Handle */}
            <ResizableHandle withHandle />

            {/* Code/Docs Viewer Panel */}
            <ResizablePanel defaultSize={75}>
              <div className="h-full overflow-auto">
                {activeTab === "code" ? (
                  <CodeViewer
                    filePath={selectedFile}
                    searchTerm={inFileSearch}
                    onSearchChange={setInFileSearch}
                    language={language}
                  />
                ) : (
                  <div className="p-6">
                    <h3 className="text-lg font-medium">README.md</h3>
                    <div className="mt-4 rounded-md border p-4">
                      <h1 className="text-xl font-bold">Example Repository</h1>
                      <p className="mt-2">
                        This is a sample repository for demonstration purposes. It contains a Next.js application that
                        provides a dashboard for GitHub repositories and a feature planner with AI assistance.
                      </p>
                      <h2 className="mt-4 text-lg font-semibold">Features</h2>
                      <ul className="mt-2 list-inside list-disc">
                        <li>Repository dashboard with AI-powered insights</li>
                        <li>Feature planner with AI assistance</li>
                        <li>File explorer with syntax highlighting</li>
                        <li>GitHub integration for creating branches and PRs</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>
    </div>
  )
}
