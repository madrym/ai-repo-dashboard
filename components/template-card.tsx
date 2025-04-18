import Link from "next/link"
import { Calendar, Star, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TemplateCardProps {
  template: {
    id: string
    name: string
    description: string
    category: string
    tags: string[]
    author: string
    updatedAt: string
    usageCount: number
    isFavorite?: boolean
  }
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="line-clamp-1">{template.category}</CardDescription>
          </div>
          {template.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        <div className="mt-3 flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 pt-0">
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{template.updatedAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{template.usageCount} uses</span>
          </div>
        </div>
        <Button className="w-full" variant="outline" asChild>
          <Link href={`/templates/${template.id}`}>View Template</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
