"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ConversationMessage {
  id: string
  type: "question" | "answer"
  author: string
  content: string
  timestamp: string
}

interface SpecConversationProps {
  conversation: ConversationMessage[]
}

export function SpecConversation({ conversation }: SpecConversationProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Get avatar color based on author
  const getAvatarColor = (author: string) => {
    if (author === "AI Assistant") {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    }

    // Generate a consistent color based on the author's name
    const hash = author.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)

    const hue = Math.abs(hash) % 360
    return `bg-[hsl(${hue},70%,90%)] text-[hsl(${hue},70%,30%)] dark:bg-[hsl(${hue},70%,20%)] dark:text-[hsl(${hue},70%,80%)]`
  }

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {conversation.map((message) => (
          <div key={message.id} className={`flex ${message.type === "question" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === "question" ? "bg-primary/10 text-primary-foreground/90" : "bg-muted"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <Avatar className={`h-6 w-6 ${getAvatarColor(message.author)}`}>
                  <AvatarFallback>{getInitials(message.author)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{message.author}</span>
                <span className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</span>
              </div>
              <p className="text-sm text-foreground">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
