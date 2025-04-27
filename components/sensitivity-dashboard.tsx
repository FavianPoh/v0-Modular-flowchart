"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, ExternalLink, RefreshCw, ArrowDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Node, Edge } from "reactflow"

interface SensitivityDashboardProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  simulationResults: SimulationResult | null
  isSimulating: boolean
  onJumpToNode?: (nodeId: string) => void
}

export interface SimulationResult {
  changedInput: {
    nodeId: string
    nodeName: string
    inputName: string
    originalValue: any
    newValue: any
  }
  affectedNodes: {
    nodeId: string
    nodeName: string
    nodeType: string
    originalOutputs: Record<string, any>
    newOutputs: Record<string, any>
    isTarget?: boolean
  }[]
  targetMetric?: {
    nodeId: string
    nodeName: string
    metricName: string
    originalValue: any
    newValue: any
    percentChange: number
  }
}

export function SensitivityDashboard({
  isOpen,
  onClose,
  nodes,
  edges,
  simulationResults,
  isSimulating,
  onJumpToNode,
}: SensitivityDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

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

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return "N/A"
    if (typeof value === "number") {
      // Check if it's a small decimal or a whole number
      return Math.abs(value) < 0.01 ? value.toExponential(2) : value.toFixed(2)
    }
    if (typeof value === "boolean") return value ? "true" : "false"
    return String(value)
  }

  // Calculate percentage change
  const calculateChange = (oldValue: any, newValue: any): { value: number; percent: number } => {
    if (
      oldValue === undefined ||
      oldValue === null ||
      newValue === undefined ||
      newValue === null ||
      typeof oldValue !== "number" ||
      typeof newValue !== "number"
    ) {
      return { value: 0, percent: 0 }
    }

    const change = newValue - oldValue
    const percentChange = oldValue !== 0 ? (change / Math.abs(oldValue)) * 100 : 0

    return { value: change, percent: percentChange }
  }

  if (!simulationResults && !isSimulating) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Sensitivity Dashboard</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            No simulation results available. Run a sensitivity analysis to see results.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sensitivity Dashboard</DialogTitle>
        </DialogHeader>

        {isSimulating ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg">Simulating changes...</p>
            <p className="text-sm text-muted-foreground">Calculating how changes propagate through the flowchart</p>
          </div>
        ) : (
          simulationResults && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Detailed Changes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 overflow-hidden mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Input Change</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{simulationResults.changedInput.nodeName}</span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {simulationResults.changedInput.inputName}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="font-mono bg-slate-50 px-2 py-1 rounded">
                              {formatValue(simulationResults.changedInput.originalValue)}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="font-mono bg-slate-50 px-2 py-1 rounded">
                              {formatValue(simulationResults.changedInput.newValue)}
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                simulationResults.changedInput.newValue > simulationResults.changedInput.originalValue
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }
                            >
                              {simulationResults.changedInput.newValue > simulationResults.changedInput.originalValue
                                ? "+"
                                : ""}
                              {calculateChange(
                                simulationResults.changedInput.originalValue,
                                simulationResults.changedInput.newValue,
                              ).percent.toFixed(2)}
                              %
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => onJumpToNode && onJumpToNode(simulationResults.changedInput.nodeId)}
                        >
                          <ExternalLink className="h-3 w-3" /> Jump
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {simulationResults.targetMetric && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Target Metric Impact</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{simulationResults.targetMetric.nodeName}</span>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                {simulationResults.targetMetric.metricName}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="font-mono bg-slate-50 px-2 py-1 rounded">
                                {formatValue(simulationResults.targetMetric.originalValue)}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <div className="font-mono bg-slate-50 px-2 py-1 rounded">
                                {formatValue(simulationResults.targetMetric.newValue)}
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  simulationResults.targetMetric.percentChange > 0
                                    ? "bg-green-50 text-green-700"
                                    : simulationResults.targetMetric.percentChange < 0
                                      ? "bg-red-50 text-red-700"
                                      : "bg-gray-50 text-gray-700"
                                }
                              >
                                {simulationResults.targetMetric.percentChange > 0 ? "+" : ""}
                                {simulationResults.targetMetric.percentChange.toFixed(2)}%
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => onJumpToNode && onJumpToNode(simulationResults.targetMetric.nodeId)}
                          >
                            <ExternalLink className="h-3 w-3" /> Jump
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Propagation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {simulationResults.changedInput.nodeName}
                          </Badge>
                          <span className="font-mono text-sm">{simulationResults.changedInput.inputName}</span>
                        </div>
                        <ArrowDown className="h-5 w-5 text-muted-foreground" />
                        <div className="flex flex-wrap justify-center gap-2 max-w-[500px]">
                          {simulationResults.affectedNodes
                            .filter((node) => !node.isTarget)
                            .slice(0, 3)
                            .map((node, index) => (
                              <Badge key={index} variant="outline" className={getTypeColor(node.nodeType)}>
                                {node.nodeName}
                              </Badge>
                            ))}
                          {simulationResults.affectedNodes.filter((node) => !node.isTarget).length > 3 && (
                            <Badge variant="outline">
                              +{simulationResults.affectedNodes.filter((node) => !node.isTarget).length - 3} more
                            </Badge>
                          )}
                        </div>
                        <ArrowDown className="h-5 w-5 text-muted-foreground" />
                        {simulationResults.targetMetric && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {simulationResults.targetMetric.nodeName}
                            </Badge>
                            <span className="font-mono text-sm">{simulationResults.targetMetric.metricName}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-sm text-muted-foreground">
                        <p>
                          {simulationResults.affectedNodes.length} module
                          {simulationResults.affectedNodes.length !== 1 ? "s" : ""} affected by this change
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="flex-1 overflow-hidden mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {simulationResults.affectedNodes.map((node, index) => (
                      <Card key={index} className={node.isTarget ? "border-2 border-primary" : ""}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{node.nodeName}</CardTitle>
                              <Badge variant="outline" className={getTypeColor(node.nodeType)}>
                                {node.nodeType}
                              </Badge>
                              {node.isTarget && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  Target
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => onJumpToNode && onJumpToNode(node.nodeId)}
                            >
                              <ExternalLink className="h-3 w-3" /> Jump
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.keys(node.originalOutputs).map((key) => {
                              const change = calculateChange(node.originalOutputs[key], node.newOutputs[key])
                              return (
                                <div key={key} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                                  <div>
                                    <div className="text-xs text-muted-foreground">{key} (before)</div>
                                    <div className="font-mono bg-slate-50 px-2 py-1 rounded text-sm">
                                      {formatValue(node.originalOutputs[key])}
                                    </div>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">{key} (after)</div>
                                    <div className="font-mono bg-slate-50 px-2 py-1 rounded text-sm">
                                      {formatValue(node.newOutputs[key])}
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={
                                      change.percent > 0
                                        ? "bg-green-50 text-green-700"
                                        : change.percent < 0
                                          ? "bg-red-50 text-red-700"
                                          : "bg-gray-50 text-gray-700"
                                    }
                                  >
                                    {change.percent > 0 ? "+" : ""}
                                    {change.percent.toFixed(2)}%
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
