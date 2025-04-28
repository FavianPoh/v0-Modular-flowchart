"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, ArrowRight, RefreshCw, Check } from "lucide-react"

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
}

interface SensitivityDashboardProps {
  isOpen: boolean
  onClose: () => void
  nodes: any[]
  edges: any[]
  simulationResults: SimulationResult | null
  isSimulating: boolean
  onJumpToNode: (nodeId: string) => void
  onApplyChanges: () => void
  onReset?: () => void
}

export function SensitivityDashboard({
  isOpen,
  onClose,
  nodes,
  edges,
  simulationResults,
  isSimulating,
  onJumpToNode,
  onApplyChanges,
  onReset,
}: SensitivityDashboardProps) {
  const [showAffectedModules, setShowAffectedModules] = useState(false)

  // Get color based on module type
  const getNodeColor = (type: string) => {
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

  // Calculate percentage change between two values
  const calculatePercentageChange = (original: number, updated: number) => {
    if (original === 0) return updated === 0 ? 0 : Number.POSITIVE_INFINITY
    return ((updated - original) / Math.abs(original)) * 100
  }

  // Format percentage change with sign and color
  const formatPercentageChange = (change: number) => {
    const formattedChange = isFinite(change) ? change.toFixed(2) : "∞"
    const sign = change > 0 ? "+" : ""
    const color = change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
    return (
      <span className={color}>
        {sign}
        {formattedChange}%
      </span>
    )
  }

  // Get the most significant changes
  const getSignificantChanges = () => {
    if (!simulationResults) return []

    const changes: {
      nodeId: string
      nodeName: string
      nodeType: string
      metric: string
      originalValue: number
      newValue: number
      percentChange: number
    }[] = []

    simulationResults.affectedNodes.forEach((node) => {
      Object.keys(node.newOutputs).forEach((metric) => {
        const originalValue = node.originalOutputs[metric]
        const newValue = node.newOutputs[metric]

        // Only include numeric values
        if (typeof originalValue === "number" && typeof newValue === "number") {
          const percentChange = calculatePercentageChange(originalValue, newValue)
          changes.push({
            nodeId: node.nodeId,
            nodeName: node.nodeName,
            nodeType: node.nodeType,
            metric,
            originalValue,
            newValue,
            percentChange,
          })
        }
      })
    })

    // Sort by absolute percentage change (descending)
    return changes.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange)).slice(0, 5)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Sensitivity Analysis</SheetTitle>
          <SheetDescription>See how changing an input affects the outputs across your flowchart</SheetDescription>
        </SheetHeader>

        {isSimulating ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Running simulation...</p>
          </div>
        ) : simulationResults ? (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Input Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Module:</span>
                    <span className="text-sm font-medium">{simulationResults.changedInput.nodeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Input:</span>
                    <span className="text-sm font-medium">{simulationResults.changedInput.inputName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Original Value:</span>
                    <span className="text-sm font-mono">
                      {typeof simulationResults.changedInput.originalValue === "number"
                        ? simulationResults.changedInput.originalValue.toFixed(2)
                        : String(simulationResults.changedInput.originalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">New Value:</span>
                    <span className="text-sm font-mono">
                      {typeof simulationResults.changedInput.newValue === "number"
                        ? simulationResults.changedInput.newValue.toFixed(2)
                        : String(simulationResults.changedInput.newValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Change:</span>
                    <span className="text-sm font-mono">
                      {typeof simulationResults.changedInput.originalValue === "number" &&
                      typeof simulationResults.changedInput.newValue === "number"
                        ? formatPercentageChange(
                            calculatePercentageChange(
                              simulationResults.changedInput.originalValue,
                              simulationResults.changedInput.newValue,
                            ),
                          )
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modules Affected:</span>
                    <span className="text-sm font-medium">{simulationResults.affectedNodes.length}</span>
                  </div>

                  {/* New expandable section for affected modules */}
                  <Collapsible
                    open={showAffectedModules}
                    onOpenChange={setShowAffectedModules}
                    className="border rounded-md mt-2"
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-slate-50">
                      <span className="text-sm font-medium">Affected Modules</span>
                      {showAffectedModules ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-2 border-t">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {simulationResults.affectedNodes.map((node) => (
                          <div
                            key={node.nodeId}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 cursor-pointer"
                            onClick={() => onJumpToNode(node.nodeId)}
                          >
                            <div className="flex items-center gap-2">
                              <Badge className={getNodeColor(node.nodeType)} variant="secondary">
                                {node.nodeType}
                              </Badge>
                              <span className="text-sm">{node.nodeName}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Most Significant Changes</h4>
                    <div className="space-y-2">
                      {getSignificantChanges().map((change, index) => (
                        <div
                          key={`${change.nodeId}-${change.metric}`}
                          className="p-2 bg-slate-50 rounded-md cursor-pointer hover:bg-slate-100"
                          onClick={() => onJumpToNode(change.nodeId)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Badge className={getNodeColor(change.nodeType)} variant="secondary">
                                {change.nodeType}
                              </Badge>
                              <span className="text-sm font-medium">{change.nodeName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{change.metric}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">
                              {change.originalValue.toFixed(2)} <ArrowRight className="inline h-3 w-3" />{" "}
                              {change.newValue.toFixed(2)}
                            </span>
                            <span className="text-xs font-medium">{formatPercentageChange(change.percentChange)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onApplyChanges} className="gap-2">
                <Check className="h-4 w-4" /> Apply Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground">No simulation results available.</p>
            <p className="text-muted-foreground">Run a sensitivity analysis to see results.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
