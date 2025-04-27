"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Info, ArrowRight, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Node, Edge } from "reactflow"

interface MetricDrilldownProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string
  selectedMetric?: string
}

type MetricImpact = {
  nodeId: string
  nodeName: string
  nodeType: string
  metricName: string
  impactScore: number // 0-100
  directImpact: boolean
  path: string[]
}

export function MetricDrilldown({
  isOpen,
  onClose,
  nodes,
  edges,
  selectedNodeId,
  selectedMetric,
}: MetricDrilldownProps) {
  const [activeTab, setActiveTab] = useState("heatmap")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"impact" | "module" | "metric">("impact")
  const [filterDirectOnly, setFilterDirectOnly] = useState(false)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<string | undefined>(selectedMetric)

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId), [nodes, selectedNodeId])

  // Get available metrics for the selected node
  const availableMetrics = useMemo(() => {
    if (!selectedNode) return []
    return Object.keys(selectedNode.data.outputs || {})
  }, [selectedNode])

  // Set the first metric as default if none is selected
  useEffect(() => {
    if (availableMetrics.length > 0 && !selectedMetricForAnalysis) {
      setSelectedMetricForAnalysis(availableMetrics[0])
    }
  }, [availableMetrics, selectedMetricForAnalysis])

  // Calculate metric impacts
  const metricImpacts = useMemo(() => {
    if (!selectedNode || !selectedMetricForAnalysis) return []

    const impacts: MetricImpact[] = []
    const visited = new Set<string>()
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))

    // Helper function to trace dependencies recursively
    const traceDependencies = (
      nodeId: string,
      metricName: string,
      depth: number,
      path: string[],
      isDirectPath: boolean,
    ) => {
      // Avoid cycles and limit depth
      const visitKey = `${nodeId}:${metricName}`
      if (visited.has(visitKey) || depth > 10) return
      visited.add(visitKey)

      const currentPath = [...path, `${nodeId}:${metricName}`]

      // Find incoming edges to this node
      const incomingEdges = edges.filter((edge) => edge.target === nodeId)

      for (const edge of incomingEdges) {
        const sourceNode = nodeMap.get(edge.source)
        if (!sourceNode) continue

        // Extract the source metric name from the edge
        const sourceMetricName = edge.sourceHandle?.replace("output-", "") || ""
        if (!sourceMetricName) continue

        // Calculate impact score based on depth and connection type
        // Direct connections have higher impact
        const impactScore = Math.max(10, Math.round(100 / (depth + 1)))

        impacts.push({
          nodeId: sourceNode.id,
          nodeName: sourceNode.data.label,
          nodeType: sourceNode.data.type,
          metricName: sourceMetricName,
          impactScore,
          directImpact: depth === 0,
          path: currentPath,
        })

        // Recursively trace dependencies of the source node
        traceDependencies(sourceNode.id, sourceMetricName, depth + 1, currentPath, isDirectPath && depth === 0)
      }
    }

    // Start tracing from the selected node and metric
    traceDependencies(selectedNodeId, selectedMetricForAnalysis, 0, [], true)

    return impacts
  }, [selectedNode, selectedMetricForAnalysis, nodes, edges, selectedNodeId])

  // Filter and sort impacts
  const filteredImpacts = useMemo(() => {
    let filtered = metricImpacts

    // Apply direct impact filter if enabled
    if (filterDirectOnly) {
      filtered = filtered.filter((impact) => impact.directImpact)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (impact) =>
          impact.nodeName.toLowerCase().includes(term) ||
          impact.metricName.toLowerCase().includes(term) ||
          impact.nodeType.toLowerCase().includes(term),
      )
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === "impact") {
        return b.impactScore - a.impactScore
      } else if (sortBy === "module") {
        return a.nodeName.localeCompare(b.nodeName)
      } else {
        return a.metricName.localeCompare(b.metricName)
      }
    })
  }, [metricImpacts, filterDirectOnly, searchTerm, sortBy])

  // Get impact color based on score
  const getImpactColor = (score: number) => {
    if (score >= 80) return "bg-red-100 border-red-300 text-red-800"
    if (score >= 60) return "bg-orange-100 border-orange-300 text-orange-800"
    if (score >= 40) return "bg-amber-100 border-amber-300 text-amber-800"
    if (score >= 20) return "bg-yellow-100 border-yellow-300 text-yellow-800"
    return "bg-green-100 border-green-300 text-green-800"
  }

  // Get module type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "input":
        return "bg-blue-100 text-blue-800"
      case "math":
        return "bg-green-100 text-green-800"
      case "logic":
        return "bg-purple-100 text-purple-800"
      case "filter":
        return "bg-amber-100 text-amber-800"
      case "transform":
        return "bg-indigo-100 text-indigo-800"
      case "output":
        return "bg-rose-100 text-rose-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!selectedNode) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Metric Drilldown: {selectedNode.data.label}
            <Badge variant="outline" className={getTypeColor(selectedNode.data.type)}>
              {selectedNode.data.type}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Label htmlFor="metric-select" className="whitespace-nowrap">
            Analyzing metric:
          </Label>
          <Select value={selectedMetricForAnalysis} onValueChange={setSelectedMetricForAnalysis}>
            <SelectTrigger id="metric-select" className="w-[180px]">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              {availableMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground ml-2">
            Current value:{" "}
            <span className="font-mono">{selectedNode.data.outputs?.[selectedMetricForAnalysis || ""] ?? "N/A"}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
            <TabsTrigger value="list">Detailed List</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 my-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics or modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Sort by Impact</SelectItem>
                <SelectItem value="module">Sort by Module</SelectItem>
                <SelectItem value="metric">Sort by Metric</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Label htmlFor="direct-only" className="text-xs cursor-pointer">
                Direct only
              </Label>
              <input
                id="direct-only"
                type="checkbox"
                checked={filterDirectOnly}
                onChange={(e) => setFilterDirectOnly(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </div>

          <TabsContent value="heatmap" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {filteredImpacts.length > 0 ? (
                  filteredImpacts.map((impact, index) => (
                    <Card
                      key={`${impact.nodeId}-${impact.metricName}-${index}`}
                      className={`border ${impact.directImpact ? "border-2" : "border"}`}
                    >
                      <CardContent className="p-3 flex items-center gap-2">
                        <div
                          className={`w-12 h-12 flex items-center justify-center rounded-md ${getImpactColor(
                            impact.impactScore,
                          )}`}
                        >
                          <span className="font-bold">{impact.impactScore}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{impact.nodeName}</span>
                            <Badge variant="outline" className={getTypeColor(impact.nodeType)}>
                              {impact.nodeType}
                            </Badge>
                            {impact.directImpact && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Direct
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-mono">{impact.metricName}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="font-mono">{selectedMetricForAnalysis}</span>
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px]">
                              <p className="text-sm font-medium mb-1">Dependency Path:</p>
                              <div className="text-xs">
                                {impact.path.map((step, i) => {
                                  const [nodeId, metric] = step.split(":")
                                  const node = nodes.find((n) => n.id === nodeId)
                                  return (
                                    <div key={i} className="flex items-center">
                                      {i > 0 && <ArrowRight className="h-3 w-3 mx-1" />}
                                      <span>
                                        {node?.data.label}.{metric}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    No contributing metrics found
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="list" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-[400px] pr-4">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Module</th>
                    <th className="text-left p-2">Metric</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Impact</th>
                    <th className="text-left p-2">Direct</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredImpacts.length > 0 ? (
                    filteredImpacts.map((impact, index) => (
                      <tr key={`${impact.nodeId}-${impact.metricName}-${index}`} className="border-b hover:bg-slate-50">
                        <td className="p-2">{impact.nodeName}</td>
                        <td className="p-2 font-mono">{impact.metricName}</td>
                        <td className="p-2">
                          <Badge variant="outline" className={getTypeColor(impact.nodeType)}>
                            {impact.nodeType}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-md ${getImpactColor(
                                impact.impactScore,
                              )}`}
                            >
                              {impact.impactScore}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{impact.directImpact ? "Yes" : "No"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No contributing metrics found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="mt-2 text-sm text-muted-foreground">
          <p>
            This visualization shows which metrics contribute to the selected metric. Higher scores indicate stronger
            impact.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
