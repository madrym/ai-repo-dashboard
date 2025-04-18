"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthPage() {
  const router = useRouter()
  const [repoUrl, setRepoUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (!repoUrl) {
      toast({
        title: "Error",
        description: "Please enter a repository URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    // Simulate authentication and repository connection
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Repository connected",
        description: "Successfully connected to your GitHub repository",
      })
      router.push("/dashboard")
    }, 2000)
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
                  <Label htmlFor="repo-url">Repository URL</Label>
                  <Input
                    id="repo-url"
                    placeholder="https://github.com/username/repository"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                  />
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
        <CardFooter>
          <Button className="w-full" onClick={handleConnect} disabled={loading}>
            {loading ? "Connecting..." : "Connect Repository"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
