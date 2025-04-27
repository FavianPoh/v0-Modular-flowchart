"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeTypes,
  Panel,
  MarkerType,
  type Node,
} from "reactflow"
import "reactflow/dist/style.css"
import { Plus, Save, RotateCcw, ZoomIn, Link, RefreshCw, Code, Library } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { initialNodes, initialEdges } from "@/lib/initial-flow-data"
import { ModuleNode } from "@/components/module-node"
import { ModuleDetails } from "@/components/module-details"
import { ConnectionPanel } from "@/components/connection-panel"
import { createNewModule } from "@/lib/module-utils"
import { recalculateFlowchart } from "@/lib/recalculation-utils"
import { InputManager } from "@/components/input-manager"
import { FormulaBuilder } from "@/components/formula-builder"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CodeExportDialog } from "@/components/code-export-dialog"
import { ModuleLibrary, type ModuleLibraryItem } from "@/components/module-library"

const nodeTypes: NodeTypes = {
  moduleNode: ModuleNode,
}

const STORAGE_KEY = "modular-flowchart-data"

// This is the inner component that uses ReactFlow hooks
function FlowChart() {
  // Refs to prevent update loops
  const initialLoadComplete = useRef(false)
  const isRecalculatingRef = useRef(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<any[]>([])
  const edgesRef = useRef<any[]>([])
  const autoRecalculateRef = useRef(true)
  const pendingRecalculationRef = useRef(false)
  const isInitialRenderRef = useRef(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const skipEffectsRef = useRef(true)
  const updateNodeDataTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Add delete handler to initial nodes
  const initialNodesWithHandlers = initialNodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onDelete: (nodeId: string) => deleteNode(nodeId),
      onCancel: (nodeId: string) => cancelModule(nodeId),
    },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isAddingModule, setIsAddingModule] = useState(false)
  const [isManagingConnections, setIsManagingConnections] = useState(false)
  const [isExportingCode, setIsExportingCode] = useState(false)
  const [isModuleLibraryOpen, setIsModuleLibraryOpen] = useState(false)
  const [newModuleType, setNewModuleType] = useState("math")
  const [newModuleName, setNewModuleName] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [newModuleInputs, setNewModuleInputs] = useState<Record<string, any>>({ a: 0, b: 0 })
  const [newModuleFormula, setNewModuleFormula] = useState("")
  const [newModuleFunctionCode, setNewModuleFunctionCode] = useState(
    "return { result: Number(inputs.a) + Number(inputs.b) };",
  )
  const [autoRecalculate, setAutoRecalculate] = useState(true)
  const [needsRecalculation, setNeedsRecalculation] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  // Update refs when state changes - use a single effect to minimize renders
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
    autoRecalculateRef.current = autoRecalculate
  }, [nodes, edges, autoRecalculate])

  // Load saved data from localStorage on initial render
  useEffect(() => {
    // Skip if not initial render
    if (!isInitialRenderRef.current) return
    isInitialRenderRef.current = false

    const loadData = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY)
        if (savedData) {
          const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData)

          // Add delete handler to saved nodes
          const nodesWithHandlers = savedNodes.map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: (nodeId: string) => deleteNode(nodeId),
              onCancel: (nodeId: string) => cancelModule(nodeId), // Add cancel handler
              // Recreate function from functionCode
              function: node.data.functionCode ? new Function("inputs", node.data.functionCode) : undefined,
            },
          }))

          setNodes(nodesWithHandlers)
          setEdges(savedEdges)
        } else {
          // If no saved data, use initial data
          setNodes(initialNodesWithHandlers)
          setEdges(initialEdges)
        }

        // Mark as initialized but delay enabling auto-recalculation
        setIsInitialized(true)

        // Set a timeout to enable auto-recalculation after initial render is complete
        setTimeout(() => {
          initialLoadComplete.current = true
          skipEffectsRef.current = false
        }, 2000)
      } catch (error) {
        console.error("Error loading saved data:", error)
        // Fallback to initial data
        setNodes(initialNodesWithHandlers)
        setEdges(initialEdges)
        setIsInitialized(true)

        setTimeout(() => {
          initialLoadComplete.current = true
          skipEffectsRef.current = false
        }, 2000)
      }
    }

    // Delay loading to ensure component is fully mounted
    setTimeout(loadData, 500)
  }, [])

  // Save data to localStorage - completely separated from render cycle
  const saveFlowchartData = useCallback(() => {
    if (!isInitialized || !initialLoadComplete.current || isSavingRef.current) return

    try {
      isSavingRef.current = true
      // Create a clean version of nodes without circular references
      const nodesToSave = nodesRef.current.map((node) => ({
        ...node,
        data: {
          ...node.data,
          // Don't save the function itself, just the code
          function: undefined,
        },
      }))

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes: nodesToSave, edges: edgesRef.current }))
      isSavingRef.current = false
    } catch (error) {
      console.error("Error saving data:", error)
      isSavingRef.current = false
    }
  }, [isInitialized])

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(saveFlowchartData, 1000)
  }, [saveFlowchartData])

  // Trigger save when nodes or edges change - with safeguards
  useEffect(() => {
    if (skipEffectsRef.current || !isInitialized || !initialLoadComplete.current) return
    debouncedSave()
  }, [nodes, edges, debouncedSave, isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (updateNodeDataTimeoutRef.current) {
        clearTimeout(updateNodeDataTimeoutRef.current)
      }
    }
  }, [])

  // Listen for custom selectNode events
  useEffect(() => {
    const handleSelectNode = (event: any) => {
      const { nodeId } = event.detail
      if (nodeId) {
        setSelectedNode(nodeId)

        // Also center the view on this node
        const node = nodes.find((n) => n.id === nodeId)
        if (node && reactFlowWrapper.current?.reactFlowInstance) {
          reactFlowWrapper.current.reactFlowInstance.setCenter(
            node.position.x + 100, // Add offset to center the node
            node.position.y + 100,
            { duration: 800 }, // Smooth animation
          )
        }
      }
    }

    document.addEventListener("selectNode", handleSelectNode)
    return () => {
      document.removeEventListener("selectNode", handleSelectNode)
    }
  }, [nodes, setSelectedNode])

  // Recalculate the flowchart when needed - completely separated from render cycle
  const recalculate = useCallback(() => {
    if (isRecalculatingRef.current) {
      pendingRecalculationRef.current = true
      return
    }

    isRecalculatingRef.current = true
    setNeedsRecalculation(false)

    // Use setTimeout to completely break out of the render cycle
    setTimeout(() => {
      try {
        const currentNodes = nodesRef.current
        const currentEdges = edgesRef.current

        const updatedNodes = recalculateFlowchart(currentNodes, currentEdges)

        // Only update if there are actual changes
        if (updatedNodes !== currentNodes) {
          setNodes(updatedNodes)
        }

        toast({
          title: "Flowchart recalculated",
          description: "All module values have been updated",
          duration: 2000,
        })
      } catch (error) {
        console.error("Error during recalculation:", error)
      } finally {
        // Always reset the flag
        isRecalculatingRef.current = false

        // If there's a pending recalculation, do it now
        if (pendingRecalculationRef.current) {
          pendingRecalculationRef.current = false
          setTimeout(recalculate, 0)
        }
      }
    }, 0)
  }, [setNodes, toast])

  // Trigger recalculation when needed - with safeguards
  useEffect(() => {
    if (
      skipEffectsRef.current ||
      !initialLoadComplete.current ||
      isRecalculatingRef.current ||
      !needsRecalculation ||
      !autoRecalculateRef.current
    )
      return

    const timer = setTimeout(() => {
      recalculate()
    }, 500)

    return () => clearTimeout(timer)
  }, [needsRecalculation, recalculate])

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }

      setEdges((eds) => addEdge(newEdge, eds))

      // Delay setting needsRecalculation to prevent immediate recalculation
      setTimeout(() => {
        setNeedsRecalculation(true)
      }, 0)

      if (!autoRecalculate) {
        toast({
          title: "Connection added",
          description: "Click 'Recalculate' to update module values",
        })
      }
    },
    [setEdges, autoRecalculate, toast],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node.id)
  }, [])

  // Delete a node and its connected edges
  const deleteNode = useCallback(
    (nodeId: string) => {
      // Remove all edges connected to this node
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))

      // Remove the node
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))

      // If the deleted node was selected, clear selection
      if (selectedNode === nodeId) {
        setSelectedNode(null)
      }

      // Delay setting needsRecalculation to prevent immediate recalculation
      setTimeout(() => {
        setNeedsRecalculation(true)
      }, 0)

      toast({
        title: "Module deleted",
        description: "Module and its connections have been removed",
      })
    },
    [setEdges, setNodes, selectedNode, toast],
  )

  // Cancel a module (for user-added modules)
  const cancelModule = useCallback(
    (nodeId: string) => {
      // Find the node
      const node = nodes.find((n) => n.id === nodeId)
      if (!node || !node.data.isUserAdded) return

      // Reset the node to its default state
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                inputs: { ...n.data.defaultInputs },
                needsRecalculation: true,
              },
            }
          }
          return n
        }),
      )

      // Delay setting needsRecalculation to prevent immediate recalculation
      setTimeout(() => {
        setNeedsRecalculation(true)
      }, 0)

      toast({
        title: "Module reset",
        description: "Module has been reset to its default state",
      })
    },
    [nodes, setNodes, toast],
  )

  const handleFormulaChange = (formula: string, functionCode: string) => {
    // Only update if the values have actually changed
    if (newModuleFormula !== formula || newModuleFunctionCode !== functionCode) {
      setNewModuleFormula(formula)
      setNewModuleFunctionCode(functionCode)
    }
  }

  const handleAddModule = () => {
    if (!newModuleName.trim()) {
      toast({
        title: "Module name required",
        description: "Please provide a name for your module",
        variant: "destructive",
      })
      return
    }

    // Create a new module with custom inputs and function
    const newNode = createNewModule(
      newModuleType,
      newModuleName,
      nodes,
      newModuleDescription,
      newModuleInputs,
      newModuleFunctionCode,
    )

    // Mark as user-added and add delete handler
    newNode.data.isUserAdded = true
    newNode.data.onDelete = deleteNode
    newNode.data.onCancel = cancelModule

    setNodes((nds) => [...nds, newNode])
    setIsAddingModule(false)
    setNewModuleName("")
    setNewModuleDescription("")
    setNewModuleInputs({ a: 0, b: 0 })
    setNewModuleFormula("")
    setNewModuleFunctionCode("return { result: Number(inputs.a) + Number(inputs.b) };")
    setActiveTab("basic")

    toast({
      title: "Module added",
      description: `${newModuleName} has been added to the flowchart`,
    })
  }

  // Add a module from the library
  const handleAddFromLibrary = (moduleItem: ModuleLibraryItem) => {
    // Create inputs object from the library item
    const inputs = { ...moduleItem.inputs }

    // Create a new module
    const newNode = createNewModule(
      moduleItem.type,
      moduleItem.name,
      nodes,
      moduleItem.description,
      inputs,
      moduleItem.functionCode,
    )

    // Mark as from library and add handlers
    newNode.data.isFromLibrary = true
    newNode.data.onDelete = deleteNode
    newNode.data.onCancel = cancelModule

    setNodes((nds) => [...nds, newNode])

    toast({
      title: "Module added from library",
      description: `${moduleItem.name} has been added to the flowchart`,
    })
  }

  const handleSaveFlowchart = () => {
    try {
      saveFlowchartData()
      toast({
        title: "Flowchart saved",
        description: "Your flowchart has been saved successfully",
      })
    } catch (error) {
      console.error("Error saving flowchart:", error)
      toast({
        title: "Save failed",
        description: "There was an error saving your flowchart",
        variant: "destructive",
      })
    }
  }

  const handleResetFlowchart = () => {
    // Reset to initial state but ensure all nodes have the delete handler
    setNodes(
      initialNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: deleteNode,
          onCancel: cancelModule,
        },
      })),
    )
    setEdges(initialEdges)
    setSelectedNode(null)
    setNeedsRecalculation(false)

    toast({
      title: "Flowchart reset",
      description: "Your flowchart has been reset to the initial state",
    })
  }

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      // Clear any existing timeout
      if (updateNodeDataTimeoutRef.current) {
        clearTimeout(updateNodeDataTimeoutRef.current)
      }

      // Use timeout to batch updates and prevent cascading renders
      updateNodeDataTimeoutRef.current = setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                  onDelete: deleteNode, // Ensure delete handler is preserved
                  onCancel: cancelModule, // Ensure cancel handler is preserved
                },
              }
            }
            return node
          }),
        )

        // Delay setting needsRecalculation to prevent immediate recalculation
        setTimeout(() => {
          setNeedsRecalculation(true)
        }, 0)

        if (!autoRecalculate) {
          toast({
            title: "Module updated",
            description: "Click 'Recalculate' to update dependent modules",
          })
        }
      }, 0)
    },
    [setNodes, deleteNode, cancelModule, autoRecalculate, toast],
  )

  const closeDetails = () => {
    setSelectedNode(null)
  }

  const fitView = () => {
    const reactFlowInstance = reactFlowWrapper.current?.reactFlowInstance
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 })
    }
  }

  // Add a custom connection between modules
  const handleAddConnection = useCallback(
    (sourceId: string, sourceHandle: string, targetId: string, targetHandle: string) => {
      const newEdge = {
        id: `e${sourceId}-${targetId}-${Date.now()}`,
        source: sourceId,
        sourceHandle: sourceHandle,
        target: targetId,
        targetHandle: targetHandle,
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      }

      setEdges((eds) => [...eds, newEdge])

      // Delay setting needsRecalculation to prevent immediate recalculation
      setTimeout(() => {
        setNeedsRecalculation(true)
      }, 0)

      toast({
        title: "Connection added",
        description: autoRecalculate
          ? "Modules will be updated automatically"
          : "Click 'Recalculate' to update module values",
      })
    },
    [setEdges, autoRecalculate, toast],
  )

  // Delete a connection
  const handleDeleteConnection = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId))

      // Delay setting needsRecalculation to prevent immediate recalculation
      setTimeout(() => {
        setNeedsRecalculation(true)
      }, 0)

      toast({
        title: "Connection removed",
        description: autoRecalculate
          ? "Modules will be updated automatically"
          : "Click 'Recalculate' to update module values",
      })
    },
    [setEdges, autoRecalculate, toast],
  )

  // Handle auto-recalculate toggle without triggering immediate recalculation
  const handleAutoRecalculateChange = (checked: boolean) => {
    setAutoRecalculate(checked)
    // Don't trigger recalculation immediately
  }

  // Handle import flowchart from code
  const handleImportFlowchart = (importedNodes: Node[], importedEdges: Edge[]) => {
    // Add delete and cancel handlers to imported nodes
    const nodesWithHandlers = importedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onDelete: (nodeId: string) => deleteNode(nodeId),
        onCancel: (nodeId: string) => cancelModule(nodeId),
      },
    }))

    setNodes(nodesWithHandlers)
    setEdges(importedEdges)

    // Delay setting needsRecalculation to prevent immediate recalculation
    setTimeout(() => {
      setNeedsRecalculation(true)
    }, 0)
  }

  // Update the onAddNode function in modular-flowchart.tsx to mark user-added modules

  const onAddNode = useCallback(
    (moduleTemplate: any) => {
      const newNode: any = {
        id: `module_${Date.now()}`,
        type: "moduleNode",
        position: { x: 100, y: 100 },
        data: {
          ...moduleTemplate,
          label: moduleTemplate.label || "New Module",
          isUserAdded: true, // Mark this module as user-added
          inputs: [],
          formula: "",
          value: null,
          onDelete: deleteNode,
          onCancel: cancelModule,
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setSelectedNode(newNode.id)
    },
    [setNodes, setSelectedNode, deleteNode, cancelModule],
  )

  return (
    <>
      <div className="h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          onInit={(instance) => {
            if (reactFlowWrapper.current) {
              reactFlowWrapper.current.reactFlowInstance = instance
            }
          }}
          defaultEdgeOptions={{
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          }}
        >
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => {
              switch (n.data.type) {
                case "input":
                  return "#3b82f6"
                case "output":
                  return "#e11d48"
                case "math":
                  return "#22c55e"
                case "filter":
                  return "#f59e0b"
                default:
                  return "#94a3b8"
              }
            }}
            nodeColor={(n) => {
              if (n.data.isUserAdded || n.data.isFromLibrary) {
                return "#f0f9ff" // Light blue background for user-added modules
              }

              switch (n.data.type) {
                case "input":
                  return "#dbeafe"
                case "output":
                  return "#ffe4e6"
                case "math":
                  return "#dcfce7"
                case "filter":
                  return "#fef3c7"
                default:
                  return "#f1f5f9"
              }
            }}
          />
          <Background variant="dots" gap={12} size={1} />

          {/* Legend for module colors */}
          <Panel position="bottom-left" className="bg-white p-2 rounded-md shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm border-2 border-blue-400 bg-blue-50"></div>
                      <span>User-added</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Modules you have added to the flowchart</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-blue-100"></div>
                <span>Input</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-green-100"></div>
                <span>Math</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-amber-100"></div>
                <span>Filter</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-rose-100"></div>
                <span>Output</span>
              </div>
            </div>
          </Panel>

          {/* Top panel with auto-recalculate toggle */}
          <Panel position="top-left" className="flex items-center gap-2 bg-white p-2 rounded-md shadow-sm">
            <div className="flex items-center space-x-2">
              <Switch id="auto-recalculate" checked={autoRecalculate} onCheckedChange={handleAutoRecalculateChange} />
              <Label htmlFor="auto-recalculate" className="text-sm">
                Auto-recalculate
              </Label>
            </div>

            {!autoRecalculate && (
              <Button
                variant={needsRecalculation ? "default" : "outline"}
                size="sm"
                className="gap-1"
                onClick={recalculate}
                disabled={isRecalculatingRef.current}
              >
                <RefreshCw className={`h-4 w-4 ${isRecalculatingRef.current ? "animate-spin" : ""}`} />
                Recalculate
                {needsRecalculation && <span className="ml-1 bg-red-500 rounded-full w-2 h-2"></span>}
              </Button>
            )}
          </Panel>

          {/* Right panel with actions */}
          <Panel position="top-right" className="flex gap-2">
            <Dialog open={isAddingModule} onOpenChange={setIsAddingModule}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" /> Add Module
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Module</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="formula">Formula</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4 mt-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="module-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="module-name"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="module-type" className="text-right">
                        Type
                      </Label>
                      <Select value={newModuleType} onValueChange={setNewModuleType}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select module type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="input">Input</SelectItem>
                          <SelectItem value="math">Math</SelectItem>
                          <SelectItem value="logic">Logic</SelectItem>
                          <SelectItem value="transform">Transform</SelectItem>
                          <SelectItem value="filter">Filter</SelectItem>
                          <SelectItem value="output">Output</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label htmlFor="module-description" className="text-right pt-2">
                        Description
                      </Label>
                      <Textarea
                        id="module-description"
                        value={newModuleDescription}
                        onChange={(e) => setNewModuleDescription(e.target.value)}
                        placeholder="Describe what this module does"
                        className="col-span-3"
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inputs" className="space-y-4 mt-4">
                    <InputManager inputs={newModuleInputs} onChange={setNewModuleInputs} />
                  </TabsContent>

                  <TabsContent value="formula" className="space-y-4 mt-4">
                    <FormulaBuilder
                      inputs={newModuleInputs}
                      initialFormula={newModuleFormula}
                      functionCode={newModuleFunctionCode}
                      onChange={handleFormulaChange}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (activeTab === "basic") {
                        setIsAddingModule(false)
                      } else if (activeTab === "inputs") {
                        setActiveTab("basic")
                      } else if (activeTab === "formula") {
                        setActiveTab("inputs")
                      }
                    }}
                  >
                    {activeTab === "basic" ? "Cancel" : "Back"}
                  </Button>

                  <Button
                    onClick={() => {
                      if (activeTab === "basic") {
                        setActiveTab("inputs")
                      } else if (activeTab === "inputs") {
                        setActiveTab("formula")
                      } else if (activeTab === "formula") {
                        handleAddModule()
                      }
                    }}
                  >
                    {activeTab === "formula" ? "Add Module" : "Next"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="gap-2" onClick={() => setIsModuleLibraryOpen(true)}>
              <Library className="h-4 w-4" /> Module Library
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setIsManagingConnections(true)}>
              <Link className="h-4 w-4" /> Connections
            </Button>

            <Button variant="outline" className="gap-2" onClick={() => setIsExportingCode(true)}>
              <Code className="h-4 w-4" /> Export Code
            </Button>

            <Button variant="outline" className="gap-2" onClick={handleSaveFlowchart}>
              <Save className="h-4 w-4" /> Save
            </Button>

            <Button variant="outline" className="gap-2" onClick={handleResetFlowchart}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>

            <Button variant="outline" className="gap-2" onClick={fitView}>
              <ZoomIn className="h-4 w-4" /> Fit View
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <ModuleDetails
          nodeId={selectedNode}
          nodes={nodes}
          edges={edges}
          updateNodeData={updateNodeData}
          onClose={closeDetails}
        />
      )}

      <ConnectionPanel
        isOpen={isManagingConnections}
        onClose={() => setIsManagingConnections(false)}
        nodes={nodes}
        edges={edges}
        onAddConnection={handleAddConnection}
        onDeleteConnection={handleDeleteConnection}
      />

      <CodeExportDialog
        isOpen={isExportingCode}
        onClose={() => setIsExportingCode(false)}
        nodes={nodes}
        edges={edges}
      />

      <ModuleLibrary
        isOpen={isModuleLibraryOpen}
        onClose={() => setIsModuleLibraryOpen(false)}
        onAddModule={handleAddFromLibrary}
        currentNodes={nodes}
      />
    </>
  )
}

// This is the main component that wraps everything with ReactFlowProvider
export default function ModularFlowchart() {
  return (
    <div className="h-[calc(100vh-80px)] w-full">
      <ReactFlowProvider>
        <FlowChart />
      </ReactFlowProvider>
    </div>
  )
}
