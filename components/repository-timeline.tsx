import { GitCommit, GitPullRequest, Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  type: "commit" | "pull-request" | "release"
  title: string
  description: string
  author: string
  date: string
  hash?: string
  branch?: string
  status?: string
  number?: number
  tag?: string
}

interface RepositoryTimelineProps {
  items: TimelineItem[]
}

export function RepositoryTimeline({ items }: RepositoryTimelineProps) {
  // Sort items by date (newest first)
  const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Get icon for timeline item type
  const getItemIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4 text-blue-500" />
      case "pull-request":
        return <GitPullRequest className="h-4 w-4 text-purple-500" />
      case "release":
        return <Tag className="h-4 w-4 text-green-500" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  // Get badge color for PR status
  const getPrStatusColor = (status: string) => {
    switch (status) {
      case "merged":
        return "bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-400"
      case "open":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
      case "closed":
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400"
    }
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 h-full w-px bg-border" />

      {/* Timeline items */}
      <div className="space-y-4">
        {sortedItems.map((item) => (
          <div key={item.id} className="relative pl-10">
            {/* Timeline icon */}
            <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border bg-background">
              {getItemIcon(item.type)}
            </div>

            {/* Timeline content */}
            <div className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-medium">{item.title}</h3>
                <div className="flex items-center gap-2">
                  {item.type === "pull-request" && item.status && (
                    <span
                      className={cn("rounded-full px-1.5 py-0.5 text-xs font-medium", getPrStatusColor(item.status))}
                    >
                      {item.status}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>By: {item.author}</span>
                {item.hash && <span className="font-mono">{item.hash.substring(0, 7)}</span>}
                {item.branch && <span>{item.branch}</span>}
                {item.number && <span>#{item.number}</span>}
                {item.tag && <span>{item.tag}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
