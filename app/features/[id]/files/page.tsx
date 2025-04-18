"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/theme-toggle"

// Mock feature specification data - simplified for this view
const featureSpec = {
  id: "feature-auth",
  title: "GitHub OAuth Integration",
  files: [
    {
      path: ".ai/specs/feature-auth/final_output.md",
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
- Documentation: 1 day`,
    },
    {
      path: ".ai/specs/feature-auth/history/1_draft.md",
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
- Store user information securely`,
    },
    {
      path: ".ai/specs/feature-auth/history/1_edit.diff",
      content: `--- a/.ai/specs/feature-auth/history/1_draft.md
+++ b/.ai/specs/feature-auth/history/2_draft.md
@@ -6,6 +6,8 @@
 - Simplify the authentication process for users
 - Retrieve basic GitHub profile information
 - Support both web and mobile authentication flows
+- Ensure secure token storage and handling
+- Add ability to request repository access permissions
 
 ## Implementation Details
 - Register a new OAuth application in GitHub
@@ -13,3 +15,5 @@
 - Handle callback and token exchange
 - Store user information securely
+- Implement token refresh mechanism
+- Add scope selection for different permission levels`,
    },
    {
      path: ".ai/specs/feature-auth/history/2_draft.md",
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
- Allow users to disconnect their GitHub account`,
    },
    {
      path: ".ai/specs/feature-auth/history/2_edit.diff",
      content: `--- a/.ai/specs/feature-auth/history/2_draft.md
+++ b/.ai/specs/feature-auth/history/final_output.md
@@ -24,9 +24,15 @@
 - Implement state parameter to prevent CSRF attacks
 - Store tokens in HttpOnly cookies or secure storage
 - Never expose tokens in client-side code
+- Implement rate limiting for authentication attempts
 
 ## User Experience
 - Provide clear permission explanations
 - Show loading states during authentication
 - Handle error cases gracefully
 - Allow users to disconnect their GitHub account
+- Add "Remember Me" functionality
+
+## Testing
+- Unit tests for authentication logic
+- Integration tests for OAuth flow
+- Security testing for token handling
+- UI tests for authentication screens`,
    },
    {
      path: ".ai/specs/feature-auth/conversation.json",
      content: `{
  "conversation": [
    {
      "id": "q1",
      "type": "question",
      "author": "Jane Smith",
      "content": "What security considerations should we keep in mind for OAuth implementation?",
      "timestamp": "2023-11-16T15:30:00Z"
    },
    {
      "id": "a1",
      "type": "answer",
      "author": "AI Assistant",
      "content": "For OAuth security, you should implement PKCE for public clients, use the state parameter to prevent CSRF attacks, store tokens securely (HttpOnly cookies or secure storage), and never expose tokens in client-side code. Also consider implementing token refresh mechanisms and proper scope handling.",
      "timestamp": "2023-11-16T15:31:00Z"
    },
    {
      "id": "q2",
      "type": "question",
      "author": "John Doe",
      "content": "Should we add any specific testing requirements for the authentication flow?",
      "timestamp": "2023-11-18T10:15:00Z"
    },
    {
      "id": "a2",
      "type": "answer",
      "author": "AI Assistant",
      "content": "Yes, I recommend adding a dedicated testing section that includes unit tests for authentication logic, integration tests for the complete OAuth flow, security testing specifically for token handling and storage, and UI tests for the authentication screens and error states.",
      "timestamp": "2023-11-18T10:16:00Z"
    }
  ]
}`,
    },
    {
      path: ".ai/specs/feature-auth/metadata.json",
      content: `{
  "id": "feature-auth",
  "title": "GitHub OAuth Integration",
  "description": "Implement GitHub OAuth for user authentication",
  "status": "completed",
  "type": "authentication",
  "createdAt": "2023-11-15",
  "completedAt": "2023-11-28",
  "author": "Jane Smith",
  "contributors": ["John Doe", "Alex Johnson"],
  "tags": ["authentication", "security", "github"],
  "prLink": "https://github.com/org/repo/pull/123",
  "originalPrompt": "We need to add GitHub OAuth to our application for user authentication"
}`,
    },
  ],
}

export default function FeatureFilesPage({ params }: { params: { id: string } }) {
  const [selectedFile, setSelectedFile] = useState(featureSpec.files[0].path)

  const currentFile = featureSpec.files.find((file) => file.path === selectedFile)

  const handleDownloadFile = () => {
    if (!currentFile) return

    // Create a blob with the content
    const blob = new Blob([currentFile.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)

    // Create a temporary link and trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = currentFile.path.split("/").pop() || "file"
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Get file extension
  const getFileExtension = (path: string) => {
    return path.split(".").pop() || ""
  }

  // Get file icon based on extension
  const getFileIcon = (path: string) => {
    const extension = getFileExtension(path)

    switch (extension) {
      case "md":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "diff":
        return <FileText className="h-4 w-4 text-amber-500" />
      case "json":
        return <FileText className="h-4 w-4 text-purple-500" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/features/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{featureSpec.title} - Raw Files</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={handleDownloadFile}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>Repository file structure</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4">
                {featureSpec.files.map((file) => (
                  <div
                    key={file.path}
                    className={`mb-2 flex cursor-pointer items-center rounded-md p-2 hover:bg-muted ${
                      selectedFile === file.path ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedFile(file.path)}
                  >
                    {getFileIcon(file.path)}
                    <span className="ml-2 text-sm">{file.path.split("/").pop()}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{currentFile?.path.split("/").pop()}</CardTitle>
            <CardDescription>{currentFile?.path}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="preview" className="flex-1">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="raw" className="flex-1">
                  Raw
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <ScrollArea className="h-[500px]">
                  <div className="rounded-md border p-4">
                    {getFileExtension(selectedFile) === "md" ? (
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            currentFile?.content
                              .replace(/^# (.*$)/gm, "<h1>$1</h1>")
                              .replace(/^## (.*$)/gm, "<h2>$1</h2>")
                              .replace(/^### (.*$)/gm, "<h3>$1</h3>")
                              .replace(/^- (.*$)/gm, "<li>$1</li>")
                              .replace(/\n\n/g, "<br/><br/>") || "",
                        }}
                      />
                    ) : getFileExtension(selectedFile) === "json" ? (
                      <pre className="text-sm">
                        {currentFile ? JSON.stringify(JSON.parse(currentFile.content), null, 2) : ""}
                      </pre>
                    ) : getFileExtension(selectedFile) === "diff" ? (
                      <pre className="text-sm whitespace-pre-wrap">
                        {currentFile?.content.split("\n").map((line, index) => (
                          <div
                            key={index}
                            className={
                              line.startsWith("+")
                                ? "bg-green-100 dark:bg-green-900/20"
                                : line.startsWith("-")
                                  ? "bg-red-100 dark:bg-red-900/20"
                                  : ""
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </pre>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap">{currentFile?.content}</pre>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <ScrollArea className="h-[500px]">
                  <pre className="rounded-md border p-4 text-sm font-mono whitespace-pre-wrap">
                    {currentFile?.content}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
