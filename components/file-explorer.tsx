"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, File, FileCode, FileText, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import React from "react"

interface FileNode {
  name: string
  type: "file" | "directory"
  path?: string
  children?: FileNode[]
}

interface FileExplorerProps {
  files: FileNode[]
  onSelectFile: (path: string | null) => void
  selectedFile: string | null
}

export function FileExplorer({ files, onSelectFile, selectedFile }: FileExplorerProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Files</div>
        <div className="mt-1">
          {files.map((file) => (
            <FileTreeNode
              key={file.name}
              node={file}
              depth={0}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

interface FileTreeNodeProps {
  node: FileNode
  depth: number
  onSelectFile: (path: string | null) => void
  selectedFile: string | null
}

const FileTreeNode = React.memo(function FileTreeNode({ node, depth, onSelectFile, selectedFile }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true)

  const handleToggle = React.useCallback(() => {
    if (node.type === "directory") {
      setExpanded((prev) => !prev)
    } else if (node.path) {
      onSelectFile(node.path)
    }
  }, [node.type, node.path, onSelectFile])

  const isSelected = node.path === selectedFile

  // Memoize the file icon to prevent unnecessary re-renders
  const fileIcon = React.useMemo(() => {
    if (node.type === "file") {
      const extension = node.name.split(".").pop()?.toLowerCase()

      if (["js", "jsx", "ts", "tsx"].includes(extension || "")) {
        return <FileCode className="h-4 w-4 text-blue-500" />
      } else if (["md", "txt"].includes(extension || "")) {
        return <FileText className="h-4 w-4 text-green-500" />
      } else {
        return <File className="h-4 w-4 text-muted-foreground" />
      }
    }
    return null
  }, [node.type, node.name])

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted",
          isSelected && "bg-muted font-medium text-primary",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {node.type === "directory" ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {fileIcon}
          </>
        )}
        <span className="truncate">{node.name}</span>
      </div>

      {node.type === "directory" && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.name}
              node={child}
              depth={depth + 1}
              onSelectFile={onSelectFile}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  )
})
