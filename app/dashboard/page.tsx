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
  HardDrive,
  CloudOff,
  Brain,
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
import { AIAnalysis } from "@/components/ai-analysis"

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
    getRepositoryDetailedStats,
    getRepomixSummary,
    generateRepomixSummary
  } = useRepository()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"code" | "docs" | "ai">("code")
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

  // Load repomix summary if available
  useEffect(() => {
    console.log("🔍 [DEBUG] Repomix useEffect triggered");
    console.log("🔍 [DEBUG] currentRepository:", currentRepository);
    console.log("🔍 [DEBUG] isLocal:", repositoryData?.isLocal);
    console.log("🔍 [DEBUG] has repomixSummary:", !!repositoryData?.repomixSummary);
    console.log("🔍 [DEBUG] has repomixContent:", !!repositoryData?.repomixContent, 
                "length:", repositoryData?.repomixContent?.length || 0);
    
    // Only try to load repomix data if:
    // 1. We have a selected repository
    // 2. The repository is available locally
    // 3. We don't already have repomix content (prevent repeated API calls)
    if (currentRepository && 
        repositoryData?.isLocal && 
        !repositoryData?.repomixContent) {
      
      console.log(`🔍 [DEBUG] Loading repomix summary for ${currentRepository}...`);
      
      // Add a debounce to avoid multiple API calls
      const timeoutId = setTimeout(() => {
        getRepomixSummary(currentRepository).catch(err => {
          // Just log the error, don't set it in state since it's not critical
          console.error('Error loading repomix summary:', err);
        });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log("🔍 [DEBUG] Skipping repomix summary load - conditions not met or data already loaded");
    }
  }, [currentRepository, repositoryData]);

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
    // First filter to get the code folder files
    const filteredFiles = filterCodeFolder(files);
    let results: any[] = []

    filteredFiles.forEach((file) => {
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

  // Function to filter file structure to show only the code folder
  const filterCodeFolder = (files: any[]): any[] => {
    // First try to find the "code" or ".ai" folder at the root level
    const codeFolder = files.find(file => 
      file.type === "directory" && (file.name === "code" || file.name === "main")
    );
    
    // If found, return its children
    if (codeFolder && codeFolder.children) {
      return codeFolder.children;
    }
    
    // Otherwise return the original files
    return files;
  };

  // Get the name of the code folder
  const getCodeFolderName = (files: any[]): string => {
    const codeFolder = files.find(file => 
      file.type === "directory" && (file.name === "code" || file.name === "main")
    );
    
    return codeFolder ? codeFolder.name : "Files";
  };

  // Add a utility function to normalize file paths
  const normalizeFilePath = (path: string): string => {
    // Remove leading slashes
    let normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    
    // If it doesn't start with main/ or code/ and doesn't include a full directory path
    if (!normalizedPath.includes('/')) {
      // It's likely just a filename, which might be found anywhere in the structure
      return normalizedPath;
    }
    
    // Look for common directory patterns and normalize them
    if (normalizedPath.startsWith('main/code/') || normalizedPath.startsWith('code/main/')) {
      normalizedPath = normalizedPath.replace(/^(main\/code\/|code\/main\/)/, '');
    } else if (normalizedPath.startsWith('main/') || normalizedPath.startsWith('code/')) {
      normalizedPath = normalizedPath.replace(/^(main\/|code\/)/, '');
    }
    
    return normalizedPath;
  };

  // Helper function to find a file in the structure by its path/name
  const findFileByPath = (files: any[], path: string): any => {
    // Normalize path by removing leading slashes and directory prefixes
    const normalizedPath = normalizeFilePath(path);
    
    for (const file of files) {
      // Check for direct path match
      if (file.path === normalizedPath || file.path === path) {
        return file;
      }
      
      // Check if file path ends with the normalized path
      if (file.path && file.path.endsWith(normalizedPath)) {
        return file;
      }
      
      // Check if the path ends with the file name
      if (normalizedPath.endsWith(file.name)) {
        return file;
      }
      
      // Recursive search in children
      if (file.type === "directory" && file.children) {
        const found = findFileByPath(file.children, normalizedPath);
        if (found) {
          return found;
        }
      }
    }
    
    // If not found in the filtered structure, try searching the full structure
    if (files !== fileStructure) {
      return findFileByPath(fileStructure, path);
    }
    
    return null;
  };

  // Handle file selection
  const handleFileSelect = async (path: string | null) => {
    console.log("File selected:", path);
    setSelectedFile(path)
    setIsLoadingContent(true)
    setError(null)
    
    try {
      if (!currentRepository || !path) {
        if (!path) {
          setSelectedFileContent(null)
          setIsLoadingContent(false)
          return
        }
        throw new Error('No repository selected')
      }
      
      // Get file content
      console.log("Fetching content for:", path);
      // Try to find the file in the structure to get the correct path
      const matchingFile = findFileByPath(fileStructure, path);
      let contentPath = path;
      
      if (matchingFile && matchingFile.path) {
        contentPath = matchingFile.path;
        console.log("Using path from file structure:", contentPath);
      } else {
        // Fall back to normalized path
        contentPath = normalizeFilePath(path);
        console.log("Using normalized path:", contentPath);
      }
      
      const content = await getRepositoryFileContent(currentRepository, contentPath)
      console.log("Received content length:", content ? content.length : 0);
      
      setSelectedFileContent(content)
      
      // Determine file language
      const extension = path.split('.').pop()?.toLowerCase() || ''
      
      // Set language based on file extension
      switch (extension) {
        case 'js':
          setLanguage('javascript')
          break
        case 'jsx':
          setLanguage('jsx')
          break
        case 'ts':
          setLanguage('typescript')
          break
        case 'tsx':
          setLanguage('tsx')
          break
        case 'css':
          setLanguage('css')
          break
        case 'html':
          setLanguage('html')
          break
        case 'json':
          setLanguage('json')
          break
        case 'md':
          setLanguage('markdown')
          break
        default:
          setLanguage('text')
      }
    } catch (err) {
      console.error('Error loading file content:', err)
      setError('Failed to load file content')
      setSelectedFileContent(null)
    } finally {
      console.log("Setting isLoadingContent to false");
      setIsLoadingContent(false)
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

  // Add a badge to show if the repository is available locally
  const renderLocalBadge = () => {
    if (!repositoryData) return null;
    
    return repositoryData.isLocal ? (
      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
        <HardDrive className="h-4 w-4" />
        <span>Local Clone Available</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
        <CloudOff className="h-4 w-4" />
        <span>Remote Only</span>
      </div>
    );
  };

  // Handler for refreshing the repomix summary
  const handleRefreshSummary = async () => {
    if (!currentRepository) return;
    
    try {
      setError(null);
      await generateRepomixSummary(currentRepository);
    } catch (err) {
      console.error('Error refreshing repomix summary:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh summary';
      setError(errorMessage);
    }
  };

  // Debug useEffect to log sessionStorage on component mount
  useEffect(() => {
    console.log("🔍 [DEBUG] DashboardPage mounted");
    
    // Log sessionStorage contents
    try {
      const repositoryData = sessionStorage.getItem('repositoryData');
      const userSelectedRepo = sessionStorage.getItem('user_selected_repo');
      
      console.log("🔍 [DEBUG] sessionStorage.repositoryData exists:", !!repositoryData);
      console.log("🔍 [DEBUG] sessionStorage.user_selected_repo:", userSelectedRepo);
      
      if (repositoryData) {
        const data = JSON.parse(repositoryData);
        console.log("🔍 [DEBUG] sessionStorage.repositoryData.repository.full_name:", 
          data.repository?.full_name);
        console.log("🔍 [DEBUG] sessionStorage.repositoryData.isLocal:", data.isLocal);
      }
      
      // Clear the user_selected_repo flag on initial page load
      // This ensures that we don't automatically try to load repomix data
      // until the user explicitly interacts with a repository
      sessionStorage.removeItem('user_selected_repo');
      console.log("🔍 [DEBUG] Cleared user_selected_repo flag on initial page load");
      
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
    }
  }, []);

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

  // --- Add logic to extract org, repo, branch ---
  let org: string | undefined;
  let repo: string | undefined;
  let branch: string | undefined = 'main'; // Default branch, adjust if needed

  if (repositoryData?.repository?.full_name) {
    const parts = repositoryData.repository.full_name.split('/');
    if (parts.length === 2) {
      org = parts[0];
      repo = parts[1];
    }
  }
  // You might have branch information elsewhere, e.g., in repositoryData.branches
  // If so, update the `branch` variable accordingly.
  // Example: if (repositoryData.branches?.[0]?.name) branch = repositoryData.branches[0].name;
  // --- End extraction logic ---

  return (
    <div className="flex flex-col overflow-auto min-h-screen p-4 pb-16">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{currentRepository || 'Repository Dashboard'}</h1>
          {renderLocalBadge()}
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

      {/* Repository Dashboard Tabs - Moved up */}
      <div className="mb-4">
        {repositoryData && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle>Repository Overview</CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <RepositoryInfo 
                repository={repositoryData.repository}
                branches={repositoryData.branches}
                contributors={repositoryData.contributors}
                languages={repositoryData.languages}
                pullRequests={repositoryData.pullRequests}
                commitActivity={repositoryData.commitActivity}
                codeFrequency={repositoryData.codeFrequency}
                participation={repositoryData.participation}
                compact={true}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Repository AI Summary - Full Width - Moved down and increased height */}
      <div className="mb-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle>Repository AI Summary</CardTitle>
            <CardDescription>Generated from repomix-output.xml</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-auto pb-3">
            <Tabs defaultValue="docs" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="docs">
                  <FileText className="mr-1 h-3.5 w-3.5" />
                  Docs
                </TabsTrigger>
                <TabsTrigger value="ai">
                  <Brain className="mr-1 h-3.5 w-3.5" />
                  AI
                </TabsTrigger>
              </TabsList>
              <TabsContent value="docs">
                <RepoSummary 
                  repository={repositoryData?.repository} 
                  summary={repoData.summary}
                  repomixSummary={repositoryData?.repomixSummary}
                  onSelectFile={handleFileSelect}
                  onRefreshSummary={handleRefreshSummary}
                />
              </TabsContent>
              <TabsContent value="ai">
                <AIAnalysis 
                  org={org}
                  repo={repo}
                  branch={branch}
                  repositoryName={currentRepository || undefined}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* File Explorer section adjustment to account for larger summary */}
      <div className="flex-grow flex flex-col mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            {getCodeFolderName(fileStructure.length > 0 ? fileStructure : repoData.structure)} Directory
          </h2>
          {selectedFile && (
            <Badge variant="outline" className="text-xs">
              <FileCode className="h-3.5 w-3.5 mr-1" />
              {selectedFile}
            </Badge>
          )}
        </div>
        <div className="flex-grow" style={{ height: "calc(100vh - 560px)", minHeight: "500px" }}>
          <ResizablePanelGroup direction="horizontal" className="h-full border rounded-md">
            <ResizablePanel defaultSize={20} minSize={15}>
              <div className="flex h-full flex-col overflow-hidden">
                <div className="border-b p-2">
                  <div className="relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`Search ${getCodeFolderName(fileStructure.length > 0 ? fileStructure : repoData.structure)}...`}
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

                <div className="overflow-auto flex-grow">
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
                        files={filterCodeFolder(fileStructure.length > 0 ? fileStructure : repoData.structure)} 
                        onSelectFile={handleFileSelect}
                        selectedFile={selectedFile}
                      />
                    )
                  )}
                </div>
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={80}>
              <div className="flex h-full flex-col overflow-hidden">
                <div className="border-b px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {!selectedFile && (
                        <span className="text-sm text-muted-foreground">No file selected</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "code" | "docs" | "ai")} className="mr-2">
                        <TabsList className="h-8">
                          <TabsTrigger value="code" className="h-7 text-xs">
                            <Code className="mr-1 h-3.5 w-3.5" />
                            Code
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
                      <>
                        {/* Debug info for content */}
                        {process.env.NODE_ENV === 'development' && (
                          <div className="mb-2 rounded bg-yellow-100 p-2 text-xs dark:bg-yellow-900/30">
                            <p>Debug: Content Length: {selectedFileContent?.length || 0}</p>
                          </div>
                        )}
                        <CodeViewer 
                          code={selectedFileContent} 
                          language={language} 
                          searchTerm={inFileSearch} 
                          filePath={selectedFile}
                        />
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">
                        <FileCode className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">No File Selected</h3>
                        <p className="text-center text-sm text-muted-foreground">
                          Select a file from the file explorer to view its contents
                        </p>
                      </div>
                    )
                  ) : null}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  )
}
