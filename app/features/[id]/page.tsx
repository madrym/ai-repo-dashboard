"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronRight, Download, Edit, FileText, GitCommit, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SpecVersionDiff } from "@/components/spec-version-diff"
import { SpecEditor } from "@/components/spec-editor"
import { SpecConversation } from "@/components/spec-conversation"
import { SpecVersionSelector } from "@/components/spec-version-selector"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ThemeToggle } from "@/components/theme-toggle"

// Mock feature specification data
const featureSpec = {
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
  originalPrompt: "We need to add GitHub OAuth to our application for user authentication",
  versions: [
    {
      id: "v1",
      name: "Initial Draft",
      date: "2023-11-15T10:30:00Z",
      author: "AI Assistant",
      type: "draft",
      content: `# GitHub OAuth Integration

## Overview
Implement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.

## Goals
- Simplify the authentication process for users
- Retrieve basic GitHub profile information
- Support both web and mobile authentication flows

## Implementation Details
- Register a new OAuth application in GitHub
- Implement the OAuth authorization flow
- Handle callback and token exchange
- Store user information securely
`,
    },
    {
      id: "v1-edit",
      name: "Human Edits to Initial Draft",
      date: "2023-11-16T14:20:00Z",
      author: "Jane Smith",
      type: "edit",
      content: `# GitHub OAuth Integration

## Overview
Implement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.

## Goals
- Simplify the authentication process for users
- Retrieve basic GitHub profile information
- Support both web and mobile authentication flows
- Ensure secure token storage and handling
- Add ability to request repository access permissions

## Implementation Details
- Register a new OAuth application in GitHub
- Implement the OAuth authorization flow
- Handle callback and token exchange
- Store user information securely
- Implement token refresh mechanism
- Add scope selection for different permission levels
`,
      diff: [
        {
          type: "unchanged",
          content:
            "# GitHub OAuth Integration\n\n## Overview\nImplement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.\n\n## Goals\n- Simplify the authentication process for users\n- Retrieve basic GitHub profile information\n- Support both web and mobile authentication flows",
        },
        {
          type: "added",
          content: "- Ensure secure token storage and handling\n- Add ability to request repository access permissions",
        },
        {
          type: "unchanged",
          content:
            "\n\n## Implementation Details\n- Register a new OAuth application in GitHub\n- Implement the OAuth authorization flow\n- Handle callback and token exchange\n- Store user information securely",
        },
        {
          type: "added",
          content: "- Implement token refresh mechanism\n- Add scope selection for different permission levels",
        },
      ],
    },
    {
      id: "v2",
      name: "Refined Draft",
      date: "2023-11-17T09:45:00Z",
      author: "AI Assistant",
      type: "draft",
      content: `# GitHub OAuth Integration

## Overview
Implement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.

## Goals
- Simplify the authentication process for users
- Retrieve basic GitHub profile information
- Support both web and mobile authentication flows
- Ensure secure token storage and handling
- Add ability to request repository access permissions

## Implementation Details
- Register a new OAuth application in GitHub
- Implement the OAuth authorization flow
- Handle callback and token exchange
- Store user information securely
- Implement token refresh mechanism
- Add scope selection for different permission levels

## Security Considerations
- Use PKCE (Proof Key for Code Exchange) for added security
- Implement state parameter to prevent CSRF attacks
- Store tokens in HttpOnly cookies or secure storage
- Never expose tokens in client-side code

## User Experience
- Provide clear permission explanations
- Show loading states during authentication
- Handle error cases gracefully
- Allow users to disconnect their GitHub account
`,
    },
    {
      id: "v2-edit",
      name: "Final Revisions",
      date: "2023-11-18T16:10:00Z",
      author: "John Doe",
      type: "edit",
      content: `# GitHub OAuth Integration

## Overview
Implement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.

## Goals
- Simplify the authentication process for users
- Retrieve basic GitHub profile information
- Support both web and mobile authentication flows
- Ensure secure token storage and handling
- Add ability to request repository access permissions

## Implementation Details
- Register a new OAuth application in GitHub
- Implement the OAuth authorization flow
- Handle callback and token exchange
- Store user information securely
- Implement token refresh mechanism
- Add scope selection for different permission levels

## Security Considerations
- Use PKCE (Proof Key for Code Exchange) for added security
- Implement state parameter to prevent CSRF attacks
- Store tokens in HttpOnly cookies or secure storage
- Never expose tokens in client-side code
- Implement rate limiting for authentication attempts

## User Experience
- Provide clear permission explanations
- Show loading states during authentication
- Handle error cases gracefully
- Allow users to disconnect their GitHub account
- Add "Remember Me" functionality

## Testing
- Unit tests for authentication logic
- Integration tests for OAuth flow
- Security testing for token handling
- UI tests for authentication screens
`,
      diff: [
        {
          type: "unchanged",
          content:
            "# GitHub OAuth Integration\n\n## Overview\nImplement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.\n\n## Goals\n- Simplify the authentication process for users\n- Retrieve basic GitHub profile information\n- Support both web and mobile authentication flows\n- Ensure secure token storage and handling\n- Add ability to request repository access permissions\n\n## Implementation Details\n- Register a new OAuth application in GitHub\n- Implement the OAuth authorization flow\n- Handle callback and token exchange\n- Store user information securely\n- Implement token refresh mechanism\n- Add scope selection for different permission levels\n\n## Security Considerations\n- Use PKCE (Proof Key for Code Exchange) for added security\n- Implement state parameter to prevent CSRF attacks\n- Store tokens in HttpOnly cookies or secure storage\n- Never expose tokens in client-side code",
        },
        { type: "added", content: "- Implement rate limiting for authentication attempts" },
        {
          type: "unchanged",
          content:
            "\n\n## User Experience\n- Provide clear permission explanations\n- Show loading states during authentication\n- Handle error cases gracefully\n- Allow users to disconnect their GitHub account",
        },
        {
          type: "added",
          content:
            '- Add "Remember Me" functionality\n\n## Testing\n- Unit tests for authentication logic\n- Integration tests for OAuth flow\n- Security testing for token handling\n- UI tests for authentication screens',
        },
      ],
    },
    {
      id: "final",
      name: "Final Specification",
      date: "2023-11-20T11:00:00Z",
      author: "Jane Smith",
      type: "final",
      content: `# GitHub OAuth Integration

## Overview
Implement GitHub OAuth authentication to allow users to sign in with their GitHub accounts.

## Goals
- Simplify the authentication process for users
- Retrieve basic GitHub profile information
- Support both web and mobile authentication flows
- Ensure secure token storage and handling
- Add ability to request repository access permissions

## Implementation Details
- Register a new OAuth application in GitHub
- Implement the OAuth authorization flow
- Handle callback and token exchange
- Store user information securely
- Implement token refresh mechanism
- Add scope selection for different permission levels

## Security Considerations
- Use PKCE (Proof Key for Code Exchange) for added security
- Implement state parameter to prevent CSRF attacks
- Store tokens in HttpOnly cookies or secure storage
- Never expose tokens in client-side code
- Implement rate limiting for authentication attempts

## User Experience
- Provide clear permission explanations
- Show loading states during authentication
- Handle error cases gracefully
- Allow users to disconnect their GitHub account
- Add "Remember Me" functionality

## Testing
- Unit tests for authentication logic
- Integration tests for OAuth flow
- Security testing for token handling
- UI tests for authentication screens

## Timeline
- Research and setup: 2 days
- Implementation: 3 days
- Testing and refinement: 2 days
- Documentation: 1 day
`,
    },
  ],
  conversation: [
    {
      id: "q1",
      type: "question",
      author: "Jane Smith",
      content: "What security considerations should we keep in mind for OAuth implementation?",
      timestamp: "2023-11-16T15:30:00Z",
    },
    {
      id: "a1",
      type: "answer",
      author: "AI Assistant",
      content:
        "For OAuth security, you should implement PKCE for public clients, use the state parameter to prevent CSRF attacks, store tokens securely (HttpOnly cookies or secure storage), and never expose tokens in client-side code. Also consider implementing token refresh mechanisms and proper scope handling.",
      timestamp: "2023-11-16T15:31:00Z",
    },
    {
      id: "q2",
      type: "question",
      author: "John Doe",
      content: "Should we add any specific testing requirements for the authentication flow?",
      timestamp: "2023-11-18T10:15:00Z",
    },
    {
      id: "a2",
      type: "answer",
      author: "AI Assistant",
      content:
        "Yes, I recommend adding a dedicated testing section that includes unit tests for authentication logic, integration tests for the complete OAuth flow, security testing specifically for token handling and storage, and UI tests for the authentication screens and error states.",
      timestamp: "2023-11-18T10:16:00Z",
    },
  ],
}

