"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeModule } from "@/lib/module-utils"
import { RotateCcw, Code, Settings, Activity, Info, ArrowRight, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InputManager } from "@/components/input-manager"
import { FormulaBuilder } from "@/components/formula-builder"

interface ModuleDetailsProps {
  nodeId: string
  nodes: any[]
  updateNodeData: (nodeId: string, newData: any) => void
  onClose: () => void
}

export function ModuleDetails({ nodeId, nodes, updateNodeData, onClose }: ModuleDetailsProps) {
  const node = nodes.find((n) => n.id === nodeId)
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [functionCode, setFunctionCode] = useState("")
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const [needsRecalculation, setNeedsRecalculation] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

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

  useEffect(() => {
    if (node) {
      setInputs({ ...node.data.inputs })
      setFunctionCode(node.data.functionCode || "")
      setOutputs(executeModule(node.data))
      setNeedsRecalculation(node.data.needsRecalculation || false)
    }
  }, [node])

  const handleInputChange = (newInputs: Record<string, any>) => {
    setInputs(newInputs)
    updateNodeData(nodeId, { inputs: newInputs, defaultInputs: newInputs, needsRecalculation: true })

    // Recalculate outputs for this node only
    const updatedNode = { ...node, data: { ...node.data, inputs: newInputs } }
    setOutputs(executeModule(updatedNode.data))
  }

  const handleFunctionCodeChange = (formula: string, code: string) => {
    setFunctionCode(code)
    updateNodeData(nodeId, { functionCode: code, needsRecalculation: true })

    try {
      // Create a new function from the code
      const newFunction = new Function("inputs", code)
      updateNodeData(nodeId, { function: newFunction, functionCode: code, needsRecalculation: true })

      // Recalculate outputs
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          function: newFunction,
          functionCode: code,
        },
      }
      setOutputs(executeModule(updatedNode.data))
    } catch (error) {
      console.error("Error updating function:", error)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value
    setFunctionCode(code)

    try {
      // Create a new function from the code
      const newFunction = new Function("inputs", code)
      updateNodeData(nodeId, { function: newFunction, functionCode: code, needsRecalculation: true })

      // Recalculate outputs
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          function: newFunction,
          functionCode: code,
        },
      }
      setOutputs(executeModule(updatedNode.data))
    } catch (error) {
      console.error("Error updating function:", error)
    }
  }

  const resetInputs = () => {
    if (node && node.data.defaultInputs) {
      setInputs({ ...node.data.defaultInputs })
      updateNodeData(nodeId, { inputs: { ...node.data.defaultInputs }, needsRecalculation: true })

      // Recalculate outputs
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          inputs: { ...node.data.defaultInputs },
        },
      }
      setOutputs(executeModule(updatedNode.data))
    }
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

  if (!node) return null

  return (
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
          <TabsList className="grid grid-cols-4">
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
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetInputs} className="flex items-center gap-2">
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            </div>

            <InputManager inputs={inputs} onChange={handleInputChange} />
          </TabsContent>

          <TabsContent value="formula" className="space-y-4 mt-4">
            <Tabs defaultValue="builder">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                <TabsTrigger value="code">Raw Code</TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="mt-4">
                <FormulaBuilder inputs={inputs} initialFormula={functionCode} onChange={handleFunctionCodeChange} />
              </TabsContent>

              <TabsContent value="code" className="mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="function-code">Module Function</Label>
                  <Textarea
                    id="function-code"
                    value={functionCode}
                    onChange={handleCodeChange}
                    className="font-mono text-sm h-[300px]"
                    placeholder="// Return an object with your outputs
return {
  result: inputs.a + inputs.b
};"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  <p>Write a function that takes the inputs object and returns an outputs object.</p>
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
            {Object.entries(outputs).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{key}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
