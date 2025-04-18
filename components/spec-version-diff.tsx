"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

interface DiffSegment {
  type: "added" | "removed" | "unchanged"
  content: string
}

interface Version {
  id: string
  name: string
  date: string
  author: string
  type: string
  content: string
  diff?: DiffSegment[]
}

interface SpecVersionDiffProps {
  baseVersion?: Version
  compareVersion?: Version
}

export function SpecVersionDiff({ baseVersion, compareVersion }: SpecVersionDiffProps) {
  if (!baseVersion || !compareVersion) {
    return <div className="text-center text-muted-foreground">Select versions to compare</div>
  }

  // If we have a pre-computed diff, use it
  if (compareVersion.diff) {
    return (
      <ScrollArea className="h-[500px]">
        <div className="rounded-md border">
          {compareVersion.diff.map((segment, index) => (
            <div
              key={index}
              className={`whitespace-pre-wrap p-2 ${
                segment.type === "added"
                  ? "bg-green-100 dark:bg-green-900/20"
                  : segment.type === "removed"
                    ? "bg-red-100 dark:bg-red-900/20"
                    : ""
              }`}
            >
              {segment.content}
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  // Otherwise, do a simple line-by-line comparison
  const baseLines = baseVersion.content.split("\n")
  const compareLines = compareVersion.content.split("\n")

  // Simple diff algorithm - not as sophisticated as real diff tools
  const diffLines: { type: "added" | "removed" | "unchanged"; content: string }[] = []

  // Find added and unchanged lines
  compareLines.forEach((line) => {
    if (baseLines.includes(line)) {
      diffLines.push({ type: "unchanged", content: line })
    } else {
      diffLines.push({ type: "added", content: line })
    }
  })

  // Find removed lines
  baseLines.forEach((line) => {
    if (!compareLines.includes(line)) {
      // Insert removed lines in appropriate position (simplified)
      diffLines.push({ type: "removed", content: line })
    }
  })

  // Sort by original order (simplified)
  diffLines.sort((a, b) => {
    if (a.type === "removed" && b.type !== "removed") return -1
    if (a.type !== "removed" && b.type === "removed") return 1
    return 0
  })

  return (
    <ScrollArea className="h-[500px]">
      <div className="rounded-md border">
        {diffLines.map((line, index) => (
          <div
            key={index}
            className={`whitespace-pre-wrap p-1 ${
              line.type === "added"
                ? "bg-green-100 dark:bg-green-900/20"
                : line.type === "removed"
                  ? "bg-red-100 dark:bg-red-900/20"
                  : ""
            }`}
          >
            <span className="mr-2">{line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}</span>
            {line.content}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
