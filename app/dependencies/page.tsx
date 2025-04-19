"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
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

// Define the type based on DependencyGraphProps['dependencyData']
type DependencyGraphDataType = {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; type: string }[];
} | null;

// Define type for the API response
interface DependenciesApiResponse {
  graphData: DependencyGraphDataType; // Use the type derived before
  fileStructure: FileStructureItem[];
}

// Local definition
interface FileStructureItem {
  name: string;
  type: 'directory' | 'file';
  path: string; 
  children?: FileStructureItem[];
}

export default function DependenciesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showIndirectDeps, setShowIndirectDeps] = useState(false)
  const [depthLevel, setDepthLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("files")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["app", "components"]))
  const [filteredFiles, setFilteredFiles] = useState<FileStructureItem[]>([])
  const [fileStructure, setFileStructure] = useState<FileStructureItem[]>([])
  const [dependencyGraph, setDependencyGraph] = useState<DependencyGraphDataType>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [repoInfo, setRepoInfo] = useState<{
    organization: string;
    repository: string;
    branch: string;
  } | null>(null)
  const [directDependencies, setDirectDependencies] = useState<string[]>([])
  const [directDependents, setDirectDependents] = useState<string[]>([])

  // Get repository params from URL
  const orgParam = searchParams.get('org')
  const repoParam = searchParams.get('repo')
  const branchParam = searchParams.get('branch')

  // Fetch dependency graph data and file structure on load
  useEffect(() => {
    if (orgParam && repoParam && branchParam) {
      setRepoInfo({ 
          organization: orgParam, 
          repository: repoParam, 
          branch: branchParam 
      });
      
      const fetchData = async () => {
        setIsLoading(true);
        setAnalysisError(null);
        setDependencyGraph(null);
        setFileStructure([]); // Clear previous structure
        
        const apiUrl = `/api/dependencies?org=${encodeURIComponent(orgParam)}&repo=${encodeURIComponent(repoParam)}&branch=${encodeURIComponent(branchParam)}`;
        console.log(`[DependenciesPage] Fetching from: ${apiUrl}`);

        try {
          const response = await fetch(apiUrl);

          if (!response.ok) {
            const errorData = await response.json();
            console.error("[DependenciesPage] API Error:", errorData);
            let errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            if (response.status === 404 && errorData.error?.includes("Repository not found on server")) {
              errorMessage = "Repository clone not found on server. Ensure it's cloned at the expected location.";
            } else if (errorData.details) {
              errorMessage += ` (Details: ${errorData.details})`;
            }
            throw new Error(errorMessage);
          }

          // Expect combined data
          const data: DependenciesApiResponse = await response.json(); 

          if (!data || !data.graphData || !data.fileStructure) {
            console.error("[DependenciesPage] API returned invalid data structure.");
            throw new Error("Received invalid data structure from analysis API.");
          }
          
          console.log(`[DependenciesPage] Received ${data.graphData.nodes.length} nodes, ${data.graphData.edges.length} edges.`);
          console.log(`[DependenciesPage] Received ${data.fileStructure.length} top-level file structure items.`);
          
          setFileStructure(data.fileStructure); // Set the file structure state

          if (data.graphData.nodes.length === 0) {
             setAnalysisError("No dependencies found or repository might be empty/unsupported.");
             setDependencyGraph({ nodes: [], edges: [] });
          } else {
             setDependencyGraph(data.graphData); // Set graph data
             // Set initial selected file
             if (!selectedFile && data.graphData.nodes.length > 0) {
                const entryPoint = data.graphData.nodes.find(n => n.id.includes('page.') || n.id.includes('index.') || n.id.includes('main.') || n.id.includes('app.')) || data.graphData.nodes[0];
                if (entryPoint) {
                   setSelectedFile(entryPoint.id);
                }
             }
          }
          
          toast({ title: "Analysis Complete", description: `Found ${data.graphData.nodes.length} files/modules.` });

        } catch (err: any) {
          console.error("Failed to fetch dependencies:", err);
          const errorMsg = err.message || "An unknown error occurred during analysis.";
          setAnalysisError(errorMsg);
          setDependencyGraph(null);
          setFileStructure([]); // Clear structure on error
          toast({ title: "Analysis Failed", description: errorMsg, variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
      
      // Update mock file structure path for display consistency if needed (optional)
      // This part is cosmetic and doesn't affect the actual analysis
      const mockPathPrefix = `${orgParam}/${repoParam}/${branchParam}`;
      setFileStructure([ /* Update mock structure paths if keeping it */ ]);

    } else {
      // Handle missing parameters - maybe redirect or show error
      console.error("Missing org, repo, or branch parameters in URL");
      setAnalysisError("Missing repository information in URL. Please navigate from the dashboard.");
      setIsLoading(false);
      setFileStructure([]); // Clear structure if params missing
      // Optionally redirect back
      // router.push('/dashboard'); 
    }
    // Only run on mount or when params change
  }, [orgParam, repoParam, branchParam]); // Removed form, analyzeRepository dependencies

  // Handle file search (now uses real fileStructure)
  useEffect(() => {
    if (!searchQuery) {
      setFilteredFiles([])
      return
    }
    // Ensure fileStructure is populated before searching
    if (fileStructure.length > 0) { 
        const results = searchFiles(fileStructure, searchQuery.toLowerCase());
        setFilteredFiles(results);
    }
  }, [searchQuery, fileStructure])

  // Recursive function to search through file structure (now uses real data)
  const searchFiles = (files: FileStructureItem[], query: string): FileStructureItem[] => {
    let results: FileStructureItem[] = []
    files.forEach((file) => {
      if (file.name.toLowerCase().includes(query)) {
        // Ensure we push items matching the expected type
        results.push(file); 
      }
      if (file.type === "directory" && file.children) {
        const childResults = searchFiles(file.children, query)
        results = [...results, ...childResults]
      }
    })
    return results
  }

  // Handle refresh: re-trigger the data fetch
  const handleRefreshData = useCallback(() => {
    if (orgParam && repoParam && branchParam) {
       // Re-run the fetch logic (could extract fetchData outside useEffect)
       const fetchData = async () => { 
         setIsLoading(true);
         setAnalysisError(null);
         setDependencyGraph(null);
         setFileStructure([]); // Clear previous structure
          const apiUrl = `/api/dependencies?org=${encodeURIComponent(orgParam)}&repo=${encodeURIComponent(repoParam)}&branch=${encodeURIComponent(branchParam)}`;
          try {
              const response = await fetch(apiUrl);
              if (!response.ok) { throw new Error("Failed to fetch"); }
              const data: DependenciesApiResponse = await response.json();
              if (!data || !data.graphData || !data.fileStructure) { throw new Error("Invalid data"); }
              setFileStructure(data.fileStructure);
              setDependencyGraph(data.graphData);
              // Reset selected file? Maybe keep it if it still exists?
              toast({ title: "Refreshed", description: "Analysis data reloaded." });
          } catch (err: any) { /* handle error */ }
           finally { setIsLoading(false); }
       }; 
       fetchData();
    } else {
       toast({ title: "Cannot Refresh", description: "Repository parameters missing.", variant: "destructive" });
    }
  }, [orgParam, repoParam, branchParam]);

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

  // Render file structure recursively (Update parameter type)
  const renderFileStructure = (items: FileStructureItem[], basePath = "", level = 0) => {
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
            key={item.path}
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

  // Render search results (Update parameter type if needed, ensure onClick uses item.path)
  const renderSearchResults = () => {
    if (filteredFiles.length === 0) {
      return (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No files match your search
        </div>
      )
    }

    return filteredFiles.map((file: FileStructureItem) => (
      <div
        key={file.path}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          selectedFile === file.path && "bg-muted font-medium",
        )}
        onClick={() => setSelectedFile(file.path)}
      >
        <FileCode className="h-4 w-4 text-muted-foreground" />
        <span>{file.path}</span>
      </div>
    ))
  }

  // Calculate dependencies and dependents when selection changes
  useEffect(() => {
    if (selectedFile && dependencyGraph?.edges && dependencyGraph?.nodes) { // Check nodes exist too
      const deps = dependencyGraph.edges
        .filter(edge => edge.source === selectedFile)
        .map(edge => edge.target)
        // Remove the coreModule filter as it's not available on the simplified node type
        .filter(target => target && !target.includes('node_modules')); 
        
      const dependents = dependencyGraph.edges
        .filter(edge => edge.target === selectedFile)
        .map(edge => edge.source);
        
      // Remove duplicates and sort
      setDirectDependencies([...new Set(deps)].sort());
      setDirectDependents([...new Set(dependents)].sort());
    } else {
      setDirectDependencies([]);
      setDirectDependents([]);
    }
  }, [selectedFile, dependencyGraph]);

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={
              repoInfo && repoInfo.organization && repoInfo.repository 
                ? `/dashboard?repo=${encodeURIComponent(`${repoInfo.organization}/${repoInfo.repository}`)}`
                : "/dashboard"
            }>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Repository Dependency Graph</h1>
            {repoInfo && repoInfo.organization && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="font-medium">{repoInfo.organization}</span>
                <span>/</span>
                <span className="font-medium">{repoInfo.repository}</span>
                {repoInfo.branch && (
                  <>
                    <span>:</span>
                    <Badge variant="outline" className="ml-1 px-1 py-0 h-5">
                      {repoInfo.branch}
                    </Badge>
                  </>
                )}
              </div>
            )}
          </div>
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
            <CardHeader className="border-b px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Files</CardTitle>
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
                  {searchQuery ? renderSearchResults() : renderFileStructure(fileStructure)}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <Card className="h-full flex items-center justify-center min-h-[600px]">
              <div className="text-center p-6">
                <RefreshCw className="mx-auto h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <h3 className="mb-2 text-lg font-medium">Loading Dependencies...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while the repository analysis completes.
                </p>
              </div>
            </Card>
          ) : analysisError ? (
            <Card className="h-full flex items-center justify-center min-h-[600px]">
              <div className="text-center p-6">
                <X className="mx-auto h-12 w-12 text-destructive mb-4" />
                <h3 className="mb-2 text-lg font-medium text-destructive">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{analysisError}</p>
                <Button variant="outline" size="sm" onClick={handleRefreshData} className="mt-4">
                  Retry Analysis
                </Button>
              </div>
            </Card>
          ) : !selectedFile || !dependencyGraph ? (
            <Card className="h-full flex items-center justify-center min-h-[600px]">
              <div className="text-center p-6">
                <h3 className="mb-2 text-lg font-medium">Select a file to view dependencies</h3>
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
                    dependencyData={dependencyGraph}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Dependencies ({directDependencies.length})</CardTitle>
                      <CardDescription className="text-xs">Files this component imports</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-3 space-y-1">
                          {directDependencies.length > 0 ? (
                            directDependencies.map(dep => (
                              <div
                                key={dep}
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer truncate"
                                onClick={() => setSelectedFile(dep)} // Make clickable
                                title={dep} // Show full path on hover
                              >
                                <span className="truncate">{dep}</span>
                                {/* Optional: Add badge if needed */}
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                              No direct dependencies found.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">Dependents ({directDependents.length})</CardTitle>
                      <CardDescription className="text-xs">Files that import this component</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[200px]">
                        <div className="p-3 space-y-1">
                          {directDependents.length > 0 ? (
                            directDependents.map(dep => (
                              <div
                                key={dep}
                                className="flex items-center justify-between text-sm py-1 hover:bg-muted rounded px-1 cursor-pointer truncate"
                                onClick={() => setSelectedFile(dep)} // Make clickable
                                title={dep} // Show full path on hover
                              >
                                <span className="truncate">{dep}</span>
                                {/* Optional: Add badge if needed */}
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                              No direct dependents found.
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
