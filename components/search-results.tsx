"use client"

import { File, Folder, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SearchResultsProps {
  results: any[]
  isSearching: boolean
  query: string
  onSelectFile: (path: string | null) => void
  selectedFile: string | null
}

export function SearchResults({ results, isSearching, query, onSelectFile, selectedFile }: SearchResultsProps) {
  // Memoize the click handler to prevent unnecessary re-renders
  const handleFileClick = (path: string) => {
    if (path) {
      onSelectFile(path)
    }
  }

  if (isSearching) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
          {results.length} {results.length === 1 ? "result" : "results"} for "{query}"
        </div>
        <div className="mt-1">
          {results.map((result) => (
            <div
              key={result.path || result.name}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
                result.path === selectedFile && "bg-muted font-medium text-primary",
              )}
              onClick={() => result.path && handleFileClick(result.path)}
            >
              {result.type === "directory" ? (
                <Folder className="h-4 w-4 text-amber-500" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{result.path || result.name}</span>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}
