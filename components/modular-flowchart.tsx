"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { useNodesState, useEdgesState, addEdge, type Connection, type Edge, MarkerType } from "reactflow"
import "reactflow/dist/style.css"
import { useToast } from "@/components/ui/use-toast"
import { initialNodes, initialEdges } from "@/lib/initial-flow-data"
import { ModuleNode } from "@/components/module-node"
import { createNewModule } from "@/lib/module-utils"
import { recalculateFlowchart, executeModule } from "@/lib/recalculation-utils"
import type { ModuleLibraryItem } from "@/components/module-library"
import { ModuleDetails } from "@/components/module-details"
import { ConnectionPanel } from "@/components/connection-panel"
import { CodeExportDialog } from "@/components/code-export-dialog"
import { ModuleLibrary } from "@/components/module-library"
import { FlowchartToolbar } from "@/components/flowchart-toolbar"
import { HeatmapLegend } from "@/components/heatmap-legend"
import { SensitivityDashboard, type SimulationResult } from "@/components/sensitivity-dashboard"
import { AddModuleDialog } from "@/components/add-module-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Import ReactFlow components
import ReactFlow, { Background, Controls, MiniMap } from "reactflow"

const nodeTypes = {
  moduleNode: ModuleNode,
}

const STORAGE_KEY = "modular-flowchart-data"
const AUTO_SAVE_INTERVAL = 10000 // 10 seconds auto-save interval

