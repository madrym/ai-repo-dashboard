"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Loader2 } from "lucide-react"

interface DependencyGraphProps {
  filePath: string
  depthLevel: number
  showIndirectDeps: boolean
  zoomLevel: number
  onNodeSelect: (nodeId: string) => void
  dependencyData?: {
    nodes: { id: string; label: string }[];
    edges: { source: string; target: string; type: string }[];
  } | null;
}

interface Node {
  id: string
  group: number
  type: string
  level: number
  isRoot?: boolean
}

interface Link {
  source: string
  target: string
  value: number
  type: string
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

export function DependencyGraph({
  filePath,
  depthLevel,
  showIndirectDeps,
  zoomLevel,
  onNodeSelect,
  dependencyData = null,
}: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [graphData, setGraphData] = useState<GraphData | null>(null)

  // Generate graph data based on dependency data or mock data
  useEffect(() => {
    setIsLoading(true)

    // If we have real dependency data, use it
    if (dependencyData) {
      processDependencyData();
    } else {
      // Otherwise use mock data (for backward compatibility)
      generateMockData();
    }
  }, [filePath, depthLevel, showIndirectDeps, dependencyData]);

  // Process real dependency data
  const processDependencyData = () => {
    if (!dependencyData) return;
    
    const nodes: Node[] = [];
    const links: Link[] = [];
    
    // Filter the dependency graph to show only nodes connected to the selected file
    // and limited by depth level
    const relevantNodeIds = new Set<string>();
    const nodeDepths = new Map<string, number>();
    
    // Add the root node (selected file)
    relevantNodeIds.add(filePath);
    nodeDepths.set(filePath, 0);
    
    // Helper function to traverse graph up to max depth
    const traverseGraph = (startId: string, currentDepth: number, isOutgoing: boolean) => {
      if (currentDepth >= depthLevel) return;
      
      // Find connected nodes
      dependencyData.edges.forEach(edge => {
        const sourceId = edge.source;
        const targetId = edge.target;
        
        if (isOutgoing && sourceId === startId) {
          // This is a dependency (outgoing edge)
          relevantNodeIds.add(targetId);
          const newDepth = nodeDepths.get(targetId) ?? currentDepth + 1;
          nodeDepths.set(targetId, Math.min(newDepth, currentDepth + 1));
          traverseGraph(targetId, currentDepth + 1, isOutgoing);
        } else if (!isOutgoing && targetId === startId) {
          // This is a dependent (incoming edge)
          relevantNodeIds.add(sourceId);
          const newDepth = nodeDepths.get(sourceId) ?? currentDepth + 1;
          nodeDepths.set(sourceId, Math.min(newDepth, currentDepth + 1));
          traverseGraph(sourceId, currentDepth + 1, isOutgoing);
        }
      });
    };
    
    // Traverse dependencies (outgoing edges)
    traverseGraph(filePath, 0, true);
    // Traverse dependents (incoming edges)
    traverseGraph(filePath, 0, false);
    
    // Add nodes
    Array.from(relevantNodeIds).forEach(id => {
      const depth = nodeDepths.get(id) || 0;
      nodes.push({
        id,
        group: id === filePath ? 0 : (depth % 4) + 1,
        type: getFileType(id),
        level: depth,
        isRoot: id === filePath,
      });
    });
    
    // Add edges that connect nodes in our filtered set
    dependencyData.edges.forEach(edge => {
      if (relevantNodeIds.has(edge.source) && relevantNodeIds.has(edge.target)) {
        // Only include if both nodes are in our filtered set
        if (!showIndirectDeps && 
            (nodeDepths.get(edge.source) || 0) > 1 && 
            (nodeDepths.get(edge.target) || 0) > 1) {
          return; // Skip indirect dependencies if not showing them
        }
        
        links.push({
          source: edge.source,
          target: edge.target,
          value: 1,
          type: edge.type || "dependency",
        });
      }
    });
    
    setGraphData({ nodes, links });
    setIsLoading(false);
  };

  // Generate mock data (fallback for backward compatibility)
  const generateMockData = () => {
    // Simulate API call to get dependency data
    setTimeout(() => {
      // Generate mock dependency graph for the selected file
      const nodes: Node[] = []
      const links: Link[] = []

      // Add the root node (selected file)
      nodes.push({
        id: filePath,
        group: 0,
        type: getFileType(filePath),
        level: 0,
        isRoot: true,
      })

      // Generate dependencies (files that the selected file imports)
      const dependencies = generateMockDependencies(filePath, depthLevel)

      // Add dependency nodes and links
      dependencies.forEach((dep) => {
        if (!nodes.some((n) => n.id === dep.id)) {
          nodes.push({
            id: dep.id,
            group: 1,
            type: getFileType(dep.id),
            level: dep.level,
          })
        }

        links.push({
          source: filePath,
          target: dep.id,
          value: 1,
          type: "dependency",
        })

        // Add indirect dependencies if enabled
        if (showIndirectDeps && dep.dependencies && dep.dependencies.length > 0) {
          dep.dependencies.forEach((indirectDep) => {
            if (!nodes.some((n) => n.id === indirectDep.id)) {
              nodes.push({
                id: indirectDep.id,
                group: 2,
                type: getFileType(indirectDep.id),
                level: indirectDep.level,
              })
            }

            links.push({
              source: dep.id,
              target: indirectDep.id,
              value: 1,
              type: "indirect",
            })
          })
        }
      })

      // Generate dependents (files that import the selected file)
      const dependents = generateMockDependents(filePath, depthLevel)

      // Add dependent nodes and links
      dependents.forEach((dep) => {
        if (!nodes.some((n) => n.id === dep.id)) {
          nodes.push({
            id: dep.id,
            group: 3,
            type: getFileType(dep.id),
            level: dep.level,
          })
        }

        links.push({
          source: dep.id,
          target: filePath,
          value: 1,
          type: "dependent",
        })

        // Add indirect dependents if enabled
        if (showIndirectDeps && dep.dependents && dep.dependents.length > 0) {
          dep.dependents.forEach((indirectDep) => {
            if (!nodes.some((n) => n.id === indirectDep.id)) {
              nodes.push({
                id: indirectDep.id,
                group: 4,
                type: getFileType(indirectDep.id),
                level: indirectDep.level,
              })
            }

            links.push({
              source: indirectDep.id,
              target: dep.id,
              value: 1,
              type: "indirect",
            })
          })
        }
      })

      setGraphData({ nodes, links })
      setIsLoading(false)
    }, 1000)
  }

  // Render the graph
  useEffect(() => {
    if (!graphData || !svgRef.current) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    // Set up the SVG
    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Create a group for zoom/pan
    const g = svg.append("g")

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    svg.call(zoom as any)

    // Set initial zoom level
    svg.call((zoom as any).transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(zoomLevel))

    // Create the simulation
    const simulation = d3
      .forceSimulation(graphData.nodes as any)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(0, 0))
      .force("collision", d3.forceCollide().radius(30))

    // Define color scale for node groups
    const colorScale = d3
      .scaleOrdinal()
      .domain([0, 1, 2, 3, 4])
      .range(["#3b82f6", "#10b981", "#8b5cf6", "#f97316", "#ec4899"])

    // Create links
    const link = g
      .append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) + 1)
      .attr("stroke", (d: any) => {
        if (d.type === "dependency") return "#10b981"
        if (d.type === "dependent") return "#f97316"
        return "#9ca3af"
      })
      .attr("stroke-dasharray", (d: any) => (d.type === "indirect" ? "5,5" : ""))

