"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Loader2, Copy, Check, ChevronDown, Search, X, ChevronUp, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CodeViewerProps {
  filePath: string | null
  searchTerm?: string
  onSearchChange?: (term: string) => void
}

interface CodeLine {
  number: number
  content: string
  isFoldable?: boolean
  isFolded?: boolean
  indentation: number
  highlighted?: boolean
  hidden?: boolean
}

export function CodeViewer({ filePath, searchTerm = "", onSearchChange }: CodeViewerProps) {
  const [code, setCode] = useState<string | null>(null)
  const [codeLines, setCodeLines] = useState<CodeLine[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState("typescript")
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const codeRef = useRef<HTMLDivElement>(null)

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // Determine language based on file extension
  useEffect(() => {
    if (!filePath) return

    const extension = filePath.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "js":
        setLanguage("javascript")
        break
      case "jsx":
        setLanguage("jsx")
        break
      case "ts":
        setLanguage("typescript")
        break
      case "tsx":
        setLanguage("tsx")
        break
      case "css":
        setLanguage("css")
        break
      case "html":
        setLanguage("html")
        break
      case "json":
        setLanguage("json")
        break
      case "md":
        setLanguage("markdown")
        break
      default:
        setLanguage("text")
    }
  }, [filePath])

  useEffect(() => {
    if (!filePath) {
      setCode(null)
      setCodeLines([])
      return
    }

    setLoading(true)

    // Simulate fetching code content
    setTimeout(() => {
      // Mock code content based on file path
      let mockCode = ""

      if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
        mockCode = `// ${filePath}
import React from 'react';
import { Button } from '@/components/ui/button';

interface ExampleProps {
  title: string;
  description?: string;
}

export function ExampleComponent({ title, description }: ExampleProps) {
  const [count, setCount] = React.useState(0);
  
  const handleIncrement = () => {
    setCount((prevCount) => prevCount + 1);
  };
  
  const handleReset = () => {
    setCount(0);
  };

  return (
    <div className="p-4 border rounded-md">
      <h1 className="text-xl font-bold">{title}</h1>
      {description && (
        <p className="mt-2 text-gray-500">{description}</p>
      )}
      
      <div className="mt-4">
        <p>Count: {count}</p>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleIncrement}>Increment</Button>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>
      </div>
    </div>
  );
}`
      } else if (filePath.endsWith(".json")) {
        mockCode = `{
  "name": "example-repo",
  "version": "1.0.0",
  "description": "A sample repository for demonstration",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "lucide-react": "^0.294.0",
    "tailwindcss": "^3.3.0",
    "class-variance-authority": "^0.7.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}`
      } else if (filePath.endsWith(".md")) {
        mockCode = `# Example Repository

This is a sample repository for demonstration purposes.

## Features

- Repository dashboard
- Feature planner
- GitHub integration

## Getting Started

1. Clone the repository
2. Install dependencies with \`npm install\`
3. Run the development server with \`npm run dev\`

## Documentation

For more information, please refer to the [documentation](https://example.com/docs).`
      } else {
        mockCode = `// No preview available for ${filePath}`
      }

      setCode(mockCode)

      // Process code into lines with folding information
      const lines = mockCode.split("\n").map((line, index) => {
        const indentation = line.search(/\S|$/)
        const isFoldable = line.includes("{") && !line.includes("}")

        return {
          number: index + 1,
          content: line,
          isFoldable,
          isFolded: false,
          indentation,
        }
      })

      setCodeLines(lines)
      setLoading(false)
    }, 500)
  }, [filePath])

  // Handle search within file
  useEffect(() => {
    if (!code || !localSearchTerm) {
      setSearchResults([])
      return
    }

    const results: number[] = []
    codeLines.forEach((line, index) => {
      if (line.content.toLowerCase().includes(localSearchTerm.toLowerCase())) {
        results.push(index)
      }
    })

    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)

    // We need to avoid updating codeLines if the highlighted state hasn't actually changed
    // This is likely causing the infinite loop
    const needsUpdate = codeLines.some((line, index) => {
      const shouldBeHighlighted = results.includes(index)
      return line.highlighted !== shouldBeHighlighted
    })

    if (needsUpdate) {
      const updatedLines = codeLines.map((line, index) => {
        return {
          ...line,
          highlighted: results.includes(index),
        }
      })
      setCodeLines(updatedLines)
    }

    // Scroll to first result if any
    if (results.length > 0 && codeRef.current) {
      const lineElement = codeRef.current.querySelector(`[data-line="${results[0] + 1}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [code, localSearchTerm, codeLines])

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleFold = (lineIndex: number) => {
    const newCodeLines = [...codeLines]
    const targetLine = newCodeLines[lineIndex]

    if (!targetLine.isFoldable) return

    targetLine.isFolded = !targetLine.isFolded

    // If folding, hide all lines with greater indentation until we reach a line with equal or less indentation
    if (targetLine.isFolded) {
      let i = lineIndex + 1
      while (i < newCodeLines.length && newCodeLines[i].indentation > targetLine.indentation) {
        newCodeLines[i].hidden = true
        i++
      }
    } else {
      // If unfolding, show all lines until we reach a line with equal or less indentation
      let i = lineIndex + 1
      while (i < newCodeLines.length && newCodeLines[i].indentation > targetLine.indentation) {
        newCodeLines[i].hidden = false
        i++
      }
    }

    setCodeLines(newCodeLines)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value)
    if (onSearchChange) {
      onSearchChange(e.target.value)
    }
  }

  const clearSearch = () => {
    setLocalSearchTerm("")
    if (onSearchChange) {
      onSearchChange("")
    }
  }

  const navigateSearch = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return

    let newIndex = currentSearchIndex
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    }

    setCurrentSearchIndex(newIndex)

    // Scroll to the selected search result
    if (codeRef.current) {
      const lineElement = codeRef.current.querySelector(`[data-line="${searchResults[newIndex] + 1}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }

  if (!filePath) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="text-muted-foreground">Select a file from the explorer to view its content</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Add this function to apply basic syntax highlighting
  const applyBasicSyntaxHighlighting = (content: string, language: string) => {
    // This is a very simplified version of syntax highlighting
    // In a real app, you'd want to use a proper tokenizer

    if (language === "typescript" || language === "javascript") {
      // Highlight keywords
      content = content.replace(
        /(const|let|var|function|return|import|export|from|interface|type|extends|implements|class|new|this|if|else|for|while|switch|case|break|continue|try|catch|throw|async|await)\b/g,
        '<span class="text-purple-600 dark:text-purple-400">$1</span>',
      )

      // Highlight strings
      content = content.replace(/(['"`])(.*?)\1/g, '<span class="text-green-600 dark:text-green-400">$1$2$1</span>')

      // Highlight comments
      content = content.replace(
        /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
        '<span class="text-gray-500 dark:text-gray-400">$1</span>',
      )

      // Highlight numbers
      content = content.replace(/\b(\d+)\b/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
    }

    return content
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <div className="font-mono text-sm text-muted-foreground">{filePath}</div>
        <div className="flex items-center gap-2">
          {/* In-file search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search in file..."
              className="h-9 w-[200px] pl-8 pr-16"
              value={localSearchTerm}
              onChange={handleSearchChange}
            />
            {localSearchTerm && (
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {searchResults.length > 0 ? `${currentSearchIndex + 1}/${searchResults.length}` : "0/0"}
                </span>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigateSearch("prev")}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigateSearch("next")}
                    disabled={searchResults.length === 0}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyCode}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="relative" ref={codeRef}>
          <div className="flex">
            {/* Line numbers */}
            <div className="select-none border-r bg-muted/30 px-3 py-4 font-mono text-xs text-muted-foreground">
              {codeLines
                .filter((line) => !line.hidden)
                .map((line) => (
                  <div key={line.number} className="leading-6">
                    {line.number}
                  </div>
                ))}
            </div>

            {/* Code content */}
            <pre className="relative flex-1 overflow-auto p-4 font-mono text-xs">
              <code>
                {codeLines
                  .filter((line) => !line.hidden)
                  .map((line, index) => {
                    // Apply basic syntax highlighting
                    let content = line.content
                    content = applyBasicSyntaxHighlighting(content, language)

                    // Highlight search matches if any
                    if (localSearchTerm && line.content.toLowerCase().includes(localSearchTerm.toLowerCase())) {
                      const regex = new RegExp(`(${localSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
                      const parts = line.content.split(regex)

                      content = parts
                        .map((part, i) => {
                          if (regex.test(part)) {
                            return `<span class="bg-yellow-200 dark:bg-yellow-800/50">${part}</span>`
                          }
                          return part
                        })
                        .join("")
                    }

                    return (
                      <div
                        key={line.number}
                        className={cn(
                          "flex leading-6",
                          line.highlighted && "bg-yellow-100 dark:bg-yellow-900/30",
                          searchResults[currentSearchIndex] === index && "bg-yellow-200 dark:bg-yellow-800/50",
                        )}
                        data-line={line.number}
                      >
                        {line.isFoldable ? (
                          <button
                            onClick={() => toggleFold(codeLines.indexOf(line))}
                            className="mr-2 inline-flex items-center text-muted-foreground hover:text-foreground"
                          >
                            {line.isFolded ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        ) : (
                          <span className="mr-2 w-3"></span>
                        )}
                        <span dangerouslySetInnerHTML={{ __html: content }}></span>
                      </div>
                    )
                  })}
              </code>
            </pre>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
