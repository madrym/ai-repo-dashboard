"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  Plus,
  Search,
  Package,
  GitBranch,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRepository } from "@/lib/github/context"

// Define types
interface FeatureSpec {
  id: string
  title: string
  status: "draft" | "in-progress" | "completed" | "archived"
  createdAt: string
  updatedAt: string
  description: string
  problem: string
  outOfScope: string
}

export default function FeatureSpecsPage() {
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
  
  const [features, setFeatures] = useState<FeatureSpec[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Check if params are valid
  useEffect(() => {
    if (!org || !repo || !branch) {
      router.push("/repo")
    }
  }, [org, repo, branch, router])

  // Load feature specs
  useEffect(() => {
    if (org && repo && branch) {
      const fetchFeatures = async () => {
        setIsLoading(true)
        setError(null)
        
        try {
          const response = await fetch(`/api/feature-specs?org=${org}&repo=${repo}&branch=${branch}`)
          
          if (!response.ok) {
            throw new Error("Failed to fetch feature specs")
          }
          
          const data = await response.json()
          setFeatures(data.features || [])
        } catch (err: any) {
          console.error("Error loading features:", err)
          setError(err.message || "Failed to load feature specifications")
          toast({
            title: "Error",
            description: err.message || "Failed to load feature specifications",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchFeatures()
    }
  }, [org, repo, branch])

  // Handle navigation
  const handleNavigation = (path: string) => {
    router.push(`/repo/${org}/${repo}/${branch}/${path}`)
  }

  // Filter features by search query and status
  const filteredFeatures = features.filter((feature) => {
    const matchesSearch = !searchQuery || 
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !statusFilter || feature.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

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
            <Button variant="outline" size="sm" onClick={() => handleNavigation('dependencies')}>
              <Package className="mr-2 h-4 w-4" />
              Dependencies
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-6">
          {/* Repository info */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <Badge variant="outline" className="text-sm font-medium">
                {org}/{repo}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                <GitBranch className="mr-1 h-3.5 w-3.5" />
                {branch}
              </Badge>
              <Badge variant="outline" className="text-sm font-medium">
                <FileText className="mr-1 h-3.5 w-3.5" />
                Feature Specs
              </Badge>
            </div>
          </div>

          {/* Features header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Feature Specifications</h1>
            <Button onClick={() => handleNavigation('feature-specs/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Feature Spec
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search features..."
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
            <div className="flex gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              {statusFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(null)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Status filters */}
          {showFilters && (
            <div className="mb-6">
              <Tabs
                value={statusFilter || "all"}
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
              >
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Features list */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-muted/20" />
                  <CardContent className="h-32 bg-muted/10" />
                  <CardFooter className="h-12 bg-muted/5" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-500 mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => handleNavigation('dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">No feature specifications found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters"
                  : "Create your first feature specification to get started"}
              </p>
              <Button onClick={() => handleNavigation('feature-specs/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Feature Spec
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFeatures.map((feature) => (
                <Link
                  key={feature.id}
                  href={`/repo/${org}/${repo}/${branch}/feature-specs/${feature.id}`}
                  className="block"
                >
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <CardTitle className="line-clamp-2">{feature.title}</CardTitle>
                        <Badge
                          variant={
                            feature.status === "completed"
                              ? "default"
                              : feature.status === "in-progress"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {feature.status === "in-progress"
                            ? "In Progress"
                            : feature.status.charAt(0).toUpperCase() + feature.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{feature.id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {feature.description || "No description provided"}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>
                          {new Date(feature.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(feature.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 