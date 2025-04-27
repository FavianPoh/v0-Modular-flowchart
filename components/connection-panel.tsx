"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Trash2, RefreshCw } from "lucide-react"
import type { Node, Edge } from "reactflow"
import { Badge } from "@/components/ui/badge"

interface ConnectionPanelProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  onAddConnection: (sourceId: string, sourceHandle: string, targetId: string, targetHandle: string) => void
  onDeleteConnection: (edgeId: string) => void
}

export function ConnectionPanel({
  isOpen,
  onClose,
  nodes,
  edges,
  onAddConnection,
  onDeleteConnection,
}: ConnectionPanelProps) {
  const [sourceNode, setSourceNode] = useState<string>("")
  const [sourceOutput, setSourceOutput] = useState<string>("")
  const [targetNode, setTargetNode] = useState<string>("")
  const [targetInput, setTargetInput] = useState<string>("")

  // Reset selections when panel opens
  useEffect(() => {
    if (isOpen) {
      setSourceNode("")
      setSourceOutput("")
      setTargetNode("")
      setTargetInput("")
    }
  }, [isOpen])

  // Get available outputs for the selected source node
  const getSourceOutputs = () => {
    if (!sourceNode) return []

    const node = nodes.find((n) => n.id === sourceNode)
    if (!node) return []

    const calculatedOutputs = node.data.function ? node.data.function(node.data.inputs) : node.data.outputs
    return Object.keys(calculatedOutputs).map((key) => ({
      id: `output-${key}`,
      label: key,
    }))
  }

  // Get available inputs for the selected target node
  const getTargetInputs = () => {
    if (!targetNode) return []

    const node = nodes.find((n) => n.id === targetNode)
    if (!node) return []

    return Object.keys(node.data.inputs).map((key) => ({
      id: `input-${key}`,
      label: key,
    }))
  }

  // Handle adding a new connection
  const handleAddConnection = () => {
    if (sourceNode && sourceOutput && targetNode && targetInput) {
      onAddConnection(sourceNode, sourceOutput, targetNode, targetInput)

      // Reset selections after adding
      setSourceOutput("")
      setTargetInput("")
    }
  }

  // Format edge labels for display
  const formatEdgeLabel = (edge: Edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)

    if (!sourceNode || !targetNode) return "Unknown connection"

    const sourceHandle = edge.sourceHandle?.replace("output-", "") || ""
    const targetHandle = edge.targetHandle?.replace("input-", "") || ""

    return `${sourceNode.data.label}.${sourceHandle} → ${targetNode.data.label}.${targetHandle}`
  }

  // Check if a node needs recalculation
  const nodeNeedsRecalculation = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId)
    return node?.data.needsRecalculation || false
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Connections</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <h3 className="text-sm font-medium mb-2">Add New Connection</h3>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-node" className="text-right">
              Source Module
            </Label>
            <Select value={sourceNode} onValueChange={setSourceNode}>
              <SelectTrigger id="source-node" className="col-span-3">
                <SelectValue placeholder="Select source module" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.data.label} ({node.data.type})
                    {nodeNeedsRecalculation(node.id) && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Needs update
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-output" className="text-right">
              Output
            </Label>
            <Select value={sourceOutput} onValueChange={setSourceOutput} disabled={!sourceNode}>
              <SelectTrigger id="source-output" className="col-span-3">
                <SelectValue placeholder="Select output" />
              </SelectTrigger>
              <SelectContent>
                {getSourceOutputs().map((output) => (
                  <SelectItem key={output.id} value={output.id}>
                    {output.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-node" className="text-right">
              Target Module
            </Label>
            <Select value={targetNode} onValueChange={setTargetNode}>
              <SelectTrigger id="target-node" className="col-span-3">
                <SelectValue placeholder="Select target module" />
              </SelectTrigger>
              <SelectContent>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.data.label} ({node.data.type})
                    {nodeNeedsRecalculation(node.id) && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Needs update
                      </Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="target-input" className="text-right">
              Input
            </Label>
            <Select value={targetInput} onValueChange={setTargetInput} disabled={!targetNode}>
              <SelectTrigger id="target-input" className="col-span-3">
                <SelectValue placeholder="Select input" />
              </SelectTrigger>
              <SelectContent>
                {getTargetInputs().map((input) => (
                  <SelectItem key={input.id} value={input.id}>
                    {input.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end mt-2">
            <Button
              onClick={handleAddConnection}
              disabled={!sourceNode || !sourceOutput || !targetNode || !targetInput}
            >
              Add Connection
            </Button>
          </div>
        </div>

        {edges.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Existing Connections</h3>
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {edges.map((edge) => (
                    <tr key={edge.id} className="border-b last:border-b-0">
                      <td className="py-2 text-sm">{formatEdgeLabel(edge)}</td>
                      <td className="py-2 w-10 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                          onClick={() => onDeleteConnection(edge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
