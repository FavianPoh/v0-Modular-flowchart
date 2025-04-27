"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, Trash2, RefreshCw, X, Library } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

// Create a stable component that doesn't recalculate during render
const ModuleNode = memo(
  ({ data, id, selected }: NodeProps) => {
    const {
      label,
      type,
      inputs,
      outputs,
      description,
      isUserAdded,
      isFromLibrary,
      onDelete,
      onCancel,
      needsRecalculation,
    } = data

    // Determine the color based on the module type and if it's user-added
    let typeColor = "bg-slate-100 border-slate-300"

    switch (type) {
      case "input":
        typeColor = "bg-blue-100 border-blue-300"
        break
      case "math":
        typeColor = "bg-green-100 border-green-300"
        break
      case "logic":
        typeColor = "bg-purple-100 border-purple-300"
        break
      case "filter":
        typeColor = "bg-amber-100 border-amber-300"
        break
      case "transform":
        typeColor = "bg-indigo-100 border-indigo-300"
        break
      case "output":
        typeColor = "bg-rose-100 border-rose-300"
        break
      case "custom":
        typeColor = "bg-gray-100 border-gray-300"
        break
    }

    // If user-added, use a different border style
    if (isUserAdded) {
      typeColor = typeColor.replace("border-", "border-2 border-dashed border-blue-")
    }

    // If from library, use a different border style
    if (isFromLibrary) {
      typeColor = typeColor.replace("border-", "border-2 border-dotted border-purple-")
    }

    // Use the pre-calculated outputs from the node data
    const displayOutputs = outputs || {}

    return (
      <Card
        className={`w-64 shadow-md ${typeColor} ${selected ? "ring-2 ring-black" : ""} ${needsRecalculation ? "border-amber-500" : ""}`}
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
              {isFromLibrary && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs flex items-center gap-1">
                  <Library className="h-3 w-3" /> Library
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
              {(isUserAdded || isFromLibrary) && onCancel && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCancel(id)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
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
            {Object.entries(inputs || {}).map(([key, value], index) => (
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
                  style={{ right: -5, top: 80 + Object.keys(inputs || {}).length * 20 + 20 + index * 20 }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if these specific properties change
    return (
      prevProps.selected === nextProps.selected &&
      prevProps.data.label === nextProps.data.label &&
      prevProps.data.description === nextProps.data.description &&
      prevProps.data.needsRecalculation === nextProps.data.needsRecalculation &&
      JSON.stringify(prevProps.data.inputs) === JSON.stringify(nextProps.data.inputs) &&
      JSON.stringify(prevProps.data.outputs) === JSON.stringify(nextProps.data.outputs) &&
      prevProps.data.isUserAdded === nextProps.data.isUserAdded &&
      prevProps.data.isFromLibrary === nextProps.data.isFromLibrary
    )
  },
)

ModuleNode.displayName = "ModuleNode"

export { ModuleNode }
