"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  Package,
  FileText,
  GitBranch,
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
import { useRepository } from "@/lib/github/context"
import { FileExplorer } from "@/components/file-explorer"

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
  const params = useParams()
  const org = params.org as string
  const repo = params.repo as string
  const branch = params.branch as string
  
  const { 
    currentRepository, 
    repositories, 
    selectRepository, 
    connectRepository 
  } = useRepository()
  
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
  const [directDependencies, setDirectDependencies] = useState<string[]>([])
  const [directDependents, setDirectDependents] = useState<string[]>([])

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
          setAnalysisError("Failed to initialize repository. Please return to the repository page and try again.");
          toast({
            title: "Repository Error",
            description: "Failed to initialize repository. Please return to the repository page and try again.",
            variant: "destructive",
          });
        }
      })();
    }
  }, [org, repo, currentRepository, repositories, selectRepository, connectRepository]);

  // Fetch dependency graph data and file structure on load
  useEffect(() => {
    if (org && repo && branch) {
      const fetchData = async () => {
        setIsLoading(true);
        setAnalysisError(null);
        setDependencyGraph(null);
        setFileStructure([]); // Clear previous structure
        
        const apiUrl = `/api/dependencies?org=${encodeURIComponent(org)}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`;
        console.log(`[DependenciesPage] Fetching from: ${apiUrl}`);

        try {
          console.log("[DependenciesPage] Fetching dependencies from:", apiUrl);
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
            console.error("[DependenciesPage] API returned invalid data structure:", data);
            throw new Error("Received invalid data structure from analysis API.");
          }
          
          console.log(`[DependenciesPage] Received ${data.graphData.nodes.length} nodes, ${data.graphData.edges.length} edges.`);
          
          // Debug: Log a sample of the edges to check their format
          if (data.graphData.edges.length > 0) {
            console.log("[DependenciesPage] Sample edges:", data.graphData.edges.slice(0, 3));
          }
          
          console.log(`[DependenciesPage] Received ${data.fileStructure.length} top-level file structure items.`);
          
          setFileStructure(data.fileStructure); // Set the file structure state

          if (data.graphData.nodes.length === 0) {
             setAnalysisError("No dependencies found or repository might be empty/unsupported.");
             setDependencyGraph({ nodes: [], edges: [] });
          } else {
             // Create a more robust graph representation with normalized paths
             const normalizedGraph = {
               nodes: data.graphData.nodes,
               edges: data.graphData.edges.map(edge => {
                 // Ensure source and target are strings
                 return {
                   ...edge,
                   source: String(edge.source),
                   target: String(edge.target)
                 };
               })
             };
             
             console.log("[DependenciesPage] Setting dependency graph with normalized edges");
             setDependencyGraph(normalizedGraph); // Set graph data with normalized edges
             
             // Set initial selected file
             if (!selectedFile && data.graphData.nodes.length > 0) {
                const entryPoint = data.graphData.nodes.find(n => 
                  n.id.includes('page.') || 
                  n.id.includes('index.') || 
                  n.id.includes('main.') || 
                  n.id.includes('app.')
                ) || data.graphData.nodes[0];
                
                if (entryPoint) {
                   console.log("[DependenciesPage] Setting initial selected file:", entryPoint.id);
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
    } else {
      // Handle missing parameters
      setAnalysisError("Missing repository information in URL. Please navigate from the repository page.");
      setIsLoading(false);
      // Redirect to repo page
      router.push('/repo'); 
    }
  }, [org, repo, branch, router, selectedFile]);

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(`/repo/${org}/${repo}/${branch}/${path}`)
  }

  // Helper function to find a file in the file structure by path
  const findFileByPath = (files: FileStructureItem[], path: string): FileStructureItem | null => {
    for (const file of files) {
      if (file.path === path) {
        return file;
      }
      
      if (file.type === 'directory' && file.children) {
        const found = findFileByPath(file.children, path);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
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
              <Badge variant="outline" className="text-sm font-medium">
                <Package className="mr-1 h-3.5 w-3.5" />
                Dependencies
              </Badge>
            </div>
          </div>

          {/* Content here */}
          {/* ... Remaining dependencies content ... */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left column: controls */}
              <div className="md:col-span-3 space-y-4">
                {/* Add File Tree */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Files</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[400px] overflow-auto border-t">
                      {isLoading ? (
                        <div className="flex h-full items-center justify-center p-4">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : fileStructure.length === 0 ? (
                        <div className="flex h-full items-center justify-center p-4 text-center">
                          <div>
                            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No files found</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2">
                          <FileExplorer 
                            files={fileStructure} 
                            onSelectFile={(filePath) => {
                              // Only proceed if we have a valid file path
                              if (typeof filePath === 'string') {
                                // Only select if it's a file, not a directory
                                const file = findFileByPath(fileStructure, filePath);
                                if (file && file.type === 'file') {
                                  setSelectedFile(filePath);
                                }
                              }
                            }} 
                            selectedFile={selectedFile}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Zoom Controls */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Zoom</span>
                        <span>{Math.round(zoomLevel * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          disabled={zoomLevel <= 0.2}
                          onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.1))}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Slider 
                          value={[zoomLevel * 100]} 
                          min={20} 
                          max={200} 
                          step={10}
                          onValueChange={(value) => setZoomLevel(value[0] / 100)}
                          className="flex-1" 
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          disabled={zoomLevel >= 2}
                          onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Depth Controls */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Dependency Depth</span>
                        <span>{depthLevel}</span>
                      </div>
                      <Slider 
                        value={[depthLevel]} 
                        min={1} 
                        max={5} 
                        step={1}
                        onValueChange={(value) => setDepthLevel(value[0])}
                      />
                    </div>
                    
                    {/* Show Indirect Dependencies */}
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="indirect-deps" className="flex-1 text-sm">
                        Show Indirect Dependencies
                      </Label>
                      <Switch 
                        id="indirect-deps" 
                        checked={showIndirectDeps}
                        onCheckedChange={setShowIndirectDeps}
                      />
                    </div>
                    
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search files..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-9 w-9 p-0"
                          onClick={() => setSearchQuery("")}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right column: graph */}
              <div className="md:col-span-9">
                <Card className="h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Dependency Graph</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Refresh</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isLoading ? (
                      <div className="flex h-[70vh] items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin mb-4 h-10 w-10 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                          <h3 className="text-lg font-medium mb-2">Analyzing Dependencies</h3>
                          <p className="text-sm text-muted-foreground mb-4">This may take a moment...</p>
                        </div>
                      </div>
                    ) : analysisError ? (
                      <div className="flex h-[70vh] items-center justify-center">
                        <div className="text-center max-w-md">
                          <Info className="mx-auto h-10 w-10 text-destructive mb-4" />
                          <h3 className="text-lg font-medium mb-2">Analysis Error</h3>
                          <p className="text-sm text-muted-foreground mb-4">{analysisError}</p>
                          <Button 
                            variant="outline" 
                            onClick={() => window.location.reload()}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : !dependencyGraph ? (
                      <div className="flex h-[70vh] items-center justify-center">
                        <div className="text-center">
                          <Package className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Dependencies Found</h3>
                          <p className="text-sm text-muted-foreground mb-4">This repository has no detectable dependencies.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-[70vh]">
                        {/* Graph visualization - takes most of the height */}
                        <div className="flex-1 mb-3 bg-muted/30 rounded-md overflow-hidden">
                          <DependencyGraph
                            filePath={selectedFile || ''}
                            dependencyData={dependencyGraph}
                            depthLevel={depthLevel}
                            showIndirectDeps={showIndirectDeps}
                            zoomLevel={zoomLevel}
                            onNodeSelect={(nodeId) => {
                              console.log("Node selected:", nodeId);
                              setSelectedFile(nodeId);
                              
                              // Find dependencies and dependents for the selected node
                              const deps: string[] = [];
                              const dependents: string[] = [];
                              
                              if (dependencyGraph) {
                                console.log("Total edges in graph:", dependencyGraph.edges.length);
                                
                                // Check if nodeId is normalized
                                const normalizedNodeId = nodeId;
                                console.log("Looking for edges with source or target:", normalizedNodeId);
                                
                                // Find direct dependencies (outgoing edges)
                                dependencyGraph.edges.forEach(edge => {
                                  // Log a few edges to see their structure
                                  if (deps.length < 2 && dependents.length < 2) {
                                    console.log("Sample edge:", { source: edge.source, target: edge.target });
                                  }
                                  
                                  // Extract clean file paths for comparison
                                  const cleanNodeId = normalizedNodeId.replace(/^\/+/, '').trim();
                                  const cleanSource = edge.source.replace(/^\/+/, '').trim();
                                  const cleanTarget = edge.target.replace(/^\/+/, '').trim();
                                  
                                  // Various matching strategies to handle different path formats
                                  const sourceMatches = 
                                    cleanSource === cleanNodeId || 
                                    cleanSource.endsWith(`/${cleanNodeId}`) ||
                                    (cleanNodeId.includes('/') && cleanSource.includes(cleanNodeId)) ||
                                    (cleanNodeId.includes('.') && !cleanNodeId.includes('/') && 
                                      cleanSource.endsWith(`/${cleanNodeId.split('.')[0]}.${cleanNodeId.split('.').pop()}`));
                                    
                                  const targetMatches = 
                                    cleanTarget === cleanNodeId || 
                                    cleanTarget.endsWith(`/${cleanNodeId}`) ||
                                    (cleanNodeId.includes('/') && cleanTarget.includes(cleanNodeId)) ||
                                    (cleanNodeId.includes('.') && !cleanNodeId.includes('/') && 
                                      cleanTarget.endsWith(`/${cleanNodeId.split('.')[0]}.${cleanNodeId.split('.').pop()}`));
                                  
                                  // If file paths match, add to dependencies/dependents
                                  if (sourceMatches) {
                                    console.log(`Found dependency: ${edge.source} -> ${edge.target}`);
                                    // Only add unique dependencies
                                    if (!deps.includes(edge.target)) {
                                      deps.push(edge.target);
                                    }
                                  } 
                                  
                                  if (targetMatches) {
                                    console.log(`Found dependent: ${edge.source} -> ${edge.target}`);
                                    // Only add unique dependents
                                    if (!dependents.includes(edge.source)) {
                                      dependents.push(edge.source);
                                    }
                                  }
                                });
                              }
                              
                              console.log(`Found ${deps.length} dependencies and ${dependents.length} dependents`);
                              setDirectDependencies(deps);
                              setDirectDependents(dependents);
                            }}
                          />
                        </div>
                        
                        {/* File Info panel - always visible as footer of the card */}
                        {selectedFile ? (
                          <div className="border-t pt-3">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="text-sm font-medium">
                                Selected File: <span className="font-mono text-xs">{selectedFile}</span>
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Dependencies */}
                              <div>
                                <h4 className="text-xs font-medium mb-1 flex items-center">
                                  <Package className="mr-1 h-3 w-3" />
                                  Dependencies ({directDependencies.length})
                                </h4>
                                <div className="max-h-28 overflow-y-auto rounded-md border p-1">
                                  {directDependencies.length > 0 ? (
                                    <div className="space-y-1">
                                      {directDependencies.map((dep) => {
                                        // Get the filename for display
                                        const displayName = dep.split('/').pop() || dep;
                                        return (
                                          <Button
                                            key={dep}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 justify-start px-2 py-0 text-xs w-full text-left"
                                            onClick={() => setSelectedFile(dep)}
                                            title={dep} // Show full path on hover
                                          >
                                            <ChevronRight className="mr-1 h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{displayName}</span>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground p-2">No dependencies</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Dependents */}
                              <div>
                                <h4 className="text-xs font-medium mb-1 flex items-center">
                                  <FileCode className="mr-1 h-3 w-3" />
                                  Used by ({directDependents.length})
                                </h4>
                                <div className="max-h-28 overflow-y-auto rounded-md border p-1">
                                  {directDependents.length > 0 ? (
                                    <div className="space-y-1">
                                      {directDependents.map((dep) => {
                                        // Get the filename for display
                                        const displayName = dep.split('/').pop() || dep;
                                        return (
                                          <Button
                                            key={dep}
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 justify-start px-2 py-0 text-xs w-full text-left"
                                            onClick={() => setSelectedFile(dep)}
                                            title={dep} // Show full path on hover
                                          >
                                            <ChevronRight className="mr-1 h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{displayName}</span>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground p-2">Not used by any files</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t pt-3 text-sm text-muted-foreground text-center">
                            Select a file from the file tree or click a node in the graph to see dependency information
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 