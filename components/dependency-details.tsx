"use client"

import { useState, useEffect } from "react"
import { FileCode, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DependencyDetailsProps {
  nodeName: string
  onClose: () => void
}

interface Dependency {
  id: string
  type: string
  path: string
}

export function DependencyDetails({ nodeName, onClose }: DependencyDetailsProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [dependents, setDependents] = useState<Dependency[]>([])
  const [circularDependencies, setCircularDependencies] = useState<string[]>([])

  // Generate mock data for the selected node
  useEffect(() => {
    // Generate mock dependencies
    const mockDependencies: Dependency[] = []
    const mockDependents: Dependency[] = []
    const mockCircular: string[] = []

    // Generate 3-8 dependencies
    const numDeps = Math.floor(Math.random() * 6) + 3
    for (let i = 0; i < numDeps; i++) {
      const fileTypes = ["component", "util", "page", "api", "model", "hook", "context", "test"]
      const type = fileTypes[Math.floor(Math.random() * fileTypes.length)]

      let path
      if (type === "component") {
        path = `components/ui/${getRandomName()}.tsx`
      } else if (type === "page") {
        path = `app/${getRandomName()}/page.tsx`
      } else if (type === "api") {
        path = `app/api/${getRandomName()}/route.ts`
      } else if (type === "hook") {
        path = `hooks/use-${getRandomName()}.ts`
      } else if (type === "context") {
        path = `contexts/${getRandomName()}-context.tsx`
      } else if (type === "test") {
        path = `__tests__/${getRandomName()}.test.tsx`
      } else {
        path = `lib/${type}/${getRandomName()}.ts`
      }

      mockDependencies.push({
        id: `dep-${i}`,
        type,
        path,
      })

      // Add some circular dependencies
      if (i < 2 && Math.random() > 0.7) {
        mockCircular.push(path)
      }
    }

    // Generate 2-6 dependents
    const numDependents = Math.floor(Math.random() * 5) + 2
    for (let i = 0; i < numDependents; i++) {
      const fileTypes = ["component", "util", "page", "api", "model", "hook", "context", "test"]
      const type = fileTypes[Math.floor(Math.random() * fileTypes.length)]

      let path
      if (type === "component") {
        path = `components/ui/${getRandomName()}.tsx`
      } else if (type === "page") {
        path = `app/${getRandomName()}/page.tsx`
      } else if (type === "api") {
        path = `app/api/${getRandomName()}/route.ts`
      } else if (type === "hook") {
        path = `hooks/use-${getRandomName()}.ts`
      } else if (type === "context") {
        path = `contexts/${getRandomName()}-context.tsx`
      } else if (type === "test") {
        path = `__tests__/${getRandomName()}.test.tsx`
      } else {
        path = `lib/${type}/${getRandomName()}.ts`
      }

      mockDependents.push({
        id: `dependent-${i}`,
        type,
        path,
      })

      // Add some circular dependencies
      if (i < 2 && Math.random() > 0.7 && !mockCircular.includes(path)) {
        mockCircular.push(path)
      }
    }

    setDependencies(mockDependencies)
    setDependents(mockDependents)
    setCircularDependencies(mockCircular)
  }, [nodeName])

  // Helper function to generate random names
  function getRandomName() {
    const prefixes = [
      "user",
      "auth",
      "dashboard",
      "profile",
      "settings",
      "home",
      "product",
      "cart",
      "checkout",
      "payment",
      "order",
      "admin",
      "button",
      "card",
      "modal",
      "form",
      "input",
      "dropdown",
      "table",
      "list",
      "grid",
      "layout",
      "header",
      "footer",
    ]

    return prefixes[Math.floor(Math.random() * prefixes.length)]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium truncate">{nodeName}</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Dependencies ({dependencies.length})</h4>
          <ScrollArea className="h-[120px] border rounded-md">
            <div className="p-2 space-y-1">
              {dependencies.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No dependencies</p>
              ) : (
                dependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{dep.path}</span>
                    </div>
                    {circularDependencies.includes(dep.path) && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Dependents ({dependents.length})</h4>
          <ScrollArea className="h-[120px] border rounded-md">
            <div className="p-2 space-y-1">
              {dependents.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No dependents</p>
              ) : (
                dependents.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{dep.path}</span>
                    </div>
                    {circularDependencies.includes(dep.path) && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border p-2">
          <div className="text-xs text-muted-foreground">Circular</div>
          <div className="font-medium text-red-500">{circularDependencies.length}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-xs text-muted-foreground">Type</div>
          <div className="font-medium">{nodeName.split(".").pop()}</div>
        </div>
      </div>
    </div>
  )
}