export default function FeatureSpecPage({ params }: { params: { id: string } }) {
  const [selectedVersion, setSelectedVersion] = useState<string>("final")
  const [compareVersion, setCompareVersion] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")

  // Find the selected version
  const currentVersion = featureSpec.versions.find((v) => v.id === selectedVersion)

  // Initialize edit content when switching to edit mode
  useEffect(() => {
    if (isEditing && currentVersion) {
      setEditContent(currentVersion.content)
    }
  }, [isEditing, currentVersion])

  const handleSaveEdit = () => {
    // In a real app, this would save the edit to the backend
    console.log("Saving edit:", editContent)
    setIsEditing(false)
    // Would typically refresh data here
  }

  const handleExportSpec = () => {
    if (!currentVersion) return

    // Create a blob with the content
    const blob = new Blob([currentVersion.content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${featureSpec.title.toLowerCase().replace(/\s+/g, "-")}-${currentVersion.id}.md`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{featureSpec.title}</h1>
          <Badge className="ml-2 capitalize">{featureSpec.type}</Badge>
          <Badge
            className={
              featureSpec.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                : "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400"
            }
          >
            {featureSpec.status.replace("-", " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleExportSpec}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          {/* Feature Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1">{featureSpec.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <p className="mt-1 capitalize">{featureSpec.status.replace("-", " ")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="mt-1">{formatDate(featureSpec.createdAt)}</p>
              </div>
              {featureSpec.completedAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                  <p className="mt-1">{formatDate(featureSpec.completedAt)}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Author</h3>
                <p className="mt-1">{featureSpec.author}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contributors</h3>
                <div className="mt-1">
                  {featureSpec.contributors.map((contributor) => (
                    <div key={contributor}>{contributor}</div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {featureSpec.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              {featureSpec.prLink && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Pull Request</h3>
                  <a
                    href={featureSpec.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View PR
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Original Prompt Card */}
          <Card>
            <CardHeader>
              <CardTitle>Original Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm">{featureSpec.originalPrompt}</p>
              </div>
            </CardContent>
          </Card>

          {/* Version History Card */}
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4">
                  {featureSpec.versions.map((version, index) => (
                    <div key={version.id} className="mb-2 last:mb-0">
                      <div
                        className={`flex cursor-pointer items-center rounded-md p-2 hover:bg-muted ${
                          selectedVersion === version.id ? "bg-muted" : ""
                        }`}
                        onClick={() => setSelectedVersion(version.id)}
                      >
                        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border">
                          {version.type === "draft" ? (
                            <FileText className="h-4 w-4 text-blue-500" />
                          ) : version.type === "edit" ? (
                            <Edit className="h-4 w-4 text-amber-500" />
                          ) : (
                            <GitCommit className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{version.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(version.date)} by {version.author}
                          </div>
                        </div>
                      </div>
                      {index < featureSpec.versions.length - 1 && <div className="ml-4 h-4 w-px bg-border" />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="specification" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="specification" className="flex-1">
                Specification
              </TabsTrigger>
              <TabsTrigger value="conversation" className="flex-1">
                Conversation
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex-1">
                Compare Versions
              </TabsTrigger>
            </TabsList>

            {/* Specification Tab */}
            <TabsContent value="specification" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{currentVersion?.name || "Specification"}</CardTitle>
                    <CardDescription>
                      {currentVersion ? `${formatDate(currentVersion.date)} by ${currentVersion.author}` : ""}
                    </CardDescription>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <SpecEditor content={editContent} onChange={setEditContent} />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {currentVersion ? (
                        <div className="rounded-md border p-4">
                          <div
                            className="markdown-content"
                            dangerouslySetInnerHTML={{
                              __html: currentVersion.content
                                .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                                .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                                .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                                .replace(/^- (.*$)/gm, "<li>$1</li>")
                                .replace(/\n\n/g, "<br/><br/>"),
                            }}
                          />
                        </div>
                      ) : (
                        <p>No version selected</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversation Tab */}
            <TabsContent value="conversation" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Refinement Conversation</CardTitle>
                  <CardDescription>Questions and answers during the specification development</CardDescription>
                </CardHeader>
                <CardContent>
                  <SpecConversation conversation={featureSpec.conversation} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compare Versions Tab */}
            <TabsContent value="compare" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Compare Versions</CardTitle>
                  <CardDescription>Select two versions to compare changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Base Version</label>
                      <SpecVersionSelector
                        versions={featureSpec.versions}
                        selectedVersion={selectedVersion}
                        onChange={setSelectedVersion}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Compare With</label>
                      <SpecVersionSelector
                        versions={featureSpec.versions}
                        selectedVersion={compareVersion || ""}
                        onChange={setCompareVersion}
                        includeEmpty
                      />
                    </div>
                  </div>

                  {selectedVersion && compareVersion ? (
                    <SpecVersionDiff
                      baseVersion={featureSpec.versions.find((v) => v.id === selectedVersion)}
                      compareVersion={featureSpec.versions.find((v) => v.id === compareVersion)}
                    />
                  ) : (
                    <div className="rounded-md border p-4 text-center text-muted-foreground">
                      Select two versions to compare
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* File Structure */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Repository File Structure</CardTitle>
              <CardDescription>How this specification is stored in the repository</CardDescription>
            </CardHeader>
            <CardContent>
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border p-3 text-left font-medium hover:bg-muted">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>.ai/specs/{featureSpec.id}/</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 rounded-md border p-3">
                    <div className="flex items-center py-1 pl-6">
                      <FileText className="mr-2 h-4 w-4 text-green-500" />
                      <span>final_output.md</span>
                    </div>
                    <div className="flex items-center py-1 pl-6">
                      <ChevronRight className="mr-2 h-4 w-4" />
                      <span>history/</span>
                    </div>
                    <div className="flex items-center py-1 pl-12">
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      <span>1_draft.md</span>
                    </div>
                    <div className="flex items-center py-1 pl-12">
                      <FileText className="mr-2 h-4 w-4 text-amber-500" />
                      <span>1_edit.diff</span>
                    </div>
                    <div className="flex items-center py-1 pl-12">
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      <span>2_draft.md</span>
                    </div>
                    <div className="flex items-center py-1 pl-12">
                      <FileText className="mr-2 h-4 w-4 text-amber-500" />
                      <span>2_edit.diff</span>
                    </div>
                    <div className="flex items-center py-1 pl-6">
                      <FileText className="mr-2 h-4 w-4 text-purple-500" />
                      <span>conversation.json</span>
                    </div>
                    <div className="flex items-center py-1 pl-6">
                      <FileText className="mr-2 h-4 w-4 text-gray-500" />
                      <span>metadata.json</span>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/features/${featureSpec.id}/files`}>
                  <History className="mr-2 h-4 w-4" />
                  View Raw Files
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