    // Create nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter()
      .append("circle")
      .attr("r", (d: any) => (d.isRoot ? 10 : 6))
      .attr("fill", (d: any) => colorScale(d.group) as string)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
        event.stopPropagation()
        onNodeSelect(d.id)
      })
      .call(drag(simulation) as any)

    // Add tooltips
    node.append("title").text((d: any) => d.id)

    // Add labels
    const label = g
      .append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .enter()
      .append("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .style("font-size", "10px")
      .style("pointer-events", "none")
      .text((d: any) => {
        const parts = d.id.split("/")
        return parts[parts.length - 1]
      })

    // Update node and link positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })

    // Drag function for nodes
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: any) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    // Add legend
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(20, ${height - 100})`)

    const legendItems = [
      { label: "Selected File", color: colorScale(0) as string },
      { label: "Dependencies", color: colorScale(1) as string },
      { label: "Indirect Dependencies", color: colorScale(2) as string },
      { label: "Dependents", color: colorScale(3) as string },
      { label: "Indirect Dependents", color: colorScale(4) as string },
    ]

    legendItems.forEach((item, i) => {
      const legendItem = legend.append("g").attr("transform", `translate(0, ${i * 20})`)

      legendItem.append("circle").attr("r", 6).attr("fill", item.color).attr("stroke", "#fff").attr("stroke-width", 1)

      legendItem.append("text").attr("x", 15).attr("y", 4).style("font-size", "10px").text(item.label)
    })
  }, [graphData, zoomLevel, onNodeSelect])

  // Helper function to get file type from path
  function getFileType(path: string): string {
    const extension = path.split(".").pop() || ""

    if (extension === "tsx") {
      if (path.includes("/ui/")) return "ui-component"
      if (path.includes("/page")) return "page"
      return "component"
    }

    if (extension === "ts") {
      if (path.includes("/lib/")) return "utility"
      if (path.includes("/api/")) return "api"
      return "typescript"
    }

    return extension
  }

  // Helper function to generate mock dependencies
  function generateMockDependencies(filePath: string, maxDepth: number): any[] {
    // Mock data based on file path
    if (filePath === "app/dependencies/page.tsx") {
      const deps = [
        { id: "components/dependency-graph.tsx", level: 1 },
        { id: "components/ui/card.tsx", level: 1 },
        { id: "components/ui/button.tsx", level: 1 },
        { id: "components/ui/tabs.tsx", level: 1 },
        { id: "lib/utils.ts", level: 1 },
      ]

      // Add indirect dependencies if depth > 1
      if (maxDepth > 1) {
        deps[0].dependencies = [
          { id: "lib/utils.ts", level: 2 },
          { id: "components/ui/button.tsx", level: 2 },
        ]

        deps[1].dependencies = [{ id: "lib/utils.ts", level: 2 }]
      }

      return deps
    }

    if (filePath === "components/dependency-graph.tsx") {
      return [
        { id: "lib/utils.ts", level: 1 },
        { id: "components/ui/button.tsx", level: 1 },
      ]
    }

    // Generate random dependencies for other files
    const count = Math.floor(Math.random() * 5) + 1
    const deps = []

    const possibleDeps = [
      "lib/utils.ts",
      "components/ui/button.tsx",
      "components/ui/card.tsx",
      "components/ui/input.tsx",
      "components/ui/tabs.tsx",
      "components/theme-toggle.tsx",
    ]

    for (let i = 0; i < count; i++) {
      const randomDep = possibleDeps[Math.floor(Math.random() * possibleDeps.length)]
      if (!deps.some((d) => d.id === randomDep) && randomDep !== filePath) {
        deps.push({ id: randomDep, level: 1 })
      }
    }

    return deps
  }

  // Helper function to generate mock dependents
  function generateMockDependents(filePath: string, maxDepth: number): any[] {
    // Mock data based on file path
    if (filePath === "components/dependency-graph.tsx") {
      return [{ id: "app/dependencies/page.tsx", level: 1 }]
    }

    if (filePath === "lib/utils.ts") {
      const deps = [
        { id: "app/dependencies/page.tsx", level: 1 },
        { id: "components/dependency-graph.tsx", level: 1 },
        { id: "components/ui/button.tsx", level: 1 },
      ]

      // Add indirect dependents if depth > 1
      if (maxDepth > 1) {
        deps[1].dependents = [{ id: "app/dashboard/page.tsx", level: 2 }]
      }

      return deps
    }

    // Generate random dependents for other files
    const count = Math.floor(Math.random() * 3)
    const deps = []

    const possibleDeps = ["app/dashboard/page.tsx", "app/page.tsx", "components/theme-toggle.tsx"]

    for (let i = 0; i < count; i++) {
      const randomDep = possibleDeps[Math.floor(Math.random() * possibleDeps.length)]
      if (!deps.some((d) => d.id === randomDep) && randomDep !== filePath) {
        deps.push({ id: randomDep, level: 1 })
      }
    }

    return deps
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dependency graph...</p>
        </div>
      </div>
    )
  }

  return <svg ref={svgRef} className="h-full w-full" style={{ background: "var(--background)" }} />
}
