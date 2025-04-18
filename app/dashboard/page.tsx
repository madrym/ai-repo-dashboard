"use client"

import { useEffect } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  FileCode,
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
import { RepositoryInfo } from "@/components/repository-info"
import { useRepository } from "@/lib/github/context"

// Enhanced mock data - keep this for non-connected repositories or fallback
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
  const router = useRouter()
  const { 
    currentRepository, 
    repositories, 
    getRepositoryData, 
    getRepositoryFiles, 
    getRepositoryFileContent,
    getRepositoryDetailedStats 
  } = useRepository()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"code" | "docs">("code")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [inFileSearch, setInFileSearch] = useState("")
  const [language, setLanguage] = useState("text")
  const [infoTab, setInfoTab] = useState<"overview" | "cicd" | "tools" | "pr">("overview")
  const [fileStructure, setFileStructure] = useState<any[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated
  useEffect(() => {
    if (!currentRepository) {
      router.push("/auth")
    }
  }, [currentRepository, router])

  // Get current repository data
  const repositoryData = currentRepository ? getRepositoryData(currentRepository) : null

  // Load repository file structure
  useEffect(() => {
    if (currentRepository) {
      setIsLoadingFiles(true)
      setError(null)
      
      // Use cached file structure if available
      if (repositoryData?.fileStructure) {
        setFileStructure(repositoryData.fileStructure)
        setIsLoadingFiles(false)
        return
      }
      
      // Otherwise fetch from API
      getRepositoryFiles(currentRepository)
        .then(files => {
          setFileStructure(files)
        })
        .catch(err => {
          console.error('Error loading file structure:', err)
          setError('Failed to load repository files')
        })
        .finally(() => {
          setIsLoadingFiles(false)
        })
    }
  }, [currentRepository, repositoryData, getRepositoryFiles])
  
  // Load repository statistics
  useEffect(() => {
    if (currentRepository) {
      // Only load if not already loaded
      if (!repositoryData?.pullRequests && !repositoryData?.commitActivity) {
        getRepositoryDetailedStats(currentRepository).catch(err => {
          console.error('Error loading repository statistics:', err)
        })
      }
    }
  }, [currentRepository, repositoryData, getRepositoryDetailedStats])

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
      const results = searchFiles(fileStructure, searchQuery.toLowerCase())
      setSearchResults(results)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, fileStructure])

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

  const handleFileSelect = async (path: string | null) => {
    setSelectedFile(path)
    setSelectedFileContent(null)
    // Clear in-file search when selecting a new file
    setInFileSearch("")
    
    if (path && currentRepository) {
      setIsLoadingContent(true)
      setError(null)
      
      try {
        const content = await getRepositoryFileContent(currentRepository, path)
        setSelectedFileContent(content)
      } catch (err) {
        console.error('Error loading file content:', err)
        setError('Failed to load file content')
      } finally {
        setIsLoadingContent(false)
      }
    }
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

  // If no repository is connected, show loading or redirect
  if (!repositoryData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>No Repository Connected</CardTitle>
            <CardDescription>Connect a repository to continue</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/auth">Connect Repository</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{repositoryData.repository.name}</h1>
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
                <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" />
                <path d="m6 17 3.13-5.78c.53-.97 1.53-1.58 2.61-1.79 1.08-.21 2.21.08 3.13.8L18 13.97" />
                <path d="m9 12 3.13-5.78C12.66 5.22 13.66 4.6 14.74 4.4c1.08-.21 2.21.08 3.13.8L22 9.03" />
              </svg>
              Dependencies
            </Link>
          </Button>
        </div>
      </div>

      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="flex h-full flex-col">
            <div className="border-b p-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search files..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {searchQuery ? (
              <SearchResults 
                results={searchResults} 
                onSelectFile={handleFileSelect} 
                isSearching={isSearching}
                query={searchQuery}
                selectedFile={selectedFile}
              />
            ) : (
              isLoadingFiles ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin mb-2 h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-muted-foreground">Loading files...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center p-4">
                  <div className="text-center text-destructive">
                    <p className="mb-2 font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <FileExplorer 
                  files={fileStructure.length > 0 ? fileStructure : repoData.structure} 
                  onSelectFile={handleFileSelect} 
                  selectedFile={selectedFile} 
                />
              )
            )}
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={55}>
          <div className="flex h-full flex-col">
            <div className="border-b px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {selectedFile ? (
                    <>
                      <FileCode className="mr-2 h-5 w-5" />
                      <span className="text-sm font-medium">{selectedFile}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">No file selected</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "docs")} className="mr-2">
                    <TabsList className="h-8">
                      <TabsTrigger value="code" className="h-7 text-xs">
                        <Code className="mr-1 h-3.5 w-3.5" />
                        Code
                      </TabsTrigger>
                      <TabsTrigger value="docs" className="h-7 text-xs">
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        Docs
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  {/* In file search */}
                  {selectedFile && activeTab === "code" && (
                    <div className="relative">
                      <SearchIcon className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search in file..."
                        className="h-7 w-40 pl-7 text-xs"
                        value={inFileSearch}
                        onChange={(e) => setInFileSearch(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="h-full overflow-auto p-4">
              {isLoadingContent ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin mb-2 h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full" />
                    <p className="text-sm text-muted-foreground">Loading file content...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-destructive">
                    <p className="mb-2 font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : activeTab === "code" ? (
                selectedFile ? (
                  <CodeViewer 
                    code={selectedFileContent || "// Loading..."} 
                    language={language} 
                    searchTerm={inFileSearch} 
                    filePath={selectedFile}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <FileCode className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">No File Selected</h3>
                    <p className="text-center text-sm text-muted-foreground">
                      Select a file from the file explorer to view its contents
                    </p>
                  </div>
                )
              ) : (
                <RepoSummary 
                  repository={repoData} 
                  summary={repoData.summary}
                />
              )}
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={25}>
          <div className="h-full overflow-auto p-4">
            <RepositoryInfo 
              repository={repositoryData.repository}
              branches={repositoryData.branches}
              contributors={repositoryData.contributors}
              languages={repositoryData.languages}
              pullRequests={repositoryData.pullRequests}
              commitActivity={repositoryData.commitActivity}
              codeFrequency={repositoryData.codeFrequency}
              participation={repositoryData.participation}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
