"use client"

import { memo, useState, useMemo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Trash2, RefreshCw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Separate function to calculate outputs to avoid doing it during render
function calculateOutputs(data: any) {
  try {
    if (typeof data.function === "function") {
      // Create a clean copy of inputs to prevent reference issues
      const inputsCopy = JSON.parse(JSON.stringify(data.inputs || {}))
      return data.function(inputsCopy)
    }
    return data.outputs || {}
  } catch (error) {
    console.error("Error executing module:", error)
    return { error: "Execution failed" }
  }
}

const ModuleNode = memo(({ data, id, selected }: NodeProps) => {
  const { label, type, inputs, outputs, description, isUserAdded, onDelete, needsRecalculation } = data
  const [isHovered, setIsHovered] = useState(false)

  // Use the pre-calculated outputs from the node data instead of calculating during render
  const displayOutputs = outputs || {}

  // Determine the color based on the module type and if it's user-added
  const typeColor = useMemo(() => {
    // Base color based on module type
    const baseColor = (() => {
      switch (type) {
        case "input":
          return "bg-blue-100 border-blue-300"
        case "math":
          return "bg-green-100 border-green-300"
        case "logic":
          return "bg-purple-100 border-purple-300"
        case "filter":
          return "bg-amber-100 border-amber-300"
        case "transform":
          return "bg-indigo-100 border-indigo-300"
        case "output":
          return "bg-rose-100 border-rose-300"
        case "custom":
          return "bg-gray-100 border-gray-300"
        default:
          return "bg-slate-100 border-slate-300"
      }
    })()

    // If user-added, use a different border style
    if (isUserAdded) {
      return baseColor.replace("border-", "border-2 border-dashed border-blue-")
    }

    return baseColor
  }, [type, isUserAdded])

  return (
    <Card
      className={`w-64 shadow-md ${typeColor} ${selected ? "ring-2 ring-black" : ""} ${needsRecalculation ? "border-amber-500" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            {needsRecalculation && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs flex gap-1 items-center">
                      <RefreshCw className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Module needs recalculation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isUserAdded && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                Custom
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs flex gap-1 items-center">
                    <Info className="h-3 w-3" />
                    {type}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isHovered && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 -mr-1"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete(id)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="text-xs mt-1 line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="text-xs">
          <div className="font-semibold mb-1 text-muted-foreground">Inputs:</div>
          {Object.entries(inputs).map(([key, value], index) => (
            <div key={`input-${key}`} className="flex justify-between items-center mb-1">
              <span>{key}:</span>
              <span className="font-mono">{value}</span>
              <Handle
                type="target"
                position={Position.Left}
                id={`input-${key}`}
                className="w-2 h-2 bg-blue-500"
                style={{ left: -5, top: 80 + index * 20 }}
              />
            </div>
          ))}
          <div className="h-px bg-slate-200 my-2" />
          <div className="font-semibold mb-1 text-muted-foreground">Outputs:</div>
          {Object.entries(displayOutputs).map(([key, value], index) => (
            <div key={`output-${key}`} className="flex justify-between items-center mb-1">
              <span>{key}:</span>
              <span className="font-mono">{value}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`output-${key}`}
                className="w-2 h-2 bg-green-500"
                style={{ right: -5, top: 80 + Object.keys(inputs).length * 20 + 20 + index * 20 }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})

ModuleNode.displayName = "ModuleNode"

export { ModuleNode }
