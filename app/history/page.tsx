"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, GitBranch, GitPullRequest, Search, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FeatureCard } from "@/components/feature-card"
import { RepositoryTimeline } from "@/components/repository-timeline"
import { RepositoryInsights } from "@/components/repository-insights"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

// Mock data for past features
const pastFeatures = [
  {
    id: "feature-auth",
    title: "GitHub OAuth Integration",
    description: "Implement GitHub OAuth for user authentication",
    status: "completed",
    type: "authentication",
    createdAt: "2023-11-15",
    completedAt: "2023-11-28",
    author: "Jane Smith",
    contributors: ["John Doe", "Alex Johnson"],
    tags: ["authentication", "security", "github"],
    prLink: "https://github.com/org/repo/pull/123",
  },
  {
    id: "feature-2",
    title: "Dashboard Analytics",
    description: "Add analytics dashboard with charts and metrics",
    status: "completed",
    type: "ui",
    createdAt: "2023-12-05",
    completedAt: "2023-12-20",
    author: "John Doe",
    contributors: ["Jane Smith", "Sam Wilson"],
    tags: ["analytics", "dashboard", "charts"],
    prLink: "https://github.com/org/repo/pull/145",
  },
  {
    id: "feature-3",
    title: "API Rate Limiting",
    description: "Implement rate limiting for all API endpoints",
    status: "completed",
    type: "api",
    createdAt: "2024-01-10",
    completedAt: "2024-01-18",
    author: "Alex Johnson",
    contributors: ["John Doe"],
    tags: ["api", "security", "performance"],
    prLink: "https://github.com/org/repo/pull/167",
  },
  {
    id: "feature-4",
    title: "Dark Mode Support",
    description: "Add dark mode theme support across the application",
    status: "in-progress",
    type: "ui",
    createdAt: "2024-02-01",
    completedAt: null,
    author: "Sam Wilson",
    contributors: ["Jane Smith"],
    tags: ["ui", "theme", "accessibility"],
    prLink: "https://github.com/org/repo/pull/189",
  },
  {
    id: "feature-5",
    title: "File Upload System",
    description: "Implement secure file uploads with progress tracking",
    status: "in-progress",
    type: "feature",
    createdAt: "2024-02-15",
    completedAt: null,
    author: "Jane Smith",
    contributors: ["Alex Johnson", "John Doe"],
    tags: ["file-upload", "storage", "security"],
    prLink: "https://github.com/org/repo/pull/201",
  },
  {
    id: "feature-6",
    title: "Search Functionality",
    description: "Add robust search capabilities across the application",
    status: "planned",
    type: "feature",
    createdAt: "2024-03-01",
    completedAt: null,
    author: "John Doe",
    contributors: [],
    tags: ["search", "indexing", "ui"],
    prLink: null,
  },
]

