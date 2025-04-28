"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { executeModule } from "@/lib/recalculation-utils"
import {
  RotateCcw,
  Code,
  Settings,
  Activity,
  Info,
  ArrowRight,
  RefreshCw,
  FileText,
  Sliders,
  Save,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InputManager } from "@/components/input-manager"
import { FormulaBuilder } from "@/components/formula-builder"
import { MetricDrilldown } from "@/components/metric-drilldown"
import { Slider } from "@/components/ui/slider"
import { SensitivityDashboard, type SimulationResult } from "@/components/sensitivity-dashboard"
import type { Edge } from "reactflow"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { recalculateFlowchart, findDependentNodes } from "@/lib/recalculation-utils"
import { useToast } from "@/components/ui/use-toast"
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

interface ModuleDetailsProps {
  nodeId: string
  nodes: any[]
  edges: any[]
  updateNodeData: (nodeId: string, any) => void
  onClose: () => void
  onNodesChange: (nodes: any[]) => void
  autoRecalculate: boolean
}

export function ModuleDetails({
  nodeId,
  nodes,
  edges,
  updateNodeData,
  onClose,
  onNodesChange,
  autoRecalculate,
}: ModuleDetailsProps) {
  const node = nodes.find((n) => n.id === nodeId)
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [functionCode, setFunctionCode] = useState("")
  const [outputs, setOutputs] = useState<Record<string, any>>({})
  const [needsRecalculation, setNeedsRecalculation] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [initialFormula, setInitialFormula] = useState<string>("")
  const [isMetricDrilldownOpen, setIsMetricDrilldownOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>("")
  const [selectedInputForAnalysis, setSelectedInputForAnalysis] = useState<string>("")
  const [sensitivityPercentage, setSensitivityPercentage] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null)
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [isSaveDefaultConfirmOpen, setSaveDefaultConfirmOpen] = useState(false)
  const [inputValuesModified, setInputValuesModified] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
  const [inputMetricGroups, setInputMetricGroups] = useState<Record<string, string[]>>({})
  const { toast } = useToast()

  // Refs to prevent update loops
  const isUpdatingRef = useRef(false)
  const initializedRef = useRef(false)
  const nodeIdRef = useRef<string | null>(nodeId)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFunctionCodeRef = useRef<string>("")
  const originalInputsRef = useRef<Record<string, any>>({})
  const originalOutputsRef = useRef<Record<string, any>>({})

  // Define refs for conditional logic
  const triggerFullRecalculationRef = useRef<() => void>(() => {})

  // Create refs outside the conditional block
  const debouncedUpdateNodeDataRef = useRef<(data: any) => void>(() => {})
  const handleInputChangeRef = useRef<(newInputs: Record<string, any>) => void>(() => {})
  const handleFunctionCodeChangeRef = useRef<(formula: string, code: string) => void>(() => {})
  const handleCodeChangeRef = useRef<(e: React.ChangeEvent<HTMLTextAreaElement>) => void>(() => {})
  const resetInputsRef = useRef<() => void>(() => {})
  const runSensitivityAnalysisRef = useRef<() => void>(() => {})
  const applySimulationResultsRef = useRef<() => void>(() => {})
  const saveAsDefaultRef = useRef<() => void>(() => {})

  // Initialize refs with default values
  const debouncedUpdateNodeDataRefInit = useRef<(data: any) => void>(() => {})
  const handleInputChangeRefInit = useRef<(newInputs: Record<string, any>) => void>(() => {})
  const handleFunctionCodeChangeRefInit = useRef<(formula: string, code: string) => void>(() => {})
  const handleCodeChangeRefInit = useRef<(e: React.ChangeEvent<HTMLTextAreaElement>) => void>(() => {})
  const resetInputsRefInit = useRef<() => void>(() => {})
  const runSensitivityAnalysisRefInit = useRef<() => void>(() => {})
  const applySimulationResultsRefInit = useRef<() => void>(() => {})
  const saveAsDefaultRefInit = useRef<() => void>(() => {})

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

  // Compare current inputs with default inputs to check if values have been modified
  useEffect(() => {
    if (node && node.data.defaultInputs) {
      const defaultInputs = node.data.defaultInputs
      const currentInputs = inputs

      // Debug logging
      console.log("Comparing inputs:", currentInputs, "with defaults:", defaultInputs)

      const isModified = Object.keys(currentInputs).some((key) => {
        // Check if values are different
        if (typeof currentInputs[key] === "number" && typeof defaultInputs[key] === "number") {
          // For numbers, compare with a small epsilon to account for floating point errors
          const diff = Math.abs(currentInputs[key] - defaultInputs[key])
          const isChanged = diff > 0.000001
          if (isChanged) {
            console.log(`Input ${key} changed: ${defaultInputs[key]} -> ${currentInputs[key]}`)
          }
          return isChanged
        }

        const isDifferent = JSON.stringify(currentInputs[key]) !== JSON.stringify(defaultInputs[key])
        if (isDifferent) {
          console.log(`Input ${key} changed: ${defaultInputs[key]} -> ${currentInputs[key]}`)
        }
        return isDifferent
      })

      console.log("Inputs modified:", isModified)
      setInputValuesModified(isModified)
    }
  }, [inputs, node])

  // Check for unsaved changes
  useEffect(() => {
    if (!initializedRef.current) return

    const inputsChanged = JSON.stringify(inputs) !== JSON.stringify(originalInputsRef.current)
    const codeChanged = functionCode !== lastFunctionCodeRef.current

    setHasUnsavedChanges(inputsChanged || codeChanged)
  }, [inputs, functionCode])

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
      setHasUnsavedChanges(false)
      setInputMetricGroups({})
    }
  }, [nodeId])

  // Analyze function code to determine which inputs affect which outputs
  const analyzeInputOutputRelationships = useCallback((code: string, inputKeys: string[], outputKeys: string[]) => {
    const relationships: Record<string, string[]> = {}

    // Initialize with empty arrays for each output
    outputKeys.forEach((output) => {
      relationships[output] = []
    })

    // Simple analysis - check if input appears in the same line as output
    inputKeys.forEach((input) => {
      const inputPattern = new RegExp(`inputs\\.${input}`, "g")

      outputKeys.forEach((output) => {
        // Look for patterns like "output: ... inputs.inputName ..."
        const outputPattern = new RegExp(`${output}\\s*:\\s*[^;]*inputs\\.${input}`, "g")

        // Also check for variables that might use the input and then be used in the output
        const variablePattern = new RegExp(
          `const\\s+\\w+\\s*=\\s*[^;]*inputs\\.${input}[^;]*;[\\s\\S]*${output}\\s*:`,
          "g",
        )

        if (
          outputPattern.test(code) ||
          variablePattern.test(code) ||
          // For simple modules, if there's only one output, assume all inputs affect it
          (outputKeys.length === 1 && inputPattern.test(code))
        ) {
          if (!relationships[output].includes(input)) {
            relationships[output].push(input)
          }
        }
      })
    })

    return relationships
  }, [])

  // Initialize component with node data
  useEffect(() => {
    if (!node || initializedRef.current) return

    // Use a timeout to ensure we don't initialize during an update cycle
    timeoutRef.current = setTimeout(() => {
      try {
        initializedRef.current = true

        // Set initial state from node data
        const nodeInputs = { ...node.data.inputs }
        const nodeOutputs = executeModule(node.data)

        setInputs(nodeInputs)
        setFunctionCode(node.data.functionCode || "")
        setOutputs(nodeOutputs)
        setNeedsRecalculation(node.data.needsRecalculation || false)
        lastFunctionCodeRef.current = node.data.functionCode || ""

        // Store original values for change detection
        originalInputsRef.current = { ...nodeInputs }
        originalOutputsRef.current = { ...nodeOutputs }

        // Extract formula from functionCode - only once
        if (node.data.functionCode) {
          const match = node.data.functionCode.match(/return\s*{\s*[a-zA-Z0-9_]+:\s*(.*?)\s*};/)
          if (match && match[1]) {
            setInitialFormula(match[1])
          }

          // Analyze which inputs affect which outputs
          const inputKeys = Object.keys(nodeInputs)
          const outputKeys = Object.keys(nodeOutputs)
          const relationships = analyzeInputOutputRelationships(node.data.functionCode, inputKeys, outputKeys)

          // Invert the relationships to get input -> outputs mapping
          const inputToOutputs: Record<string, string[]> = {}
          inputKeys.forEach((input) => {
            inputToOutputs[input] = outputKeys.filter((output) => relationships[output].includes(input))
          })

          setInputMetricGroups(inputToOutputs)
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
  }, [node, analyzeInputOutputRelationships])

  // Function to trigger a full flowchart recalculation
  const triggerFullRecalculation = useCallback(() => {
    triggerFullRecalculationRef.current()
  }, [])

  useEffect(() => {
    triggerFullRecalculationRef.current = () => {
      // Use setTimeout to completely break out of the render cycle
      setTimeout(() => {
        try {
          // Always perform the full recalculation regardless of autoRecalculate setting
          console.log("Triggering full recalculation")
          const updatedNodes = recalculateFlowchart(nodes, edges)

          // Update the nodes in the parent component
          if (updatedNodes !== nodes) {
            console.log("Nodes updated after recalculation")
            onNodesChange(updatedNodes)
          } else {
            console.log("No nodes changed during recalculation")
          }
        } catch (error) {
          console.error("Error during recalculation:", error)
        }
      }, 0)
    }
  }, [nodes, edges, onNodesChange])

  // Debounced function to update node data
  const _debouncedUpdateNodeData = useRef<(data: any) => void>(() => {})

  useEffect(() => {
    _debouncedUpdateNodeData.current = (data: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        if (!isUpdatingRef.current) {
          try {
            isUpdatingRef.current = true
            console.log("Updating node data:", nodeId, data)
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
      }, 50) // Reduced timeout for faster response
    }
  }, [nodeId, updateNodeData])

  const debouncedUpdateNodeData = useCallback((data: any) => {
    _debouncedUpdateNodeData.current?.(data)
  }, [])

  const _handleInputChange = useRef<(newInputs: Record<string, any>) => void>(() => {})

  useEffect(() => {
    _handleInputChange.current = (newInputs: Record<string, any>) => {
      if (isUpdatingRef.current) return

      console.log("Input change detected:", newInputs)

      // Update local state immediately
      setInputs(newInputs)

      // Mark as having unsaved changes
      setHasUnsavedChanges(true)

      if (!node || !node.data.function) {
        console.error("Node or node function is missing")
        return
      }

      try {
        // Execute the function with new inputs to get updated outputs
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            inputs: newInputs,
          },
        }

        // Calculate new outputs
        const newOutputs = executeModule(updatedNode.data)
        console.log("New outputs calculated:", newOutputs)

        // Update local outputs state
        setOutputs(newOutputs)
      } catch (error) {
        console.error("Error processing input change:", error)
      }
    }
  }, [node])

  const handleInputChange = useCallback((newInputs: Record<string, any>) => {
    _handleInputChange.current?.(newInputs)
  }, [])

  const _handleFunctionCodeChange = useRef<(formula: string, code: string) => void>(() => {})

  useEffect(() => {
    _handleFunctionCodeChange.current = (formula: string, code: string) => {
      if (isUpdatingRef.current) return

      // Only update if the code has actually changed
      if (lastFunctionCodeRef.current === code) return

      // Update local state
      setFunctionCode(code)
      lastFunctionCodeRef.current = code

      // Mark as having unsaved changes
      setHasUnsavedChanges(true)

      try {
        // Create a new function from the code
        const newFunction = new Function("inputs", code)

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
          const newOutputs = executeModule(updatedNode.data)
          setOutputs(newOutputs)

          // Re-analyze input-output relationships
          const inputKeys = Object.keys(inputs)
          const outputKeys = Object.keys(newOutputs)
          const relationships = analyzeInputOutputRelationships(code, inputKeys, outputKeys)

          // Invert the relationships to get input -> outputs mapping
          const inputToOutputs: Record<string, string[]> = {}
          inputKeys.forEach((input) => {
            inputToOutputs[input] = outputKeys.filter((output) => relationships[output].includes(input))
          })

          setInputMetricGroups(inputToOutputs)
        }
      } catch (error) {
        console.error("Error creating function:", error)
      }
    }
  }, [node, inputs, analyzeInputOutputRelationships])

  const handleFunctionCodeChange = useCallback((formula: string, code: string) => {
    _handleFunctionCodeChange.current?.(formula, code)
  }, [])

  const _handleCodeChange = useRef<(e: React.ChangeEvent<HTMLTextAreaElement>) => void>(() => {})

  useEffect(() => {
    _handleCodeChange.current = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isUpdatingRef.current) return

      const code = e.target.value

      // Only update if the code has actually changed
      if (lastFunctionCodeRef.current === code) return

      // Update local state
      setFunctionCode(code)
      lastFunctionCodeRef.current = code

      // Mark as having unsaved changes
      setHasUnsavedChanges(true)

      try {
        // Create a new function from the code
        const newFunction = new Function("inputs", code)

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
          const newOutputs = executeModule(updatedNode.data)
          setOutputs(newOutputs)

          // Re-analyze input-output relationships
          const inputKeys = Object.keys(inputs)
          const outputKeys = Object.keys(newOutputs)
          const relationships = analyzeInputOutputRelationships(code, inputKeys, outputKeys)

          // Invert the relationships to get input -> outputs mapping
          const inputToOutputs: Record<string, string[]> = {}
          inputKeys.forEach((input) => {
            inputToOutputs[input] = outputKeys.filter((output) => relationships[output].includes(input))
          })

          setInputMetricGroups(inputToOutputs)
        }
      } catch (error) {
        console.error("Error creating function:", error)
      }
    }
  }, [node, inputs, analyzeInputOutputRelationships])

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    _handleCodeChange.current?.(e)
  }, [])

  const _resetInputs = useRef<() => void>(() => {})

  useEffect(() => {
    _resetInputs.current = () => {
      if (!node || !node.data.defaultInputs || isUpdatingRef.current) return

      // Update local state
      setInputs({ ...node.data.defaultInputs })

      // Mark as having unsaved changes
      setHasUnsavedChanges(true)

      // Recalculate outputs
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          inputs: { ...node.data.defaultInputs },
        },
      }
      setOutputs(executeModule(updatedNode.data))

      toast({
        title: "Inputs reset",
        description: "Module inputs have been reset to default values",
        duration: 2000,
      })
    }
  }, [node, toast])

  const resetInputs = useCallback(() => {
    _resetInputs.current?.()
  }, [])

  const resetSensitivityPercentage = useCallback(() => {
    setSensitivityPercentage(0)
    toast({
      title: "Percentage reset",
      description: "Input change percentage has been reset to 0%",
      duration: 2000,
    })
  }, [toast])

  // Save current inputs as default values
  const saveAsDefault = useCallback(() => {
    if (!node || isUpdatingRef.current) return

    console.log("Saving current inputs as defaults:", inputs)

    // Update node data with new default inputs
    debouncedUpdateNodeData({
      defaultInputs: { ...inputs },
    })

    // Update the node directly for immediate feedback
    updateNodeData(nodeId, {
      defaultInputs: { ...inputs },
    })

    // Clear the modified flag since inputs now match defaults
    setInputValuesModified(false)

    toast({
      title: "Default values saved",
      description: "Current input values are now the default for this module",
      duration: 3000,
    })

    setSaveDefaultConfirmOpen(false)
  }, [node, inputs, debouncedUpdateNodeData, updateNodeData, nodeId, toast])

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

  // Apply simulation results to the actual module
  const _applySimulationResults = useRef<() => void>(() => {})

  useEffect(() => {
    _applySimulationResults.current = () => {
      if (!simulationResults || !node) return

      // Get the input to change
      const { inputName, newValue } = simulationResults.changedInput

      // Create a new inputs object with the updated value
      const updatedInputs = {
        ...inputs,
        [inputName]: newValue,
      }

      // Update the local state
      setInputs(updatedInputs)

      // Update the node data and trigger recalculation
      debouncedUpdateNodeData({
        inputs: updatedInputs,
        needsRecalculation: true,
      })

      setIsDashboardOpen(false)

      toast({
        title: "Changes applied",
        description: `Updated ${inputName} to ${newValue}`,
      })
    }
  }, [simulationResults, node, inputs, debouncedUpdateNodeData, toast])

  const applySimulationResults = useCallback(() => {
    _applySimulationResults.current?.()
  }, [])

  // Add a resetSensitivityAnalysis function to clear the simulation results and close the dashboard
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Save changes and close
  const saveAndClose = useCallback(() => {
    if (!node) return

    console.log("Saving changes before closing:", { inputs, functionCode, outputs })

    try {
      // Create a new function from the code if it changed
      let newFunction = node.data.function
      if (functionCode !== node.data.functionCode) {
        newFunction = new Function("inputs", functionCode)
      }

      // Update the node data with all changes
      updateNodeData(nodeId, {
        inputs: inputs,
        outputs: outputs,
        function: newFunction,
        functionCode: functionCode,
        needsRecalculation: false,
      })

      // Find dependent nodes that need to be updated
      const dependentNodeIds = findDependentNodes(nodeId, nodes, edges)
      console.log("Dependent nodes:", dependentNodeIds)

      if (dependentNodeIds.length > 0) {
        // Force immediate recalculation of the entire flowchart
        setTimeout(() => {
          triggerFullRecalculation()
        }, 100)
      }

      // Reset unsaved changes flag
      setHasUnsavedChanges(false)

      // Close the panel
      onClose()

      toast({
        title: "Changes saved",
        description: "Module changes have been saved and propagated",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes",
        variant: "destructive",
      })
    }
  }, [
    node,
    nodeId,
    inputs,
    functionCode,
    outputs,
    updateNodeData,
    nodes,
    edges,
    triggerFullRecalculation,
    onClose,
    toast,
  ])

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setIsUnsavedChangesDialogOpen(true)
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, onClose])

  // Fixed recalculate function
  const recalculateModule = useCallback(() => {
    if (!node) return

    console.log("Manually recalculating module:", nodeId)

    try {
      // Create a new function from the code if it changed
      let newFunction = node.data.function
      if (functionCode !== node.data.functionCode) {
        newFunction = new Function("inputs", functionCode)
      }

      // Create updated node with current inputs and function
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          inputs: inputs,
          function: newFunction,
          functionCode: functionCode,
        },
      }

      // Calculate new outputs
      const newOutputs = executeModule(updatedNode.data)
      console.log("Recalculation produced outputs:", newOutputs)

      // Update local state
      setOutputs(newOutputs)

      // Update the node data
      updateNodeData(nodeId, {
        outputs: newOutputs,
        function: newFunction,
        functionCode: functionCode,
        needsRecalculation: false,
      })

      toast({
        title: "Module recalculated",
        description: "Module outputs have been updated",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error recalculating module:", error)
      toast({
        title: "Recalculation failed",
        description: "There was a problem recalculating the module",
        variant: "destructive",
      })
    }
  }, [node, nodeId, inputs, functionCode, updateNodeData, toast])

  if (!node) return null

  // Determine if this is a user-added module
  const isUserAdded = node.data.isUserAdded === true

  const _runSensitivityAnalysis = useRef<() => void>(() => {})

  useEffect(() => {
    _runSensitivityAnalysis.current = () => {
      if (!node || !selectedInputForAnalysis) return

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

          // Find the node to modify
          const targetNodeId = nodeId // Use the current node's ID
          const targetNode = nodeMap.get(targetNodeId)
          if (!targetNode) {
            setIsSimulating(false)
            return
          }

          // Get original input value
          const inputName = selectedInputForAnalysis
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

          // Build dependency graph for proper recalculation order
          const graph: Record<string, string[]> = {}

          // Initialize graph with all nodes
          clonedNodes.forEach((node) => {
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

          // Perform topological sort to determine execution order
          const visited = new Set<string>()
          const temp = new Set<string>()
          const executionOrder: string[] = []

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
            executionOrder.push(nodeId)
          }

          // Visit all nodes
          for (const nodeId in graph) {
            if (!visited.has(nodeId)) {
              visit(nodeId)
            }
          }

          // Store original outputs for all nodes
          const originalOutputs = new Map<string, Record<string, any>>()
          clonedNodes.forEach((node) => {
            originalOutputs.set(node.id, { ...node.data.outputs })
          })

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
              !graph[nodeId].some((depId) => affectedNodes.some((n) => n.nodeId === depId))
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
                isTarget: false,
              })
            }
          }

          // Create simulation results
          const results: SimulationResult = {
            changedInput: {
              nodeId: targetNodeId,
              nodeName: targetNode.data.label,
              inputName: selectedInputForAnalysis,
              originalValue,
              newValue,
            },
            affectedNodes,
          }

          setSimulationResults(results)
          setIsDashboardOpen(true)
        } catch (error) {
          console.error("Error in sensitivity analysis:", error)
        } finally {
          setIsSimulating(false)
        }
      }, 100)
    }
  }, [nodeId, nodes, edges, selectedInputForAnalysis, sensitivityPercentage])

  const runSensitivityAnalysis = useCallback(() => {
    _runSensitivityAnalysis.current?.()
  }, [])

  // Function to manually apply changes and force recalculation
  const applyAndPropagate = useCallback(() => {
    if (!node) return

    console.log("Manually applying changes and propagating")

    try {
      // Calculate new outputs based on current inputs
      const newOutputs = executeModule({
        ...node.data,
        inputs: inputs,
        function: functionCode !== node.data.functionCode ? new Function("inputs", functionCode) : node.data.function,
      })

      console.log("Calculated new outputs:", newOutputs)

      // Update local state
      setOutputs(newOutputs)

      // Update the node with new inputs, outputs, and function
      updateNodeData(nodeId, {
        inputs: inputs,
        outputs: newOutputs,
        function: functionCode !== node.data.functionCode ? new Function("inputs", functionCode) : node.data.function,
        functionCode: functionCode,
        needsRecalculation: false,
      })

      // Force recalculation of the entire flowchart
      setTimeout(() => {
        triggerFullRecalculation()
      }, 100)

      // Reset unsaved changes flag
      setHasUnsavedChanges(false)

      toast({
        title: "Changes applied",
        description: "Values have been updated and propagated through the flowchart",
      })
    } catch (error) {
      console.error("Error applying changes:", error)
      toast({
        title: "Error applying changes",
        description: "There was a problem updating the module",
        variant: "destructive",
      })
    }
  }, [node, nodeId, inputs, functionCode, updateNodeData, triggerFullRecalculation, toast])

  // Group inputs by the metrics they impact
  const renderGroupedInputs = () => {
    // Get all outputs
    const outputKeys = Object.keys(outputs)

    // If we don't have input-metric relationships or there are no outputs, render inputs normally
    if (Object.keys(inputMetricGroups).length === 0 || outputKeys.length === 0) {
      return (
        <div className="col-span-2">
          <InputManager
            inputs={inputs}
            onChange={handleInputChange}
            defaultInputs={node.data.defaultInputs}
            showModifiedIndicator={true}
          />
        </div>
      )
    }

    // Create groups based on outputs
    const groups: Record<string, string[]> = {}

    // First, add all outputs as groups
    outputKeys.forEach((output) => {
      groups[output] = []
    })

    // Add a "Multiple" group for inputs that affect multiple outputs
    groups["Multiple"] = []

    // Add an "Ungrouped" for inputs that don't have clear relationships
    groups["Ungrouped"] = []

    // Assign inputs to groups
    Object.keys(inputs).forEach((input) => {
      const affectedOutputs = inputMetricGroups[input] || []

      if (affectedOutputs.length === 0) {
        // If no clear relationship, add to ungrouped
        groups["Ungrouped"].push(input)
      } else if (affectedOutputs.length === 1) {
        // If affects only one output, add to that output's group
        groups[affectedOutputs[0]].push(input)
      } else {
        // If affects multiple outputs, add to the "Multiple" group
        groups["Multiple"].push(input)
      }
    })

    // Filter out empty groups
    const nonEmptyGroups = Object.entries(groups).filter(([_, inputs]) => inputs.length > 0)

    return nonEmptyGroups.map(([groupName, groupInputs]) => (
      <div key={groupName} className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">
            {groupName === "Multiple"
              ? "Multiple Metrics"
              : groupName === "Ungrouped"
                ? "Other Inputs"
                : `Affects ${groupName}`}
          </h3>
          {groupName !== "Multiple" && groupName !== "Ungrouped" && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {groupName}
            </Badge>
          )}
        </div>
        <Card className="p-3">
          <InputManager
            inputs={Object.fromEntries(groupInputs.map((input) => [input, inputs[input]]))}
            onChange={(newInputs) => {
              // Merge with existing inputs
              handleInputChange({ ...inputs, ...newInputs })
            }}
            defaultInputs={
              node.data.defaultInputs
                ? Object.fromEntries(groupInputs.map((input) => [input, node.data.defaultInputs[input]]))
                : undefined
            }
            showModifiedIndicator={true}
          />
        </Card>
      </div>
    ))
  }

  return (
    <>
      <Dialog open={!!nodeId} onOpenChange={handleClose}>
        <DialogContent className="max-w-[80vw] w-[900px] max-h-[90vh] overflow-y-auto">
          <div className="absolute right-4 top-4">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>{node.data.label}</DialogTitle>
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
              {hasUnsavedChanges && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Save className="h-3 w-3" /> Unsaved changes
                </Badge>
              )}
            </div>
            <DialogDescription>{node.data.description}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={saveAndClose} disabled={!hasUnsavedChanges}>
              Save & Close
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid grid-cols-5 w-full">
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
              <div className="grid grid-cols-2 gap-4">
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

                {connectedNodes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Connected Modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 max-h-[300px] overflow-y-auto">
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
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="inputs" className="space-y-4 mt-4">
              <div className="flex justify-between">
                <h3 className="text-sm font-medium">Module Inputs</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetInputs} className="flex items-center gap-2">
                    <RotateCcw className="h-3 w-3" /> Reset
                  </Button>
                  <Button
                    variant={inputValuesModified ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      console.log("Save as Default clicked, modified:", inputValuesModified)
                      if (inputValuesModified) {
                        setSaveDefaultConfirmOpen(true)
                      } else {
                        toast({
                          title: "No changes to save",
                          description: "Current values already match the defaults",
                          duration: 2000,
                        })
                      }
                    }}
                    disabled={!inputValuesModified}
                    className={`flex items-center gap-2 ${inputValuesModified ? "bg-blue-100 hover:bg-blue-200 text-blue-800" : ""}`}
                  >
                    <Save className="h-3 w-3" /> Save as Default
                    {inputValuesModified && <span className="h-2 w-2 rounded-full bg-blue-500 ml-1"></span>}
                  </Button>
                  <Button variant="default" size="sm" onClick={applyAndPropagate} className="flex items-center gap-2">
                    <RefreshCw className="h-3 w-3" /> Apply & Propagate
                  </Button>
                </div>
              </div>

              {/* Render inputs grouped by the metrics they impact */}
              <div className="grid grid-cols-2 gap-6">{renderGroupedInputs()}</div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">Sensitivity Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Input to Analyze:</Label>
                    <Select value={selectedInputForAnalysis} onValueChange={setSelectedInputForAnalysis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an input" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(inputs).map((inputName) => (
                          <SelectItem key={inputName} value={inputName}>
                            {inputName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedInputForAnalysis && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label>Input Change Percentage: {sensitivityPercentage}%</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={resetSensitivityPercentage}
                              className="h-6 px-2"
                              disabled={sensitivityPercentage === 0}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Reset
                            </Button>
                          </div>
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
                              {typeof inputs[selectedInputForAnalysis] === "number"
                                ? inputs[selectedInputForAnalysis].toFixed(2)
                                : String(inputs[selectedInputForAnalysis])}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-muted-foreground">New Value (estimated):</span>
                            <span className="font-mono">
                              {typeof inputs[selectedInputForAnalysis] === "number"
                                ? (inputs[selectedInputForAnalysis] * (1 + sensitivityPercentage / 100)).toFixed(2)
                                : String(inputs[selectedInputForAnalysis])}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Button onClick={runSensitivityAnalysis} disabled={isSimulating} className="w-full">
                          {isSimulating ? "Analyzing..." : "Run Impact Analysis"}
                          {isSimulating ? (
                            <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sliders className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="formula" className="space-y-4 mt-4">
              <Tabs defaultValue={isUserAdded ? "builder" : "code"}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                  <TabsTrigger value="code">{isUserAdded ? "Raw Code" : "Code (Read-only)"}</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="mt-4">
                  <div className="h-[400px]">
                    <FormulaBuilder
                      inputs={inputs}
                      initialFormula={initialFormula}
                      functionCode={functionCode}
                      onChange={handleFunctionCodeChange}
                      readOnly={!isUserAdded}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="function-code">Module Function</Label>
                    <Textarea
                      id="function-code"
                      value={functionCode}
                      onChange={isUserAdded ? handleCodeChange : undefined}
                      readOnly={!isUserAdded}
                      className={`font-mono text-sm h-[400px] ${!isUserAdded ? "bg-slate-50" : ""}`}
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
                <Button variant="outline" size="sm" onClick={recalculateModule} className="flex items-center gap-2">
                  <RefreshCw className="h-3 w-3" /> Recalculate
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {Object.entries(outputs).length === 0 ? (
                  <div className="col-span-2 text-sm text-muted-foreground p-4 text-center bg-slate-50 rounded-md">
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
              </div>
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

          <div className="flex justify-end gap-2 mt-6 border-t pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={saveAndClose} disabled={!hasUnsavedChanges}>
              Save & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={saveAsDefault}>Save as Default</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes dialog */}
      <AlertDialog open={isUnsavedChangesDialogOpen} onOpenChange={setIsUnsavedChangesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save them before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsUnsavedChangesDialogOpen(false)
                onClose()
              }}
            >
              Discard Changes
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsUnsavedChangesDialogOpen(false)
                saveAndClose()
              }}
            >
              Save & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MetricDrilldown
        isOpen={isMetricDrilldownOpen}
        onClose={() => setIsMetricDrilldownOpen(false)}
        nodes={nodes}
        edges={edges}
        selectedNodeId={nodeId}
        selectedMetric={selectedMetric}
        onJumpToNode={(nodeId) => {
          onClose()
          setTimeout(() => {
            // We need to use setTimeout to ensure the current dialog is closed before opening a new one
            updateNodeData(nodeId, {}) // This is just to trigger a re-render
            // Now we need to tell the parent component to select this node
            const event = new CustomEvent("selectNode", { detail: { nodeId } })
            document.dispatchEvent(event)
          }, 100)
        }}
      />

      {/* Sensitivity analysis dashboard */}
      <SensitivityDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        nodes={nodes}
        edges={edges}
        simulationResults={simulationResults}
        isSimulating={isSimulating}
        onJumpToNode={(nodeId) => {
          onClose()
          setTimeout(() => {
            // We need to use setTimeout to ensure the current dialog is closed before opening a new one
            updateNodeData(nodeId, {}) // This is just to trigger a re-render
            // Now we need to tell the parent component to select this node
            const event = new CustomEvent("selectNode", { detail: { nodeId } })
            document.dispatchEvent(event)
          }, 100)
        }}
        onApplyChanges={applySimulationResults}
      />
    </>
  )
}
