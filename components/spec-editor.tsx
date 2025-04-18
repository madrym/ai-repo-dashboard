"use client"

import { Textarea } from "@/components/ui/textarea"

interface SpecEditorProps {
  content: string
  onChange: (content: string) => void
}

export function SpecEditor({ content, onChange }: SpecEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[500px] font-mono text-sm"
      placeholder="Enter specification content..."
    />
  )
}
