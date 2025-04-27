"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeModule } from "@/lib/module-utils"
import { RotateCcw, Code, Settings, Activity, Info, ArrowRight, RefreshCw, FileText, BarChart2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InputManager } from "@/components/input-manager"
import { FormulaBuilder } from "@/components/formula-builder"
import { MetricDrilldown } from "@/components/metric-drilldown"

interface ModuleDetailsProps {
  nodeId: string
  nodes: any[]
  edges: any[]
  updateNodeData: (nodeId: string, newData: any) => void
  onClose: () => void
}

export function ModuleDetails({ nodeId, nodes, edges, updateNodeData, onClose }: ModuleDetailsProps) {
  const node = nodes.find((n) => n.id === nodeId)
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [functionCode, setFunctionCode] = useState("")
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const [needsRecalculation, setNeedsRecalculation] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [initialFormula, setInitialFormula] = useState<string>("")
  const [isMetricDrilldownOpen, setIsMetricDrilldownOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>("")

  // Refs to prevent update loops
  const isUpdatingRef = useRef(false)
  const initializedRef = useRef(false)
  const nodeIdRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFunctionCodeRef = useRef<string>("")

  // Find connected nodes (both incoming and outgoing)
  const connectedNodes = nodes.filter((n) => {
    // Check if this node is connected to our current node
    const isConnected =
      n.id !== nodeId &&
      // Check if any of this node's inputs come from our node
      (Object.keys(n.data.inputs || {}).some((input) =>
        Object.keys(node?.data.outputs || {}).some(
          (output) =>
            // This would require checking edges, but for simplicity we'll just check if the names match
            input === output,
        ),
      ) ||
        // Check if any of our node's inputs come from this node
        Object.keys(node?.data.inputs || {}).some((input) =>
          Object.keys(n.data.outputs || {}).some(
            (output) =>
              // This would require checking edges, but for simplicity we'll just check if the names match
              input === output,
          ),
        ))
    return isConnected
  })

  // Reset state when nodeId changes
  useEffect(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Reset initialization flag when nodeId changes
    if (nodeIdRef.current !== nodeId) {
      nodeIdRef.current = nodeId
      initializedRef.current = false

      // Reset state
      setInputs({})
      setFunctionCode("")
      setOutputs({})
      setNeedsRecalculation(false)
      setInitialFormula("")
      lastFunctionCodeRef.current = ""
    }
  }, [nodeId])

  // Initialize component with node data
  useEffect(() => {
    if (!node || initializedRef.current) return

    // Use a timeout to ensure we don't initialize during an update cycle
    timeoutRef.current = setTimeout(() => {
      try {
        initializedRef.current = true

        // Set initial state from node data
        setInputs({ ...node.data.inputs })
        setFunctionCode(node.data.functionCode || "")
        setOutputs(executeModule(node.data))
        setNeedsRecalculation(node.data.needsRecalculation || false)
        lastFunctionCodeRef.current = node.data.functionCode || ""

        // Extract formula from functionCode - only once
        if (node.data.functionCode) {
          const match = node.data.functionCode.match(/return\s*{\s*[a-zA-Z0-9_]+:\s*(.*?)\s*};/)
          if (match && match[1]) {
            setInitialFormula(match[1])
          }
        }
      } catch (error) {
        console.error("Error initializing module details:", error)
      }
    }, 0)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [node])

  // Debounced function to update node data
  const debouncedUpdateNodeData = useCallback(
    (data: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (!isUpdatingRef.current) {
          try {
            isUpdatingRef.current = true
            updateNodeData(nodeId, data)

            // Reset flag after a delay to ensure we don't trigger another update too soon
            setTimeout(() => {
              isUpdatingRef.current = false
            }, 100)
          } catch (error) {
            console.error("Error updating node data:", error)
            isUpdatingRef.current = false
          }
        }
      }, 300)
    },
    [nodeId, updateNodeData],
  )

  const handleInputChange = useCallback(
    (newInputs: Record<string, any>) => {
      if (isUpdatingRef.current) return

      // Update local state immediately
      setInputs(newInputs)

      // Debounce the node data update
      debouncedUpdateNodeData({
        inputs: newInputs,
        defaultInputs: newInputs,
        needsRecalculation: true,
      })

      // Recalculate outputs for this node only
      if (node) {
        const updatedNode = { ...node, data: { ...node.data, inputs: newInputs } }
        setOutputs(executeModule(updatedNode.data))
      }
    },
    [node, debouncedUpdateNodeData],
  )

  const handleFunctionCodeChange = useCallback(
    (formula: string, code: string) => {
      if (isUpdatingRef.current) return

      // Only update if the code has actually changed
      if (lastFunctionCodeRef.current === code) return

      // Update local state
      setFunctionCode(code)
      lastFunctionCodeRef.current = code

      try {
        // Create a new function from the code
        const newFunction = new Function("inputs", code)

        // Debounce the node data update
        debouncedUpdateNodeData({
          function: newFunction,
          functionCode: code,
          needsRecalculation: true,
        })

        // Recalculate outputs
        if (node) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              function: newFunction,
              functionCode: code,
            },
          }
          setOutputs(executeModule(updatedNode.data))
        }
      } catch (error) {
        console.error("Error creating function:", error)
      }
    },
    [node, debouncedUpdateNodeData],
  )

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isUpdatingRef.current) return

      const code = e.target.value

      // Only update if the code has actually changed
      if (lastFunctionCodeRef.current === code) return

      // Update local state
      setFunctionCode(code)
      lastFunctionCodeRef.current = code

      try {
        // Create a new function from the code
        const newFunction = new Function("inputs", code)

        // Debounce the node data update
        debouncedUpdateNodeData({
          function: newFunction,
          functionCode: code,
          needsRecalculation: true,
        })

        // Recalculate outputs
        if (node) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              function: newFunction,
              functionCode: code,
            },
          }
          setOutputs(executeModule(updatedNode.data))
        }
      } catch (error) {
        console.error("Error creating function:", error)
      }
    },
    [node, debouncedUpdateNodeData],
  )

  const resetInputs = useCallback(() => {
    if (!node || !node.data.defaultInputs || isUpdatingRef.current) return

    // Update local state
    setInputs({ ...node.data.defaultInputs })

    // Debounce the node data update
    debouncedUpdateNodeData({
      inputs: { ...node.data.defaultInputs },
      needsRecalculation: true,
    })

    // Recalculate outputs
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        inputs: { ...node.data.defaultInputs },
      },
    }
    setOutputs(executeModule(updatedNode.data))
  }, [node, debouncedUpdateNodeData])

  // Generate a plain English explanation of what the code does
  const generateExplanation = (code: string) => {
    if (!code) return "This module doesn't have any code defined."

    // Simple explanation based on code patterns
    if (code.includes("return { result:")) {
      const match = code.match(/return\s*{\s*result:\s*(.*?)\s*}/)
      if (match && match[1]) {
        return `This module calculates a result using the formula: ${match[1]}`
      }
    }

    // Check for common operations
    let explanation = "This module "

    if (code.includes("+")) explanation += "adds values"
    else if (code.includes("-")) explanation += "subtracts values"
    else if (code.includes("*")) explanation += "multiplies values"
    else if (code.includes("/")) explanation += "divides values"
    else if (code.includes("Math.")) explanation += "performs mathematical operations"
    else if (code.includes("if") && code.includes("else")) explanation += "performs conditional logic"
    else if (code.includes("filter")) explanation += "filters data"
    else if (code.includes("map")) explanation += "transforms data"
    else explanation += "processes inputs and produces outputs"

    // Add info about inputs used
    const inputsUsed = Object.keys(inputs).filter((input) => code.includes(`inputs.${input}`))
    if (inputsUsed.length > 0) {
      explanation += ` using the following inputs: ${inputsUsed.join(", ")}`
    }

    return explanation + "."
  }

  // Get the type color for badges
  const getTypeColor = (type: string) => {
    switch (type) {
      case "input":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "math":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "logic":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "filter":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      case "transform":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
      case "output":
        return "bg-rose-100 text-rose-800 hover:bg-rose-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Open metric drilldown for a specific metric
  const openMetricDrilldown = (metric: string) => {
    setSelectedMetric(metric)
    setIsMetricDrilldownOpen(true)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (!node) return null

  // Determine if this is a user-added module
  const isUserAdded = node.data.isUserAdded === true

  return (
    <>
      <Sheet open={!!nodeId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <SheetTitle>{node.data.label}</SheetTitle>
              <Badge className={getTypeColor(node.data.type)}>
                {node.data.type.charAt(0).toUpperCase() + node.data.type.slice(1)}
              </Badge>
              {node.data.isUserAdded && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  User-added
                </Badge>
              )}
              {needsRecalculation && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Needs recalculation
                </Badge>
              )}
            </div>
            <SheetDescription>{node.data.description}</SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="inputs" className="flex items-center gap-2">
                <Settings className="h-4 w-4" /> Inputs
              </TabsTrigger>
              <TabsTrigger value="formula" className="flex items-center gap-2">
                <Code className="h-4 w-4" /> Formula
              </TabsTrigger>
              <TabsTrigger value="outputs" className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Outputs
              </TabsTrigger>
              <TabsTrigger value="explanation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Explanation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Module Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{node.data.description}</p>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Data Flow</h4>
                    <div className="bg-slate-50 p-3 rounded-md">
                      <div className="flex flex-col gap-2">
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Inputs:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.keys(inputs).map((key) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-center my-1">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Outputs:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.keys(outputs).map((key) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {connectedNodes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Connected Modules</h4>
                      <div className="grid gap-2">
                        {connectedNodes.map((connectedNode) => (
                          <div key={connectedNode.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                            <Badge className={getTypeColor(connectedNode.data.type)} variant="secondary">
                              {connectedNode.data.type}
                            </Badge>
                            <span className="text-sm">{connectedNode.data.label}</span>
                            {connectedNode.data.isUserAdded && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                User-added
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Function Summary</h4>
                    <div className="bg-slate-50 p-3 rounded-md">
                      <code className="text-xs whitespace-pre-wrap">
                        {node.data.functionCode.split("\n").slice(0, 3).join("\n")}
                        {node.data.functionCode.split("\n").length > 3 ? "..." : ""}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4 mt-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">Module Inputs</h3>
                <Button variant="outline" size="sm" onClick={resetInputs} className="flex items-center gap-2">
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              </div>

              <InputManager inputs={inputs} onChange={handleInputChange} />
            </TabsContent>

            <TabsContent value="formula" className="space-y-4 mt-4">
              <Tabs defaultValue={isUserAdded ? "builder" : "code"}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                  <TabsTrigger value="code">{isUserAdded ? "Raw Code" : "Code (Read-only)"}</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="mt-4">
                  <FormulaBuilder
                    inputs={inputs}
                    initialFormula={initialFormula}
                    functionCode={functionCode}
                    onChange={handleFunctionCodeChange}
                    readOnly={!isUserAdded}
                  />
                </TabsContent>

                <TabsContent value="code" className="mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="function-code">Module Function</Label>
                    <Textarea
                      id="function-code"
                      value={functionCode}
                      onChange={isUserAdded ? handleCodeChange : undefined}
                      readOnly={!isUserAdded}
                      className={`font-mono text-sm h-[300px] ${!isUserAdded ? "bg-slate-50" : ""}`}
                      placeholder="// Return an object with your outputs
return {
  result: inputs.a + inputs.b
};"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {isUserAdded ? (
                      <p>Write a function that takes the inputs object and returns an outputs object.</p>
                    ) : (
                      <p>This is a pre-defined module. The code cannot be modified.</p>
                    )}
                    <p className="mt-1">
                      Example:{" "}
                      <code>
                        return {"{"} result: Number(inputs.a) + Number(inputs.b) {"}"}
                      </code>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="outputs" className="space-y-4 mt-4">
              <div className="flex justify-between mb-4">
                <h3 className="text-sm font-medium">Module Outputs</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOutputs(executeModule(node.data))}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-3 w-3" /> Recalculate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMetricDrilldownOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <BarChart2 className="h-3 w-3" /> Metric Analysis
                  </Button>
                </div>
              </div>

              {Object.entries(outputs).length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center bg-slate-50 rounded-md">
                  No outputs available. Try recalculating the module.
                </div>
              ) : (
                Object.entries(outputs).map(([key, value]) => (
                  <Card
                    key={key}
                    className="hover:border-primary cursor-pointer"
                    onClick={() => openMetricDrilldown(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{key}</span>
                        <span className="font-mono">{String(value)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Click to analyze metric dependencies</div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="explanation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">What This Module Does</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{generateExplanation(functionCode)}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-md">
                    <h4 className="text-sm font-medium mb-2">In Simple Terms:</h4>
                    <p className="text-sm">
                      This {node.data.type} module takes {Object.keys(inputs).length} input
                      {Object.keys(inputs).length !== 1 ? "s" : ""} and produces {Object.keys(outputs).length} output
                      {Object.keys(outputs).length !== 1 ? "s" : ""}.
                    </p>

                    {Object.keys(inputs).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">It uses these inputs:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {Object.entries(inputs).map(([key, value]) => (
                            <li key={key}>
                              <span className="font-medium">{key}</span>: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Object.keys(outputs).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">And produces these outputs:</p>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {Object.entries(outputs).map(([key, value]) => (
                            <li key={key}>
                              <span className="font-medium">{key}</span>: {String(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <MetricDrilldown
        isOpen={isMetricDrilldownOpen}
        onClose={() => setIsMetricDrilldownOpen(false)}
        nodes={nodes}
        edges={edges}
        selectedNodeId={nodeId}
        selectedMetric={selectedMetric}
      />
    </>
  )
}
