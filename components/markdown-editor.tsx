"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export function MarkdownEditor({ value, onChange, readOnly = false }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<string>(readOnly ? "preview" : "edit")

  return (
    <div className="rounded-md border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="edit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="mt-0 border-0 p-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[400px] resize-none rounded-none border-0 p-4 font-mono text-sm focus-visible:ring-0"
            placeholder="Write markdown content here..."
            readOnly={readOnly}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 border-0 p-0">
          <div className="markdown-preview min-h-[400px] p-4">
            {value.split("\n").map((line, i) => {
              // Very basic markdown rendering for demonstration
              if (line.startsWith("# ")) {
                return (
                  <h1 key={i} className="mb-4 text-2xl font-bold">
                    {line.substring(2)}
                  </h1>
                )
              } else if (line.startsWith("## ")) {
                return (
                  <h2 key={i} className="mb-3 text-xl font-bold">
                    {line.substring(3)}
                  </h2>
                )
              } else if (line.startsWith("### ")) {
                return (
                  <h3 key={i} className="mb-2 text-lg font-bold">
                    {line.substring(4)}
                  </h3>
                )
              } else if (line.startsWith("- [ ] ")) {
                return (
                  <div key={i} className="ml-4 flex items-center gap-2 py-1">
                    <input type="checkbox" disabled />
                    <span>{line.substring(6)}</span>
                  </div>
                )
              } else if (line.startsWith("- ")) {
                return (
                  <li key={i} className="ml-4 py-1">
                    {line.substring(2)}
                  </li>
                )
              } else if (line === "") {
                return <br key={i} />
              } else {
                return (
                  <p key={i} className="mb-2">
                    {line}
                  </p>
                )
              }
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
