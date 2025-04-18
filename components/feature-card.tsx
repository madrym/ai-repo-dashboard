import Link from "next/link"
import { Calendar, Clock, GitPullRequest, Tag, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  feature: {
    id: string
    title: string
    description: string
    status: string
    type: string
    createdAt: string
    completedAt: string | null
    author: string
    contributors: string[]
    tags: string[]
    prLink: string | null
  }
}

export function FeatureCard({ feature }: FeatureCardProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  }

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400"
      case "planned":
        return "bg-amber-100 text-amber-800 dark:bg-amber-800/20 dark:text-amber-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400"
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1 text-base">{feature.title}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs capitalize">{feature.type}</CardDescription>
          </div>
          <Badge className={cn("text-xs capitalize", getStatusColor(feature.status))}>
            {feature.status.replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="line-clamp-2 text-xs text-muted-foreground">{feature.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {feature.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {feature.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{feature.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(feature.createdAt)}</span>
          </div>
          {feature.completedAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Completed: {formatDate(feature.completedAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>
              {feature.contributors.length > 0 ? `${feature.author} + ${feature.contributors.length}` : feature.author}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        {feature.prLink ? (
          <Button variant="outline" size="sm" className="h-7 w-full text-xs" asChild>
            <Link href={feature.prLink} target="_blank" rel="noopener noreferrer">
              <GitPullRequest className="mr-1 h-3 w-3" />
              View Pull Request
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-7 w-full text-xs" asChild>
            <Link href={`/features/${feature.id}`}>
              <Tag className="mr-1 h-3 w-3" />
              View Feature Details
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
