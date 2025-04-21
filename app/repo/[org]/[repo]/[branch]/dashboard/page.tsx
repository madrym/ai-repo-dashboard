"use client"

import { useEffect, useCallback } from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
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
  Plus,
  Loader2,
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FileNode } from "@/lib/github/types"

export default function DashboardPage() {
  const router = useRouter()
  const params = useParams()
  const org = params.org as string
  const repo = params.repo as string
  const branch = params.branch as string
  
  const { 
    currentRepository, 
    repositories, 
    getRepositoryData, 
    getRepositoryFiles, 
    getRepositoryFileContent,
    getRepositoryDetailedStats,
    getRepomixSummary,
    generateRepomixSummary,
    selectRepository,
    connectRepository
  } = useRepository()
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [selectedFileLang, setSelectedFileLang] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("files");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);

  // Check if params are valid
  useEffect(() => {
    if (!org || !repo || !branch) {
      router.push("/repo")
    }
  }, [org, repo, branch, router])

  // Get current repository data
  const repositoryData = currentRepository ? getRepositoryData(currentRepository) : null

  // Load repository file structure
  useEffect(() => {
    if (currentRepository) {
      setLoading(true)
      setError(null)
      
      // Use cached file structure if available
      if (repositoryData?.fileStructure) {
        setFileStructure(repositoryData.fileStructure)
        setLoading(false)
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
          setLoading(false)
        })
    }
  }, [currentRepository, repositoryData, getRepositoryFiles])

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
          
          // Refresh the page to ensure context is updated
          // router.refresh();
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

  // Add an effect to handle search
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Search in the file structure
      const results = searchFiles(fileStructure, searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching files:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, fileStructure]);

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(`/repo/${org}/${repo}/${branch}/${path}`)
  }

  // Add utility functions for file handling
  const handleFileSelect = async (path: string | null) => {
    console.log("File selected:", path);
    setSelectedFile(path)
    setLoadingFile(true)
    setError(null)
    
    try {
      if (!currentRepository || !path) {
        if (!path) {
          setSelectedFileContent(null)
          setLoadingFile(false)
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
          setSelectedFileLang('javascript')
          break
        case 'jsx':
          setSelectedFileLang('jsx')
          break
        case 'ts':
          setSelectedFileLang('typescript')
          break
        case 'tsx':
          setSelectedFileLang('tsx')
          break
        case 'css':
          setSelectedFileLang('css')
          break
        case 'html':
          setSelectedFileLang('html')
          break
        case 'json':
          setSelectedFileLang('json')
          break
        case 'md':
          setSelectedFileLang('markdown')
          break
        default:
          setSelectedFileLang('text')
      }
    } catch (err) {
      console.error('Error loading file content:', err)
      setError('Failed to load file content')
      setSelectedFileContent(null)
    } finally {
      console.log("Setting isLoadingFile to false");
      setLoadingFile(false)
    }
  }

  // Helper function to search files
  const searchFiles = (files: any[], query: string): any[] => {
    let results: any[] = [];
    
    const searchInFiles = (items: any[], currentPath: string = "") => {
      for (const item of items) {
        const path = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        // Check if file name contains the query
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({ ...item, path });
        }
        
        // Recursively search in directories
        if (item.type === "directory" && item.children) {
          searchInFiles(item.children, path);
        }
      }
    };
    
    searchInFiles(files);
    return results;
  };

  // Filter to show the code folder contents
  const filterCodeFolder = (files: any[]): any[] => {
    // Find the code folder (often named "code" or "main")
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
    // Normalize the target path once
    const normalizedPath = normalizeFilePath(path); 

    for (const file of files) {
      // Normalize the path from the structure *for comparison*
      const fileNormalizedPath = file.path ? normalizeFilePath(file.path) : normalizeFilePath(file.name);

      // Compare normalized paths
      if (fileNormalizedPath === normalizedPath) {
        console.log(`[findFileByPath] Found direct match: ${file.path}`);
        return file;
      }

      // Check if file path ends with the normalized path (also compare normalized)
      if (file.path && fileNormalizedPath.endsWith(normalizedPath)) {
         console.log(`[findFileByPath] Found suffix match: ${file.path}`);
         return file;
      }

      // Recursive search in children
      if (file.type === "directory" && file.children) {
        const found = findFileByPath(file.children, path);
        if (found) {
          return found;
        }
      }
    }

    // If not found in this branch, return null
    return null;
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => handleNavigation('dependencies')}>
              <Package className="mr-2 h-4 w-4" />
              Dependencies
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigation('feature-specs')}>
              <FileText className="mr-2 h-4 w-4" />
              Feature Specs
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Repository info */}
          <div className="border-b bg-background/95 px-6 py-3">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm font-medium">
                {org}/{repo}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                <GitBranch className="mr-1 h-3.5 w-3.5" />
                {branch}
              </Badge>
              {/* Add other repository info badges here */}
            </div>
          </div>

          {/* Content here */}
          {/* Replace this with the actual dashboard content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Repository Dashboard Tabs */}
            <div className="mb-4">
              {repositoryData && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {repositoryData && (
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
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Repository AI Summary Card */}
            <div className="mb-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle>Repository AI Summary</CardTitle>
                  <CardDescription>Generated from repomix-output.xml</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="docs">
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        Docs
                      </TabsTrigger>
                      <TabsTrigger value="ai">
                        <Brain className="mr-1 h-3.5 w-3.5" />
                        AI
                      </TabsTrigger>
                      <TabsTrigger value="explorer">
                        <FileCode className="mr-1 h-3.5 w-3.5" />
                        Explorer
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="docs">
                      <RepoSummary 
                        repository={repositoryData?.repository} 
                        summary={repositoryData?.repomixSummary?.summary || ""}
                        repomixSummary={repositoryData?.repomixSummary}
                        onSelectFile={handleFileSelect}
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
                    <TabsContent value="explorer" className="h-[600px] overflow-hidden m-0 p-0">
                      <div className="flex-grow flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2 flex-shrink-0 px-1">
                          <h2 className="text-sm font-semibold">
                            {getCodeFolderName(fileStructure.length > 0 ? fileStructure : [])} Directory
                          </h2>
                          {selectedFile && (
                            <Badge variant="outline" className="text-xs">
                              <FileCode className="h-3.5 w-3.5 mr-1" />
                              {selectedFile}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-grow border rounded-md overflow-hidden">
                          <ResizablePanelGroup direction="horizontal" className="h-full">
                            <ResizablePanel defaultSize={30} minSize={20}>
                              <div className="flex h-full flex-col overflow-hidden">
                                <div className="border-b p-2 flex-shrink-0">
                                  <div className="relative">
                                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                      type="search"
                                      placeholder={`Search ${getCodeFolderName(fileStructure.length > 0 ? fileStructure : [])}...`}
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
                                <div className="overflow-auto flex-grow p-1">
                                  {searchQuery ? (
                                    <SearchResults 
                                      results={searchResults} 
                                      onSelectFile={handleFileSelect} 
                                      isSearching={isSearching}
                                      query={searchQuery}
                                      selectedFile={selectedFile}
                                    />
                                  ) : (
                                    loading ? (
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
                                        files={filterCodeFolder(fileStructure.length > 0 ? fileStructure : [])} 
                                        onSelectFile={handleFileSelect}
                                        selectedFile={selectedFile}
                                      />
                                    )
                                  )}
                                </div>
                              </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={70}>
                              <div className="flex h-full flex-col overflow-hidden">
                                <div className="border-b px-4 py-2 flex items-center justify-between h-10 flex-shrink-0">
                                  <div className="flex items-center">
                                    {!selectedFile && (
                                      <span className="text-sm text-muted-foreground">No file selected</span>
                                    )}
                                  </div>
                                  {selectedFile && (
                                    <div className="relative">
                                      <SearchIcon className="absolute left-2 top-1.5 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="search"
                                        placeholder="Search in file..."
                                        className="h-7 w-40 pl-7 text-xs"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow overflow-auto p-4">
                                  {loadingFile ? (
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
                                  ) : selectedFileContent !== null ? (
                                    <CodeViewer 
                                      code={selectedFileContent} 
                                      language={selectedFileLang} 
                                      searchTerm={searchQuery} 
                                      filePath={selectedFile}
                                    />
                                  ) : (
                                    <div className="flex h-full flex-col items-center justify-center">
                                      <FileCode className="mb-4 h-12 w-12 text-muted-foreground" />
                                      <h3 className="mb-2 text-lg font-medium">No File Selected</h3>
                                      <p className="text-center text-sm text-muted-foreground">
                                        Select a file from the explorer to view its contents
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 