// Mock data for repository memory
const repositoryMemory = [
  {
    id: "commit-1",
    type: "commit",
    title: "Initial commit",
    description: "Project setup with Next.js and basic structure",
    author: "John Doe",
    date: "2023-10-01",
    hash: "a1b2c3d",
    branch: "main",
  },
  {
    id: "pr-1",
    type: "pull-request",
    title: "Add authentication system",
    description: "Implement user authentication with GitHub OAuth",
    author: "Jane Smith",
    date: "2023-11-15",
    status: "merged",
    number: 123,
    branch: "feature/github-auth",
  },
  {
    id: "release-1",
    type: "release",
    title: "v1.0.0",
    description: "First stable release with authentication and basic features",
    author: "John Doe",
    date: "2023-12-01",
    tag: "v1.0.0",
  },
  {
    id: "commit-2",
    type: "commit",
    title: "Fix security vulnerability in auth flow",
    description: "Address CSRF vulnerability in OAuth callback",
    author: "Alex Johnson",
    date: "2023-12-10",
    hash: "e4f5g6h",
    branch: "main",
  },
  {
    id: "pr-2",
    type: "pull-request",
    title: "Add analytics dashboard",
    description: "Implement dashboard with charts and metrics",
    author: "John Doe",
    date: "2023-12-20",
    status: "merged",
    number: 145,
    branch: "feature/analytics",
  },
  {
    id: "release-2",
    type: "release",
    title: "v1.1.0",
    description: "Analytics dashboard and performance improvements",
    author: "Jane Smith",
    date: "2024-01-05",
    tag: "v1.1.0",
  },
  {
    id: "pr-3",
    type: "pull-request",
    title: "Implement API rate limiting",
    description: "Add rate limiting to all API endpoints",
    author: "Alex Johnson",
    date: "2024-01-18",
    status: "merged",
    number: 167,
    branch: "feature/rate-limiting",
  },
  {
    id: "pr-4",
    type: "pull-request",
    title: "Add dark mode support",
    description: "Implement dark mode theme across the application",
    author: "Sam Wilson",
    date: "2024-02-01",
    status: "open",
    number: 189,
    branch: "feature/dark-mode",
  },
  {
    id: "pr-5",
    type: "pull-request",
    title: "File upload system",
    description: "Implement secure file uploads with progress tracking",
    author: "Jane Smith",
    date: "2024-02-15",
    status: "open",
    number: 201,
    branch: "feature/file-upload",
  },
]

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [timelineFilter, setTimelineFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("features")

  // Filter features based on search query and filters
  const filteredFeatures = pastFeatures.filter((feature) => {
    const matchesSearch =
      feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || feature.status === statusFilter
    const matchesType = typeFilter === "all" || feature.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Filter repository memory based on search query and timeline filter
  const filteredMemory = repositoryMemory.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    // Simple timeline filtering based on date
    const matchesTimeline =
      timelineFilter === "all" ||
      (() => {
        const date = new Date(item.date)
        const now = new Date()

        switch (timelineFilter) {
          case "month":
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(now.getMonth() - 1)
            return date >= oneMonthAgo
          case "quarter":
            const threeMonthsAgo = new Date()
            threeMonthsAgo.setMonth(now.getMonth() - 3)
            return date >= threeMonthsAgo
          case "year":
            const oneYearAgo = new Date()
            oneYearAgo.setFullYear(now.getFullYear() - 1)
            return date >= oneYearAgo
          default:
            return true
        }
      })()

    return matchesSearch && matchesTimeline
  })

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="container py-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Repository History</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link href="/planner">Plan New Feature</Link>
          </Button>
        </div>
      </header>

      {/* Search bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            className="pl-8 pr-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main tabs */}
      <div className="mb-4 flex border-b">
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
            activeTab === "features"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("features")}
        >
          <GitPullRequest className="h-3.5 w-3.5" />
          Features
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
            activeTab === "timeline"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("timeline")}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Timeline
        </button>
        <button
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium ${
            activeTab === "insights"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("insights")}
        >
          <svg
            className="h-3.5 w-3.5"
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
            <path d="M3 3v18h18" />
            <path d="M7 16l4-8 4 2 4-6" />
          </svg>
          Insights
        </button>
      </div>

      {/* Features Tab */}
      {activeTab === "features" && (
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground"></span>
                  <span>{statusFilter === "all" ? "All Statuses" : statusFilter.replace("-", " ")}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  <span>{typeFilter === "all" ? "All Types" : typeFilter}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredFeatures.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-md border">
              <p className="text-sm text-muted-foreground">No features found matching your criteria</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === "timeline" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Select value={timelineFilter} onValueChange={setTimelineFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {timelineFilter === "all"
                      ? "All Time"
                      : timelineFilter === "month"
                        ? "Past Month"
                        : timelineFilter === "quarter"
                          ? "Past Quarter"
                          : "Past Year"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="quarter">Past Quarter</SelectItem>
                <SelectItem value="year">Past Year</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Commit
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Pull Request
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                Release
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <ScrollArea className="h-[600px] pr-4">
                <RepositoryTimeline items={filteredMemory} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Feature Completion</CardTitle>
                <CardDescription className="text-xs">Feature completion rate over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <RepositoryInsights type="feature-completion" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contributor Activity</CardTitle>
                <CardDescription className="text-xs">Contribution frequency by team member</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <RepositoryInsights type="contributor-activity" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Code Changes Over Time</CardTitle>
              <CardDescription className="text-xs">Lines of code added and removed</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
              <RepositoryInsights type="code-changes" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
