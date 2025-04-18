"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Version {
  id: string
  name: string
  date: string
  author: string
  type: string
}

interface SpecVersionSelectorProps {
  versions: Version[]
  selectedVersion: string
  onChange: (version: string) => void
  includeEmpty?: boolean
}

export function SpecVersionSelector({
  versions,
  selectedVersion,
  onChange,
  includeEmpty = false,
}: SpecVersionSelectorProps) {
  return (
    <Select value={selectedVersion} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a version" />
      </SelectTrigger>
      <SelectContent>
        {includeEmpty && <SelectItem value="none">None</SelectItem>}
        {versions.map((version) => (
          <SelectItem key={version.id} value={version.id}>
            {version.name} ({new Date(version.date).toLocaleDateString()})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
