import { Github } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Github className="h-5 w-5" />
            <span>RepoInsight</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/planner" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Feature Planner
            </Link>
            <ThemeToggle />
            <Button variant="default" size="sm">
              <Github className="mr-2 h-4 w-4" />
              Sign in with GitHub
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
              AI-Powered Repository Analysis & Feature Planning
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Understand any GitHub repository at a glance and plan new features with AI assistance. Seamlessly
              integrate with your GitHub workflow.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/auth">
                  <Github className="mr-2 h-5 w-5" />
                  Connect GitHub Repository
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/docs">Learn more</Link>
              </Button>
            </div>
          </div>
        </section>
        <section className="container py-12 md:py-24 lg:py-32">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Repository Dashboard</CardTitle>
                <CardDescription>AI-powered insights into your codebase</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Get a high-level overview of your repository's purpose, structure, languages, and testing frameworks.
                  Browse files with syntax highlighting.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/dashboard">View Dashboard</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Feature Planner</CardTitle>
                <CardDescription>Convert ideas into structured plans</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Enter a feature idea and let AI help you create detailed planning documents with goals, implementation
                  steps, and considerations.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/planner">Plan a Feature</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>GitHub Integration</CardTitle>
                <CardDescription>Seamless workflow integration</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Commit your feature plans directly to your repository with automatic branch creation and pull
                  requests.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link href="/docs/github-integration">Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} RepoInsight. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