// Define default edge options for thicker arrows
const defaultEdgeOptions = {
  style: { strokeWidth: 2.5, stroke: "#b1b1b7" },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#b1b1b7",
  },
  animated: true,
}

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
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const skipEffectsRef = useRef(true)
  const updateNodeDataTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveTimestampRef = useRef<number>(Date.now())

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
  const [isSaveDefaultConfirmOpen, setSaveDefaultConfirmOpen] = useState(false)
  const [nodeToSaveDefaults, setNodeToSaveDefaults] = useState<string | null>(null)
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
  const [heatmapEnabled, setHeatmapEnabled] = useState(false)
  const [heatmapMetric, setHeatmapMetric] = useState("profit")
  const [isSensitivityAnalysisOpen, setIsSensitivityAnalysisOpen] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null)
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null)
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
          const { nodes: savedNodes, edges: savedEdges, timestamp } = JSON.parse(savedData)

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
          setLastSavedTime(timestamp ? new Date(timestamp) : new Date())
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
        }, 1000)
      } catch (error) {
        console.error("Error loading saved data:", error)
        // Fallback to initial data
        setNodes(initialNodesWithHandlers)
        setEdges(initialEdges)
        setIsInitialized(true)

        setTimeout(() => {
          initialLoadComplete.current = true
          skipEffectsRef.current = false
        }, 1000)
      }
    }

    // Delay loading to ensure component is fully mounted
    setTimeout(loadData, 500)
  }, [])

  // Set up auto-save interval
  useEffect(() => {
    if (!isInitialized || !initialLoadComplete.current) return

    // Clear any existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }

    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      // Only auto-save if changes were made since last save
      const now = Date.now()
      if (now - lastSaveTimestampRef.current > 2000) {
        // Only save if more than 2 seconds since last save
        saveFlowchartData(true) // silent save
      }
    }, AUTO_SAVE_INTERVAL)

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [isInitialized])

  // Save data to localStorage - completely separated from render cycle
  const saveFlowchartData = useCallback(
    (silent = false) => {
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

        const timestamp = Date.now()
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            nodes: nodesToSave,
            edges: edgesRef.current,
            timestamp,
          }),
        )

        lastSaveTimestampRef.current = timestamp
        setLastSavedTime(new Date(timestamp))

        if (!silent) {
          toast({
            title: "Flowchart saved",
            description: `Your flowchart and all current input values have been saved`,
            duration: 2000,
          })
        }

        isSavingRef.current = false
      } catch (error) {
        console.error("Error saving data:", error)
        isSavingRef.current = false

        if (!silent) {
          toast({
            title: "Save failed",
            description: "There was an error saving your flowchart",
            variant: "destructive",
          })
        }
      }
    },
    [isInitialized, toast],
  )

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => saveFlowchartData(true), 2000)
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
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
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
  const recalculate = useCallback(
    (changedNodeId?: string) => {
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

          // Pass the changed node ID to optimize recalculation
          const updatedNodes = recalculateFlowchart(currentNodes, currentEdges, changedNodeId)

          // Only update if there are actual changes
          if (updatedNodes !== currentNodes) {
            setNodes(updatedNodes)
            // Trigger a save to persist the changes
            debouncedSave()
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
    },
    [setNodes, toast, debouncedSave],
  )

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
        style: defaultEdgeOptions.style,
        markerEnd: defaultEdgeOptions.markerEnd,
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

  // Prevent node click from opening the module details
  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    // We no longer set the selected node here
    // This allows the node to be expanded without opening the details panel
    // setSelectedNode(node.id)
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

      // Trigger save to persist the deletion
      debouncedSave()
    },
    [setEdges, setNodes, selectedNode, toast, debouncedSave],
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

      // Trigger save to persist the reset
      debouncedSave()
    },
    [nodes, setNodes, toast, debouncedSave],
  )

  const handleFormulaChange = (formula: string, functionCode: string) => {
    try {
      // Basic validation - check if the code has balanced braces
      let braceCount = 0
      for (let i = 0; i < functionCode.length; i++) {
        if (functionCode[i] === "{") braceCount++
        if (functionCode[i] === "}") braceCount--
        if (braceCount < 0) throw new Error("Unbalanced braces")
      }
      if (braceCount !== 0) throw new Error("Unbalanced braces")

      // Only update if the values have actually changed
      if (newModuleFormula !== formula || newModuleFunctionCode !== functionCode) {
        setNewModuleFormula(formula)
        setNewModuleFunctionCode(functionCode)
      }
    } catch (error) {
      console.error("Invalid function code:", error)
      // Don't update the state with invalid code
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

    // Ensure we have valid function code
    let safeFunctionCode = newModuleFunctionCode
    try {
      // Basic validation
      if (!safeFunctionCode.includes("return")) {
        safeFunctionCode = `return { result: 0 };`
      }

      // Try to create a function to validate the code
      new Function("inputs", safeFunctionCode)
    } catch (error) {
      console.error("Invalid function code:", error)
      // Provide a fallback valid function
      safeFunctionCode = `return { result: 0 };`
    }

    // Create a new module with custom inputs and function
    const newNode = createNewModule(
      newModuleType,
      newModuleName,
      nodes,
      newModuleDescription,
      newModuleInputs,
      safeFunctionCode,
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

    // Trigger save to persist the new module
    debouncedSave()
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

    // Trigger save to persist the new library module
    debouncedSave()

    toast({
      title: "Module added from library",
      description: `${moduleItem.name} has been added to the flowchart`,
    })
  }

  const handleSaveFlowchart = () => {
    try {
      saveFlowchartData()
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

    // Save the reset flowchart
    saveFlowchartData()
  }

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      // Clear any existing timeout
      if (updateNodeDataTimeoutRef.current) {
        clearTimeout(updateNodeDataTimeoutRef.current)
      }

      // Use timeout to batch updates and prevent cascading renders
      updateNodeDataTimeoutRef.current = setTimeout(() => {
        console.log(`Updating node ${nodeId} with data:`, newData)

        // Track if inputs have changed to trigger immediate recalculation
        const hasInputChanges = newData.inputs !== undefined

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

        // Always set needsRecalculation to true when node data changes
        setNeedsRecalculation(true)

        // Force recalculation immediately for input changes
        if (hasInputChanges) {
          setTimeout(() => {
            recalculate(nodeId)
          }, 50)
        }

        // Trigger save to persist the node data changes
        debouncedSave()
      }, 0)
    },
    [setNodes, deleteNode, cancelModule, recalculate, debouncedSave],
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

  // Handle adding a connection from the connection panel
  const handleAddConnection = (sourceId: string, sourceHandle: string, targetId: string, targetHandle: string) => {
    const newEdge = {
      id: `e${sourceId}-${targetId}-${Date.now()}`,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      animated: true,
      style: defaultEdgeOptions.style,
      markerEnd: defaultEdgeOptions.markerEnd,
    }

    setEdges((eds) => [...eds, newEdge])
    setNeedsRecalculation(true)

    // Save the new connection
    debouncedSave()
  }

  // Handle deleting a connection from the connection panel
  const handleDeleteConnection = (edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId))
    setNeedsRecalculation(true)

    // Save the deletion
    debouncedSave()
  }

  // Calculate heatmap values for nodes
  const getHeatmapValues = () => {
    if (!heatmapEnabled || !heatmapMetric) return { min: 0, max: 0 }

    // Find all nodes that have the selected metric as an output
    const nodesWithMetric = nodes.filter((node) => node.data.outputs && node.data.outputs[heatmapMetric] !== undefined)

    if (nodesWithMetric.length === 0) return { min: 0, max: 0 }

    // Get min and max values
    const values = nodesWithMetric.map((node) => Number(node.data.outputs[heatmapMetric]))
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { min, max }
  }

  const { min: heatmapMin, max: heatmapMax } = getHeatmapValues()

  // Add heatmap coloring to nodes if enabled
  const nodesWithHeatmap = useCallback(() => {
    if (!heatmapEnabled || !heatmapMetric) return nodes

    return nodes.map((node) => {
      // Only apply heatmap to nodes that have the selected metric
      if (node.data.outputs && node.data.outputs[heatmapMetric] !== undefined) {
        const value = Number(node.data.outputs[heatmapMetric])
        // Calculate color intensity based on value position between min and max
        const normalizedValue = heatmapMax > heatmapMin ? (value - heatmapMin) / (heatmapMax - heatmapMin) : 0.5

        // Create a style object with the heatmap color
        const heatmapStyle = {
          background: `rgba(255, ${Math.round(255 * (1 - normalizedValue))}, ${Math.round(255 * (1 - normalizedValue))}, 0.2)`,
          borderColor: `rgba(255, ${Math.round(255 * (1 - normalizedValue))}, ${Math.round(255 * (1 - normalizedValue))}, 0.8)`,
        }

        return {
          ...node,
          data: {
            ...node.data,
            heatmapStyle,
          },
        }
      }
      return node
    })
  }, [nodes, heatmapEnabled, heatmapMetric, heatmapMin, heatmapMax])

  // Add these new handlers for the ModuleNode component

  // Handle updating inputs directly from the node
  const handleUpdateNodeInputs = useCallback(
    (nodeId: string, newInputs: Record<string, any>) => {
      console.log("Updating node inputs from expanded view:", nodeId, newInputs)

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Execute the function with new inputs to get updated outputs
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                inputs: newInputs,
              },
            }

            // Calculate new outputs
            let newOutputs = {}
            try {
              newOutputs = executeModule(updatedNode.data)
              console.log("New outputs calculated:", newOutputs)
            } catch (error) {
              console.error("Error calculating outputs:", error)
            }

            return {
              ...node,
              data: {
                ...node.data,
                inputs: newInputs,
                outputs: newOutputs,
                needsRecalculation: false,
                onUpdateInputs: handleUpdateNodeInputs,
                onRecalculate: handleRecalculateNode,
                onSaveDefaults: handleOpenSaveDefaultsDialog,
              },
            }
          }
          return node
        }),
      )

      // Trigger recalculation of dependent nodes
      setTimeout(() => {
        recalculate(nodeId)
      }, 100)

      // Trigger save to persist the changes
      debouncedSave()

      toast({
        title: "Input values updated",
        description: "Changes are being propagated through the flowchart",
        duration: 2000,
      })
    },
    [setNodes, recalculate, debouncedSave, toast],
  )

  // Handle recalculating a single node
  const handleRecalculateNode = useCallback(
    (nodeId: string) => {
      console.log("Recalculating node:", nodeId)

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Calculate new outputs
            let newOutputs = {}
            try {
              newOutputs = executeModule(node.data)
              console.log("Node recalculated, new outputs:", newOutputs)
            } catch (error) {
              console.error("Error recalculating node:", error)
            }

            return {
              ...node,
              data: {
                ...node.data,
                outputs: newOutputs,
                needsRecalculation: false,
              },
            }
          }
          return node
        }),
      )

      // Trigger recalculation of dependent nodes
      setTimeout(() => {
        recalculate(nodeId)
      }, 100)

      toast({
        title: "Node recalculated",
        description: "Module values have been updated",
        duration: 2000,
      })
    },
    [setNodes, recalculate, toast],
  )

  // Open save defaults confirmation dialog
  const handleOpenSaveDefaultsDialog = useCallback((nodeId: string) => {
    setNodeToSaveDefaults(nodeId)
    setSaveDefaultConfirmOpen(true)
  }, [])

  // Save current inputs as default values
  const handleSaveDefaults = useCallback(() => {
    if (!nodeToSaveDefaults) return

    console.log("Saving defaults for node:", nodeToSaveDefaults)

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeToSaveDefaults) {
          return {
            ...node,
            data: {
              ...node.data,
              defaultInputs: { ...node.data.inputs },
            },
          }
        }
        return node
      }),
    )

    // Close dialog
    setSaveDefaultConfirmOpen(false)
    setNodeToSaveDefaults(null)

    // Trigger save to persist the changes
    debouncedSave()

    toast({
      title: "Default values saved",
      description: "Current input values are now the default for this module",
      duration: 3000,
    })
  }, [nodeToSaveDefaults, setNodes, debouncedSave, toast])

  // Add handlers to all nodes
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onUpdateInputs: handleUpdateNodeInputs,
            onRecalculate: handleRecalculateNode,
            onSaveDefaults: handleOpenSaveDefaultsDialog,
          },
        })),
      )
    }
  }, []) // Empty dependency array to run only once after initial nodes are loaded

  // Return the FlowChart component with all necessary UI elements
  return (
    <div className="h-full w-full flex flex-col">
      <FlowchartToolbar
        onAddModule={() => setIsAddingModule(true)}
        onManageConnections={() => setIsManagingConnections(true)}
        onExportCode={() => setIsExportingCode(true)}
        onSaveFlowchart={handleSaveFlowchart}
        onResetFlowchart={handleResetFlowchart}
        onRecalculate={() => recalculate()}
        onOpenLibrary={() => setIsModuleLibraryOpen(true)}
        onToggleAutoRecalculate={(enabled) => setAutoRecalculate(enabled)}
        onOpenSensitivityAnalysis={() => setIsSensitivityAnalysisOpen(true)}
        onToggleHeatmap={() => setHeatmapEnabled(!heatmapEnabled)}
        autoRecalculate={autoRecalculate}
        needsRecalculation={needsRecalculation}
        heatmapEnabled={heatmapEnabled}
        lastSaved={lastSavedTime}
      />

      <div className="flex-1 relative">
        <ReactFlow
          ref={reactFlowWrapper}
          nodes={heatmapEnabled ? nodesWithHeatmap() : nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />

          {heatmapEnabled && (
            <HeatmapLegend
              onClose={() => setHeatmapEnabled(false)}
              metric={heatmapMetric}
              minValue={heatmapMin}
              maxValue={heatmapMax}
            />
          )}
        </ReactFlow>
      </div>

      {/* Module details panel */}
      {selectedNode && (
        <ModuleDetails
          nodeId={selectedNode}
          nodes={nodes}
          edges={edges}
          updateNodeData={updateNodeData}
          onClose={closeDetails}
          onNodesChange={setNodes}
          autoRecalculate={autoRecalculate}
        />
      )}

      {/* Connection management panel */}
      {isManagingConnections && (
        <ConnectionPanel
          isOpen={isManagingConnections}
          onClose={() => setIsManagingConnections(false)}
          nodes={nodes}
          edges={edges}
          onAddConnection={handleAddConnection}
          onDeleteConnection={handleDeleteConnection}
        />
      )}

      {/* Code export dialog */}
      {isExportingCode && (
        <CodeExportDialog
          isOpen={isExportingCode}
          onClose={() => setIsExportingCode(false)}
          nodes={nodes}
          edges={edges}
        />
      )}

      {/* Module library dialog */}
      {isModuleLibraryOpen && (
        <ModuleLibrary
          isOpen={isModuleLibraryOpen}
          onClose={() => setIsModuleLibraryOpen(false)}
          onAddModule={handleAddFromLibrary}
          currentNodes={nodes}
        />
      )}

      {/* Add Module dialog */}
      <AddModuleDialog
        isOpen={isAddingModule}
        onClose={() => setIsAddingModule(false)}
        onAddModule={handleAddModule}
        newModuleType={newModuleType}
        setNewModuleType={setNewModuleType}
        newModuleName={newModuleName}
        setNewModuleName={setNewModuleName}
        newModuleDescription={newModuleDescription}
        setNewModuleDescription={setNewModuleDescription}
        newModuleInputs={newModuleInputs}
        setNewModuleInputs={setNewModuleInputs}
        newModuleFormula={newModuleFormula}
        newModuleFunctionCode={newModuleFunctionCode}
        handleFormulaChange={handleFormulaChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Sensitivity analysis dashboard */}
      {isSensitivityAnalysisOpen && (
        <SensitivityDashboard
          isOpen={isSensitivityAnalysisOpen}
          onClose={() => setIsSensitivityAnalysisOpen(false)}
          nodes={nodes}
          edges={edges}
          simulationResults={simulationResults}
          isSimulating={false}
          onJumpToNode={(nodeId) => {
            setSelectedNode(nodeId)
            setIsSensitivityAnalysisOpen(false)
          }}
          onApplyChanges={() => {
            if (simulationResults) {
              // Get the input to change
              const { nodeId, inputName, newValue } = simulationResults.changedInput

              // Find the node
              const node = nodes.find((n) => n.id === nodeId)
              if (!node) return

              // Update the node's input
              updateNodeData(nodeId, {
                inputs: {
                  ...node.data.inputs,
                  [inputName]: newValue,
                },
                needsRecalculation: true,
              })

              // Close the dashboard
              setIsSensitivityAnalysisOpen(false)

              // Show a toast notification
              toast({
                title: "Changes applied",
                description: `Updated ${inputName} to ${newValue} and recalculated affected modules`,
              })

              // Trigger recalculation if auto-recalculate is disabled
              if (!autoRecalculate) {
                setTimeout(() => {
                  recalculate(nodeId)
                }, 100)
              }
            }
          }}
        />
      )}

      {/* Save as default confirmation dialog */}
      <AlertDialog open={isSaveDefaultConfirmOpen} onOpenChange={setSaveDefaultConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save as Default Values</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite the current default values for this module. The current input values will become the
              new defaults. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNodeToSaveDefaults(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveDefaults}>Save as Default</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Now add the required default export wrapping the FlowChart component
// This is what will be imported as ModularFlowchart in the app/page.tsx

// Update the ModularFlowchart component to set a specific height
export default function ModularFlowchart() {
  return (
    <div className="w-full h-[calc(100vh-100px)]">
      <FlowChart />
    </div>
  )
}
