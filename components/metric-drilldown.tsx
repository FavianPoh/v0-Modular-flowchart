"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Info, ArrowRight, Search, ExternalLink, RefreshCw, Sliders } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { SensitivityDashboard, type SimulationResult } from "@/components/sensitivity-dashboard"
import type { Node, Edge } from "reactflow"

interface MetricDrilldownProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string
  selectedMetric?: string
  onJumpToNode?: (nodeId: string) => void
}

type MetricSource = {
  nodeId: string
  nodeName: string
  nodeType: string
  metricName: string
  impactScore: number // 0-100
  directImpact: boolean
  path: string[]
}

type ModuleInput = {
  nodeId: string
  nodeName: string
  nodeType: string
  inputName: string
  inputValue: any
  sourceNodeId?: string
  sourceNodeName?: string
  sourceMetric?: string
}

export function MetricDrilldown({
  isOpen,
  onClose,
  nodes,
  edges,
  selectedNodeId,
  selectedMetric,
  onJumpToNode,
}: MetricDrilldownProps) {
  const [activeTab, setActiveTab] = useState("sources")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"impact" | "module" | "metric">("impact")
  const [filterDirectOnly, setFilterDirectOnly] = useState(false)
  const [selectedMetricForAnalysis, setSelectedMetricForAnalysis] = useState<string | undefined>(selectedMetric)
  const [selectedInputForAnalysis, setSelectedInputForAnalysis] = useState<ModuleInput | null>(null)
  const [sensitivityPercentage, setSensitivityPercentage] = useState(10)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)

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

  // Get all inputs to the selected node
  const moduleInputs = useMemo(() => {
    if (!selectedNode) return []

    const inputs: ModuleInput[] = []
    const nodeMap = new Map(nodes.map((node) => [node.id, node]))

    // First, add all direct inputs from the node
    Object.entries(selectedNode.data.inputs || {}).forEach(([inputName, inputValue]) => {
      // Find if this input comes from another node via an edge
      const incomingEdge = edges.find(
        (edge) => edge.target === selectedNodeId && edge.targetHandle === `input-${inputName}`,
      )

      if (incomingEdge) {
        const sourceNodeId = incomingEdge.source
        const sourceNode = nodeMap.get(sourceNodeId)
        const sourceMetric = incomingEdge.sourceHandle?.replace("output-", "")

        if (sourceNode && sourceMetric) {
          inputs.push({
            nodeId: selectedNodeId,
            nodeName: selectedNode.data.label,
            nodeType: selectedNode.data.type,
            inputName,
            inputValue,
            sourceNodeId,
            sourceNodeName: sourceNode.data.label,
            sourceMetric,
          })
        } else {
          inputs.push({
            nodeId: selectedNodeId,
            nodeName: selectedNode.data.label,
            nodeType: selectedNode.data.type,
            inputName,
            inputValue,
          })
        }
      } else {
        // Input doesn't come from another node
        inputs.push({
          nodeId: selectedNodeId,
          nodeName: selectedNode.data.label,
          nodeType: selectedNode.data.type,
          inputName,
          inputValue,
        })
      }
    })

    return inputs
  }, [selectedNode, selectedNodeId, nodes, edges])

  // Calculate metric sources
  const metricSources = useMemo(() => {
    if (!selectedNode || !selectedMetricForAnalysis) return []

    const sources: MetricSource[] = []
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

        sources.push({
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

    return sources
  }, [selectedNode, selectedMetricForAnalysis, nodes, edges, selectedNodeId])

  // Filter and sort sources
  const filteredSources = useMemo(() => {
    let filtered = metricSources

    // Apply direct impact filter if enabled
    if (filterDirectOnly) {
      filtered = filtered.filter((source) => source.directImpact)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (source) =>
          source.nodeName.toLowerCase().includes(term) ||
          source.metricName.toLowerCase().includes(term) ||
          source.nodeType.toLowerCase().includes(term),
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
  }, [metricSources, filterDirectOnly, searchTerm, sortBy])

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

  // Jump to a specific node
  const handleJumpToNode = useCallback(
    (nodeId: string) => {
      if (onJumpToNode) {
        onJumpToNode(nodeId)
        onClose()
      }
    },
    [onJumpToNode, onClose],
  )

  // Build dependency graph for proper recalculation order
  const buildDependencyGraph = useCallback(
    (nodes: Node[]) => {
      const graph: Record<string, string[]> = {}

      // Initialize graph with all nodes
      nodes.forEach((node) => {
        graph[node.id] = []
      })

      // Add dependencies based on edges
      edges.forEach((edge) => {
        const sourceId = edge.source
        const targetId = edge.target

        // Add sourceId as a dependency for targetId
        if (!graph[targetId].includes(sourceId)) {
          graph[targetId].push(sourceId)
        }
      })

      return graph
    },
    [edges],
  )

  // Perform topological sort to determine execution order
  const topologicalSort = useCallback(() => {
    const graph = buildDependencyGraph(nodes)
    const visited = new Set<string>()
    const temp = new Set<string>()
    const order: string[] = []

    // Define visit function without using hooks
    function visit(nodeId: string) {
      // If node is in temp, we have a cycle
      if (temp.has(nodeId)) return

      // If we've already processed this node, skip
      if (visited.has(nodeId)) return

      // Mark node as being processed
      temp.add(nodeId)

      // Visit all dependencies
      const dependencies = graph[nodeId] || []
      for (const depId of dependencies) {
        visit(depId)
      }

      // Mark as fully processed
      temp.delete(nodeId)
      visited.add(nodeId)

      // Add to result
      order.push(nodeId)
    }

    // Visit all nodes
    for (const nodeId in graph) {
      if (!visited.has(nodeId)) {
        visit(nodeId)
      }
    }

    return order
  }, [buildDependencyGraph, nodes])

  // Run sensitivity analysis on a selected input
  const runSensitivityAnalysis = useCallback(() => {
    if (!selectedNode || !selectedMetricForAnalysis || !selectedInputForAnalysis) return

    setIsSimulating(true)
    setSimulationResults(null)

    // Use setTimeout to avoid blocking the UI
    setTimeout(() => {
      try {
        // Deep clone nodes to avoid modifying the original
        const clonedNodes = nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            inputs: { ...node.data.inputs },
            outputs: { ...node.data.outputs },
            // Recreate function from functionCode
            function: node.data.functionCode ? new Function("inputs", node.data.functionCode) : undefined,
          },
        }))

        // Create a map for quick node lookup
        const nodeMap = new Map(clonedNodes.map((node) => [node.id, node]))

        // Get the original value of the target metric
        const originalTargetValue = selectedNode.data.outputs?.[selectedMetricForAnalysis]

        // Store original outputs for all nodes
        const originalOutputs = new Map<string, Record<string, any>>()
        clonedNodes.forEach((node) => {
          originalOutputs.set(node.id, { ...node.data.outputs })
        })

        // Find the node to modify
        const targetNodeId = selectedInputForAnalysis.nodeId
        let targetNode = nodeMap.get(targetNodeId)
        if (!targetNode) {
          setIsSimulating(false)
          return
        }

        // Get original input value
        const inputName = selectedInputForAnalysis.inputName
        const originalValue = targetNode.data.inputs[inputName]

        // Calculate new value based on percentage change
        const newValue =
          typeof originalValue === "number" ? originalValue * (1 + sensitivityPercentage / 100) : originalValue

        // Update the input of the target node
        targetNode.data.inputs[inputName] = newValue

        // If this is an input node, also update the output with the same name if it exists
        if (targetNode.data.type === "input" && targetNode.data.outputs[inputName] !== undefined) {
          targetNode.data.outputs[inputName] = newValue
        }

        // Build dependency graph and get execution order
        const executionOrder = topologicalSort()

        // Group edges by target node for efficient lookup
        const edgesByTarget: Record<string, Edge[]> = {}
        edges.forEach((edge) => {
          if (!edgesByTarget[edge.target]) {
            edgesByTarget[edge.target] = []
          }
          edgesByTarget[edge.target].push(edge)
        })

        // Track affected nodes
        const affectedNodes: {
          nodeId: string
          nodeName: string
          nodeType: string
          originalOutputs: Record<string, any>
          newOutputs: Record<string, any>
          isTarget?: boolean
        }[] = []

        // Execute nodes in order
        for (const nodeId of executionOrder) {
          const node = nodeMap.get(nodeId)
          if (!node || !node.data.function) continue

          // Skip nodes that don't need recalculation
          if (
            nodeId !== targetNodeId &&
            !buildDependencyGraph(clonedNodes)[nodeId].some((depId) => affectedNodes.some((n) => n.nodeId === depId))
          ) {
            continue
          }

          // Get edges targeting this node
          const targetingEdges = edgesByTarget[nodeId] || []

          // Update inputs based on source node outputs
          targetingEdges.forEach((edge) => {
            const sourceNode = nodeMap.get(edge.source)
            if (!sourceNode) return

            // Extract input and output keys from handles
            const sourceOutputKey = edge.sourceHandle?.replace("output-", "")
            const targetInputKey = edge.targetHandle?.replace("input-", "")

            if (sourceOutputKey && targetInputKey && sourceNode.data.outputs[sourceOutputKey] !== undefined) {
              // Update the input
              node.data.inputs[targetInputKey] = sourceNode.data.outputs[sourceOutputKey]
            }
          })

          // Store original outputs
          const originalNodeOutputs = originalOutputs.get(nodeId) || {}

          // Recalculate outputs
          try {
            node.data.outputs = node.data.function(node.data.inputs)
          } catch (simError) {
            console.error("Error in sensitivity simulation:", simError)
          }

          // Check if outputs changed
          const outputsChanged = Object.keys(node.data.outputs).some(
            (key) => node.data.outputs[key] !== originalNodeOutputs[key],
          )

          if (outputsChanged) {
            affectedNodes.push({
              nodeId: node.id,
              nodeName: node.data.label,
              nodeType: node.data.type,
              originalOutputs: originalNodeOutputs,
              newOutputs: { ...node.data.outputs },
              isTarget: node.id === selectedNodeId,
            })
          }
        }

        // Get the new value of the target metric
        targetNode = nodeMap.get(selectedNodeId)
        const newTargetValue = targetNode?.data.outputs?.[selectedMetricForAnalysis]

        // Calculate percentage change for target metric
        const percentChange =
          originalTargetValue !== 0 && typeof originalTargetValue === "number" && typeof newTargetValue === "number"
            ? ((newTargetValue - originalTargetValue) / Math.abs(originalTargetValue)) * 100
            : 0

        // Create simulation results
        const results: SimulationResult = {
          changedInput: {
            nodeId: selectedInputForAnalysis.nodeId,
            nodeName: selectedInputForAnalysis.nodeName,
            inputName: selectedInputForAnalysis.inputName,
            originalValue,
            newValue,
          },
          affectedNodes,
          targetMetric: {
            nodeId: selectedNodeId,
            nodeName: selectedNode.data.label,
            metricName: selectedMetricForAnalysis,
            originalValue: originalTargetValue,
            newValue: newTargetValue,
            percentChange,
          },
        }

        setSimulationResults(results)
        setIsDashboardOpen(true)
      } catch (error) {
        console.error("Error in sensitivity analysis:", error)
      } finally {
        setIsSimulating(false)
      }
    }, 100)
  }, [
    selectedNode,
    selectedMetricForAnalysis,
    selectedInputForAnalysis,
    sensitivityPercentage,
    nodes,
    edges,
    selectedNodeId,
    buildDependencyGraph,
    topologicalSort,
  ])

  // Reset sensitivity analysis
  const resetSensitivityAnalysis = useCallback(() => {
    setSelectedInputForAnalysis(null)
    setSensitivityPercentage(10)
    setSimulationResults(null)
  }, [])

  if (!selectedNode) return null

  const applySimulationResults = useCallback(() => {
    // Implement the logic to apply the simulation results to the actual nodes
    // This might involve updating the state of the nodes and edges in the parent component
    console.log("Applying simulation results:", simulationResults)
    // onClose(); // Close the dialog after applying changes, if desired
  }, [simulationResults])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Metric Analysis: {selectedNode.data.label}
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
              <TabsTrigger value="sources">Metric Sources</TabsTrigger>
              <TabsTrigger value="sensitivity">Sensitivity Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="flex-1 overflow-hidden mt-0">
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

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filteredSources.length > 0 ? (
                    filteredSources.map((source, index) => (
                      <Card
                        key={`${source.nodeId}-${source.metricName}-${index}`}
                        className={`border ${source.directImpact ? "border-2" : "border"}`}
                      >
                        <CardContent className="p-3 flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{source.nodeName}</span>
                              <Badge variant="outline" className={getTypeColor(source.nodeType)}>
                                {source.nodeType}
                              </Badge>
                              {source.directImpact && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Direct
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <span className="font-mono">{source.metricName}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="font-mono">{selectedMetricForAnalysis}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                                    {source.path.map((step, i) => {
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => handleJumpToNode(source.nodeId)}
                            >
                              <ExternalLink className="h-3 w-3" /> Jump
                            </Button>
                          </div>
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

            <TabsContent value="sensitivity" className="flex-1 overflow-hidden mt-0">
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium mb-2">Sensitivity Analysis Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Input to Modify:</Label>
                      <Select
                        value={
                          selectedInputForAnalysis
                            ? `${selectedInputForAnalysis.nodeId}:${selectedInputForAnalysis.inputName}`
                            : ""
                        }
                        onValueChange={(value) => {
                          const [nodeId, inputName] = value.split(":")
                          const input = moduleInputs.find(
                            (input) => input.nodeId === nodeId && input.inputName === inputName,
                          )
                          setSelectedInputForAnalysis(input || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an input" />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleInputs.map((input) => (
                            <SelectItem
                              key={`${input.nodeId}:${input.inputName}`}
                              value={`${input.nodeId}:${input.inputName}`}
                            >
                              {input.inputName}
                              {input.sourceNodeName && ` (from ${input.sourceNodeName})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedInputForAnalysis && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Input Change Percentage: {sensitivityPercentage}%</Label>
                            <span className="text-sm text-muted-foreground">How much to adjust the input value</span>
                          </div>
                          <Slider
                            value={[sensitivityPercentage]}
                            onValueChange={(values) => setSensitivityPercentage(values[0])}
                            min={-50}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="bg-slate-100 p-3 rounded-md">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Current Value:</span>
                              <span className="font-mono">
                                {typeof selectedInputForAnalysis.inputValue === "number"
                                  ? selectedInputForAnalysis.inputValue.toFixed(2)
                                  : String(selectedInputForAnalysis.inputValue)}
                              </span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">New Value (estimated):</span>
                              <span className="font-mono">
                                {typeof selectedInputForAnalysis.inputValue === "number"
                                  ? (selectedInputForAnalysis.inputValue * (1 + sensitivityPercentage / 100)).toFixed(2)
                                  : String(selectedInputForAnalysis.inputValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={resetSensitivityAnalysis}
                        disabled={!selectedInputForAnalysis}
                        className="flex-1"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={runSensitivityAnalysis}
                        disabled={!selectedInputForAnalysis || isSimulating}
                        className="flex-1"
                      >
                        {isSimulating ? "Analyzing..." : "Run Analysis"}
                        {isSimulating ? (
                          <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sliders className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {simulationResults && (
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Analysis Results</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDashboardOpen(true)}
                        className="flex items-center gap-1"
                      >
                        <Sliders className="h-3 w-3" /> View Dashboard
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Input Changed:</span>
                        <span className="font-medium">
                          {simulationResults.changedInput.inputName} (
                          {typeof simulationResults.changedInput.originalValue === "number"
                            ? simulationResults.changedInput.originalValue.toFixed(2)
                            : String(simulationResults.changedInput.originalValue)}
                          {" → "}
                          {typeof simulationResults.changedInput.newValue === "number"
                            ? simulationResults.changedInput.newValue.toFixed(2)
                            : String(simulationResults.changedInput.newValue)}
                          )
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target Metric:</span>
                        <span className="font-medium">
                          {simulationResults.targetMetric?.metricName} (
                          {typeof simulationResults.targetMetric?.originalValue === "number"
                            ? simulationResults.targetMetric?.originalValue.toFixed(2)
                            : String(simulationResults.targetMetric?.originalValue)}
                          {" → "}
                          {typeof simulationResults.targetMetric?.newValue === "number"
                            ? simulationResults.targetMetric?.newValue.toFixed(2)
                            : String(simulationResults.targetMetric?.newValue)}
                          )
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impact:</span>
                        <Badge
                          variant="outline"
                          className={
                            (simulationResults.targetMetric?.percentChange || 0) > 0
                              ? "bg-green-50 text-green-700"
                              : (simulationResults.targetMetric?.percentChange || 0) < 0
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-50 text-gray-700"
                          }
                        >
                          {(simulationResults.targetMetric?.percentChange || 0) > 0 ? "+" : ""}
                          {(simulationResults.targetMetric?.percentChange || 0).toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Affected Modules:</span>
                        <span className="font-medium">{simulationResults.affectedNodes.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              This analysis shows which metrics contribute to the selected metric and how sensitive it is to changes in
              inputs.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <SensitivityDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        nodes={nodes}
        edges={edges}
        simulationResults={simulationResults}
        isSimulating={isSimulating}
        onJumpToNode={onJumpToNode}
        onApplyChanges={applySimulationResults}
      />
    </>
  )
}
