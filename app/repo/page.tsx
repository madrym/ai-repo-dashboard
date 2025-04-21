"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Github, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { useRepository } from "@/lib/github/context"

const MAX_HISTORY_LENGTH = 10;
const HISTORY_KEY = "repoUrlHistory";

export default function RepoPage() {
  const router = useRouter()
  const { connectRepository, isLoading, error: contextError } = useRepository()
  const [repoUrl, setRepoUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [urlHistory, setUrlHistory] = useState<string[]>([])

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
           setUrlHistory(parsedHistory);
        }
      }
    } catch (e) {
       console.error("Failed to load URL history from localStorage:", e);
    }
  }, []);

  const saveUrlToHistory = (url: string) => {
    setUrlHistory(prevHistory => {
      const filteredHistory = prevHistory.filter(item => item !== url);
      const newHistory = [url, ...filteredHistory];
      const limitedHistory = newHistory.slice(0, MAX_HISTORY_LENGTH);
      try {
         localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
      } catch (e) {
         console.error("Failed to save URL history to localStorage:", e);
      }
      return limitedHistory;
    });
  };

  const handleConnect = async () => {
    if (!repoUrl) {
      toast({
        title: "Error",
        description: "Please enter a repository URL",
        variant: "destructive",
      })
      return
    }

    setError(null)

    try {
      await connectRepository(repoUrl)
      
      toast({
        title: "Repository connected",
        description: "Successfully connected to GitHub repository",
      })

      const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/
      const match = repoUrl.match(githubRegex)

      if (!match) {
        throw new Error("Invalid GitHub URL. Please enter a valid GitHub repository URL.")
      }

      const org = match[1]
      const repo = match[2]
      const branch = match[3] || "main"

      saveUrlToHistory(repoUrl);

      router.push(`/repo/${org}/${repo}/${branch}/dashboard`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Connect Repository</CardTitle>
          <CardDescription>Connect your GitHub repository to analyze and plan features</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="repo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="repo">Repository URL</TabsTrigger>
              <TabsTrigger value="app">GitHub App</TabsTrigger>
            </TabsList>
            <TabsContent value="repo">
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Input
                    id="repo-url-input"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    list="repo-url-history"
                  />
                  <datalist id="repo-url-history">
                    {urlHistory.map((url, index) => (
                      <option key={index} value={url} />
                    ))}
                  </datalist>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {contextError && !error && <p className="text-sm text-red-500">{contextError}</p>}
                  <p className="text-xs text-muted-foreground">
                    Example: https://github.com/facebook/react or https://github.com/facebook/react/tree/main
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    We temporarily clone your repository and never store your code permanently
                  </span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="app">
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Install our GitHub App to securely access your repositories without sharing credentials.
                </p>
                <Button className="w-full" variant="outline">
                  <Github className="mr-2 h-4 w-4" />
                  Install GitHub App
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardContent className="flex items-center justify-between pt-0">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <Link href="/">
              Back to Home
            </Link>
          </Button>
          <Button onClick={handleConnect} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect Repository"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 