"use client"

import { useState, useEffect } from "react"
import { ChevronRight, FileCode, FolderOpen, AlertCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DependencyListProps {
  searchQuery: string
  dependencyType: string
  onNodeSelect: (nodeId: string | null) => void
  selectedNode: string | null
}

interface FileNode {
  id: string
  type: string
  dependencies: string[]
  dependents: string[]
  hasCircular: boolean
  isUnused: boolean
}

export function DependencyList({ searchQuery, dependencyType, onNodeSelect, selectedNode }: DependencyListProps) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [folderStructure, setFolderStructure] = useState<any>({})

  // Generate mock data
  useEffect(() => {
    // Generate 100 mock files with dependencies
    const mockFiles: FileNode[] = []
    const fileTypes = ["component", "util", "page", "api", "model", "hook", "context", "test"]
    const fileGroups = ["ui", "feature", "core", "lib", "app", "test"]

    for (let i = 0; i < 100; i++) {
      const type = fileTypes[Math.floor(Math.random() * fileTypes.length)]
      const group = fileGroups[Math.floor(Math.random() * fileGroups.length)]

      let fileName
      if (type === "component") {
        fileName = `components/${group}/${getRandomName()}.tsx`
      } else if (type === "page") {
        fileName = `app/${getRandomName()}/page.tsx`
      } else if (type === "api") {
        fileName = `app/api/${getRandomName()}/route.ts`
      } else if (type === "hook") {
        fileName = `hooks/use-${getRandomName()}.ts`
      } else if (type === "context") {
        fileName = `contexts/${getRandomName()}-context.tsx`
      } else if (type === "test") {
        fileName = `__tests__/${getRandomName()}.test.tsx`
      } else {
        fileName = `lib/${type}/${getRandomName()}.ts`
      }

      mockFiles.push({
        id: fileName,
        type,
        dependencies: [],
        dependents: [],
        hasCircular: Math.random() > 0.9,
        isUnused: Math.random() > 0.9,
      })
    }

    // Add dependencies and dependents
    mockFiles.forEach((file) => {
      const numDeps = Math.floor(Math.random() * 5)

      for (let i = 0; i < numDeps; i++) {
        const targetIndex = Math.floor(Math.random() * mockFiles.length)

        if (mockFiles[targetIndex].id !== file.id && !file.dependencies.includes(mockFiles[targetIndex].id)) {
          file.dependencies.push(mockFiles[targetIndex].id)
          mockFiles[targetIndex].dependents.push(file.id)
        }
      }
    })

    setFiles(mockFiles)

    // Create folder structure
    const structure: any = {}

    mockFiles.forEach((file) => {
      const parts = file.id.split("/")
      let current = structure

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }

      if (!current[parts[parts.length - 1]]) {
        current[parts[parts.length - 1]] = file.id
      }
    })

    setFolderStructure(structure)

    // Expand the first level folders by default
    const firstLevelFolders = new Set(Object.keys(structure))
    setExpandedFolders(firstLevelFolders)
  }, [])

  // Filter files based on search query and dependency type
  const filteredFiles = files.filter((file) => {
    // Apply search filter
    const matchesSearch = searchQuery ? file.id.toLowerCase().includes(searchQuery.toLowerCase()) : true

    // Apply dependency type filter
    let matchesType = true
    if (dependencyType === "circular") {
      matchesType = file.hasCircular
    } else if (dependencyType === "unused") {
      matchesType = file.isUnused
    }

    return matchesSearch && matchesType
  })

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

  // Render folder structure recursively
  const renderFolderStructure = (structure: any, path = "", level = 0) => {
    return Object.entries(structure).map(([key, value]) => {
      const currentPath = path ? `${path}/${key}` : key

      // Check if it's a file or folder
      if (typeof value === "string") {
        // It's a file
        const file = files.find((f) => f.id === value)

        if (!file) return null

        // Check if file matches filters
        const matchesSearch = searchQuery ? file.id.toLowerCase().includes(searchQuery.toLowerCase()) : true

        let matchesType = true
        if (dependencyType === "circular") {
          matchesType = file.hasCircular
        } else if (dependencyType === "unused") {
          matchesType = file.isUnused
        }

        if (!matchesSearch || !matchesType) return null

        return (
          <div
            key={file.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
              selectedNode === file.id && "bg-muted font-medium",
            )}
            style={{ paddingLeft: `${(level + 1) * 16}px` }}
            onClick={() => onNodeSelect(file.id)}
          >
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{key}</span>
            {file.hasCircular && <AlertCircle className="h-4 w-4 text-red-500" />}
            {file.isUnused && <Info className="h-4 w-4 text-blue-500" />}
            <Badge variant="outline" className="ml-2 text-xs">
              {file.dependencies.length}/{file.dependents.length}
            </Badge>
          </div>
        )
      } else {
        // It's a folder
        // Check if any child matches the filters
        const hasMatchingChild = Object.entries(value as any).some(([childKey, childValue]) => {
          if (typeof childValue === "string") {
            const file = files.find((f) => f.id === childValue)
            if (!file) return false

            const matchesSearch = searchQuery ? file.id.toLowerCase().includes(searchQuery.toLowerCase()) : true

            let matchesType = true
            if (dependencyType === "circular") {
              matchesType = file.hasCircular
            } else if (dependencyType === "unused") {
              matchesType = file.isUnused
            }

            return matchesSearch && matchesType
          } else {
            // Recursively check subfolders
            return hasMatchingChildRecursive(childValue as any)
          }
        })

        if (!hasMatchingChild) return null

        return (
          <div key={currentPath}>
            <div
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              style={{ paddingLeft: `${level * 16}px` }}
              onClick={() => toggleFolder(currentPath)}
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expandedFolders.has(currentPath) && "rotate-90",
                )}
              />
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span>{key}</span>
            </div>

            {expandedFolders.has(currentPath) && <div>{renderFolderStructure(value, currentPath, level + 1)}</div>}
          </div>
        )
      }
    })
  }

  // Helper function to check if a folder has any matching children recursively
  const hasMatchingChildRecursive = (structure: any): boolean => {
    return Object.entries(structure).some(([key, value]) => {
      if (typeof value === "string") {
        const file = files.find((f) => f.id === value)
        if (!file) return false

        const matchesSearch = searchQuery ? file.id.toLowerCase().includes(searchQuery.toLowerCase()) : true

        let matchesType = true
        if (dependencyType === "circular") {
          matchesType = file.hasCircular
        } else if (dependencyType === "unused") {
          matchesType = file.isUnused
        }

        return matchesSearch && matchesType
      } else {
        return hasMatchingChildRecursive(value as any)
      }
    })
  }

  // Helper function to generate random names
  function getRandomName() {
    const prefixes = [
      "user",
      "auth",
      "dashboard",
      "profile",
      "settings",
      "home",
      "product",
      "cart",
      "checkout",
      "payment",
      "order",
      "admin",
      "button",
      "card",
      "modal",
      "form",
      "input",
      "dropdown",
      "table",
      "list",
      "grid",
      "layout",
      "header",
      "footer",
      "sidebar",
      "navigation",
      "menu",
      "icon",
      "image",
      "avatar",
      "badge",
      "toast",
      "alert",
      "notification",
      "spinner",
      "loader",
      "progress",
      "slider",
      "switch",
      "checkbox",
      "radio",
      "select",
      "textarea",
      "date",
      "time",
      "color",
      "file",
      "search",
      "pagination",
      "tabs",
      "accordion",
      "carousel",
      "tooltip",
      "popover",
      "dialog",
      "drawer",
      "stepper",
      "breadcrumb",
      "tag",
      "chip",
      "divider",
      "skeleton",
      "placeholder",
      "theme",
      "utils",
      "helpers",
      "constants",
      "types",
      "interfaces",
      "hooks",
      "context",
      "provider",
      "consumer",
      "store",
      "reducer",
      "action",
      "selector",
      "middleware",
      "service",
      "api",
      "client",
      "server",
      "database",
      "model",
      "schema",
      "migration",
      "seed",
      "query",
      "mutation",
      "subscription",
      "resolver",
      "controller",
      "route",
      "middleware",
      "guard",
      "interceptor",
      "pipe",
      "filter",
      "decorator",
      "validator",
      "formatter",
      "parser",
      "serializer",
      "deserializer",
      "encoder",
      "decoder",
      "crypto",
      "auth",
      "jwt",
      "oauth",
      "social",
      "email",
      "sms",
      "notification",
      "logger",
      "error",
      "exception",
      "handler",
      "monitor",
      "analytics",
      "tracking",
      "event",
      "listener",
      "emitter",
      "publisher",
      "subscriber",
      "queue",
      "worker",
      "job",
      "task",
      "scheduler",
      "cron",
      "cache",
      "storage",
      "upload",
      "download",
      "file",
      "image",
      "video",
      "audio",
      "media",
      "player",
      "recorder",
      "stream",
      "socket",
      "websocket",
      "sse",
      "http",
      "https",
      "rest",
      "graphql",
      "grpc",
      "soap",
      "xml",
      "json",
      "yaml",
      "csv",
      "excel",
      "pdf",
      "word",
      "powerpoint",
      "zip",
      "tar",
      "gzip",
      "bzip",
      "compress",
      "decompress",
      "encrypt",
      "decrypt",
      "hash",
      "sign",
      "verify",
      "certificate",
      "key",
      "token",
      "password",
      "credential",
      "permission",
      "role",
      "policy",
      "rule",
      "constraint",
      "validation",
      "sanitization",
      "escape",
      "unescape",
      "encode",
      "decode",
      "format",
      "parse",
      "stringify",
      "serialize",
      "deserialize",
      "clone",
      "copy",
      "merge",
      "diff",
      "patch",
      "compare",
      "sort",
      "filter",
      "map",
      "reduce",
      "find",
      "search",
      "match",
      "replace",
      "split",
      "join",
      "concat",
      "slice",
      "splice",
      "push",
      "pop",
      "shift",
      "unshift",
      "reverse",
      "shuffle",
      "random",
      "math",
      "number",
      "string",
      "array",
      "object",
      "set",
      "map",
      "weakset",
      "weakmap",
      "date",
      "time",
      "timer",
      "interval",
      "timeout",
      "debounce",
      "throttle",
      "memoize",
      "curry",
      "compose",
      "pipe",
      "partial",
      "bind",
      "call",
      "apply",
      "reflect",
      "proxy",
      "symbol",
      "iterator",
      "generator",
      "async",
      "await",
      "promise",
      "observable",
      "stream",
      "buffer",
      "blob",
      "file",
      "reader",
      "writer",
      "input",
      "output",
      "error",
      "exception",
      "try",
      "catch",
      "finally",
      "throw",
      "assert",
      "test",
      "spec",
      "unit",
      "integration",
      "e2e",
      "mock",
      "stub",
      "spy",
      "fake",
      "dummy",
      "fixture",
      "factory",
      "seed",
      "setup",
      "teardown",
      "before",
      "after",
      "beforeEach",
      "afterEach",
      "describe",
      "it",
      "expect",
      "assert",
      "should",
      "must",
      "may",
      "can",
      "will",
      "would",
      "could",
      "should",
      "must",
      "may",
      "can",
      "will",
      "would",
      "could",
      "should",
      "must",
      "may",
      "can",
      "will",
      "would",
      "could",
    ]

    return prefixes[Math.floor(Math.random() * prefixes.length)]
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">Files and Dependencies</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <AlertCircle className="h-3 w-3 text-red-500" />
            Circular
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            <Info className="h-3 w-3 text-blue-500" />
            Unused
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs">
            Deps/Used
          </Badge>
        </div>
      </div>

      <div className="space-y-1">{renderFolderStructure(folderStructure)}</div>

      {filteredFiles.length === 0 && (
        <div className="mt-4 flex h-40 items-center justify-center rounded-md border">
          <p className="text-sm text-muted-foreground">No files match your criteria</p>
        </div>
      )}
    </div>
  )
}
