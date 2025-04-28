"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, ChevronRight, Trash2, RotateCcw, RefreshCw, ChevronDown, Edit, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ModuleNode({ id, data, isConnectable }: any) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isEditingInputs, setIsEditingInputs] = useState(false)
  const [localInputs, setLocalInputs] = useState<Record<string, any>>({})
  const [localOutputs, setLocalOutputs] = useState<Record<string, any>>({})
  const prevOutputsRef = useRef<any>({})
  const nodeRef = useRef<HTMLDivElement>(null)

  // Initialize local inputs and outputs from data
  useEffect(() => {
    if (data.inputs) {
      setLocalInputs({ ...data.inputs })
    }
    if (data.outputs) {
      setLocalOutputs({ ...data.outputs })
    }
  }, [data.inputs, data.outputs])

  // Flash animation when outputs change
  useEffect(() => {
    if (!data.outputs) return

    // Check if outputs have changed
    const outputsChanged = Object.keys(data.outputs).some((key) => data.outputs[key] !== prevOutputsRef.current[key])

    if (outputsChanged) {
      // Show calculating animation
      setIsCalculating(true)

      // Reset after animation completes
      setTimeout(() => {
        setIsCalculating(false)
        // Update reference to current outputs
        prevOutputsRef.current = { ...data.outputs }
      }, 500)
    }
  }, [data.outputs])

  // Get color based on module type
  const getNodeColor = () => {
    switch (data.type) {
      case "input":
        return "border-blue-500 border-l-4"
      case "math":
        return "border-green-500 border-l-4"
      case "logic":
        return "border-purple-500 border-l-4"
      case "filter":
        return "border-amber-500 border-l-4"
      case "transform":
        return "border-indigo-500 border-l-4"
      case "output":
        return "border-rose-500 border-l-4"
      default:
        return "border-gray-500 border-l-4"
    }
  }

  // Get badge color based on module type
  const getTypeBadgeColor = () => {
    switch (data.type) {
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

  // Handle style for heatmap mode
  const nodeStyle = data.heatmapStyle || {}

  // Find input and output handles
  const inputs = Object.keys(data.inputs || {})
  const outputs = Object.keys(data.outputs || {})

  // Handle input change in quick edit mode
  const handleInputChange = (key: string, value: any) => {
    // Convert to number if possible
    const parsedValue = !isNaN(Number.parseFloat(value)) ? Number.parseFloat(value) : value

    const newInputs = {
      ...localInputs,
      [key]: parsedValue,
    }

    setLocalInputs(newInputs)

    // Calculate new outputs locally for immediate feedback
    if (data.function) {
      try {
        const newOutputs = data.function(newInputs)
        setLocalOutputs(newOutputs)
      } catch (error) {
        console.error("Error calculating outputs:", error)
      }
    }
  }

  // Save changes to the node
  const saveChanges = () => {
    // Update the node data with new inputs
    if (data.onUpdateInputs) {
      data.onUpdateInputs(id, localInputs)
    }

    setIsEditingInputs(false)
  }

  // Check if inputs have been modified from defaults
  const areInputsModified = () => {
    if (!data.defaultInputs) return false

    return Object.keys(localInputs).some((key) => {
      if (typeof localInputs[key] === "number" && typeof data.defaultInputs[key] === "number") {
        return Math.abs(localInputs[key] - data.defaultInputs[key]) > 0.000001
      }
      return JSON.stringify(localInputs[key]) !== JSON.stringify(data.defaultInputs[key])
    })
  }

  const inputsModified = areInputsModified()

  // Open the module details dialog
  const openModuleDetails = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering other click handlers
    const event = new CustomEvent("selectNode", { detail: { nodeId: id } })
    document.dispatchEvent(event)
  }

  return (
    <div ref={nodeRef}>
      <Card
        className={`w-[320px] ${getNodeColor()} ${isCalculating ? "animate-pulse bg-blue-50" : ""}`}
        style={nodeStyle}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <CardTitle className="text-sm m-0">{data.label}</CardTitle>
              {data.needsRecalculation && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  <span className="text-xs">Needs update</span>
                </Badge>
              )}
              {isCalculating && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  <span className="text-xs">Calculating</span>
                </Badge>
              )}
            </div>

            <Badge variant="secondary" className={`text-xs ${getTypeBadgeColor()}`}>
              {data.type}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-3 pt-0 pb-2">
          <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{data.description}</div>

          {/* Always show key metrics without needing to expand */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2 bg-slate-50 p-1.5 rounded-sm">
            {Object.entries(data.outputs || {})
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{key}:</span>
                  <span className="font-mono">{typeof value === "number" ? value.toFixed(2) : String(value)}</span>
                </div>
              ))}
            {Object.keys(data.outputs || {}).length > 2 && (
              <div className="text-xs text-blue-500 col-span-2 text-center">
                + {Object.keys(data.outputs || {}).length - 2} more
              </div>
            )}
          </div>
        </CardContent>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="flex justify-center border-t border-b py-1 hover:bg-slate-50 transition-colors">
              {isExpanded ? (
                <div className="flex items-center gap-1">
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-xs">Hide details</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-xs">Show details</span>
                </div>
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-3">
              {/* Inputs section with quick edit capability */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium">Inputs:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setIsEditingInputs(!isEditingInputs)}
                  >
                    {isEditingInputs ? (
                      <>
                        <Save className="h-3 w-3 mr-1" /> Save
                      </>
                    ) : (
                      <>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </>
                    )}
                  </Button>
                </div>

                {isEditingInputs ? (
                  <div className="space-y-2">
                    {inputs.map((key) => (
                      <div key={key} className="grid grid-cols-3 gap-2 items-center">
                        <Label htmlFor={`input-${id}-${key}`} className="text-xs">
                          {key}:
                        </Label>
                        <Input
                          id={`input-${id}-${key}`}
                          value={localInputs[key]}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="h-6 text-xs col-span-2"
                        />
                      </div>
                    ))}

                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          setLocalInputs({ ...data.inputs })
                          setIsEditingInputs(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button variant="default" size="sm" className="h-6 px-2 text-xs" onClick={saveChanges}>
                        Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {inputs.map((key) => {
                      const isModified =
                        data.defaultInputs &&
                        (typeof data.inputs[key] === "number" && typeof data.defaultInputs[key] === "number"
                          ? Math.abs(data.inputs[key] - data.defaultInputs[key]) > 0.000001
                          : JSON.stringify(data.inputs[key]) !== JSON.stringify(data.defaultInputs[key]))

                      return (
                        <div key={key} className="flex justify-between text-xs">
                          <span className={`text-muted-foreground ${isModified ? "font-medium text-blue-600" : ""}`}>
                            {key}:
                          </span>
                          <span className="font-mono">
                            {typeof data.inputs[key] === "number"
                              ? data.inputs[key].toFixed(2)
                              : String(data.inputs[key])}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Formula preview */}
              {data.functionCode && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1">Formula:</p>
                  <div className="bg-slate-100 p-2 rounded text-xs font-mono overflow-x-auto whitespace-nowrap">
                    {data.functionCode.includes("return")
                      ? data.functionCode.match(/return\s*{([^}]*)}/)?.[1] || "..."
                      : "Complex formula..."}
                  </div>
                </div>
              )}

              {/* Outputs section */}
              <div>
                <p className="text-xs font-medium mb-1">Outputs:</p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {outputs.map((key) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {typeof data.outputs[key] === "number"
                          ? data.outputs[key].toFixed(2)
                          : String(data.outputs[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-3 pt-2 border-t flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    if (data.onRecalculate) {
                      data.onRecalculate(id)
                    }
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Recalculate
                </Button>

                {inputsModified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      if (data.onSaveDefaults) {
                        data.onSaveDefaults(id)
                      }
                    }}
                  >
                    <Save className="h-3 w-3 mr-1" /> Save as Default
                  </Button>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <CardFooter className="p-2 flex justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openModuleDetails}>
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View module details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {data.isUserAdded && (
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                      onClick={() => data.onCancel(id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to defaults</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => data.onDelete(id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete module</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Input handles */}
      {inputs.map((input, index) => (
        <Handle
          key={`input-${input}`}
          type="target"
          position={Position.Left}
          id={`input-${input}`}
          style={{ top: 60 + index * 20 }}
          isConnectable={isConnectable}
        />
      ))}

      {/* Output handles */}
      {outputs.map((output, index) => (
        <Handle
          key={`output-${output}`}
          type="source"
          position={Position.Right}
          id={`output-${output}`}
          style={{ top: 60 + index * 20 }}
          isConnectable={isConnectable}
        />
      ))}
    </div>
  )
}
