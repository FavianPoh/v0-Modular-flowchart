import type { Node, Edge } from "reactflow"

// Execute a module's function with its current inputs
function executeModule(moduleData: any) {
  try {
    if (typeof moduleData.function === "function") {
      // Create a clean copy of inputs to prevent reference issues
      const inputsCopy = JSON.parse(JSON.stringify(moduleData.inputs || {}))

      // Debug log to verify inputs are being used
      console.log(`Executing module ${moduleData.label || "unknown"} with inputs:`, inputsCopy)

      const outputs = moduleData.function(inputsCopy)

      // Debug log for outputs
      console.log(`Module execution produced outputs:`, outputs)

      return outputs
    }

    // If no function is defined, return the default outputs
    return moduleData.outputs || {}
  } catch (error) {
    console.error("Error executing module:", error)
    return { error: "Execution failed" }
  }
}

// Build a dependency graph from nodes and edges
export function buildDependencyGraph(nodes: Node[], edges: Edge[]) {
  const graph: Record<string, string[]> = {}
  const reverseGraph: Record<string, string[]> = {}

  // Initialize graph with all nodes
  nodes.forEach((node) => {
    graph[node.id] = []
    reverseGraph[node.id] = []
  })

  // Add dependencies based on edges
  edges.forEach((edge) => {
    const sourceId = edge.source
    const targetId = edge.target

    // Add sourceId as a dependency for targetId
    if (!graph[targetId].includes(sourceId)) {
      graph[targetId].push(sourceId)
    }

    // Add targetId as a dependent of sourceId in reverse graph
    if (!reverseGraph[sourceId].includes(targetId)) {
      reverseGraph[sourceId].push(targetId)
    }
  })

  return { graph, reverseGraph }
}

// Perform topological sort to determine execution order
export function topologicalSort(graph: Record<string, string[]>) {
  const visited = new Set<string>()
  const temp = new Set<string>()
  const order: string[] = []

  function visit(nodeId: string) {
    // If node is in temp, we have a cycle
    if (temp.has(nodeId)) {
      console.warn("Cycle detected in module dependencies")
      return
    }

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
    order.push(nodeId)
  }

  // Visit all nodes
  for (const nodeId in graph) {
    if (!visited.has(nodeId)) {
      visit(nodeId)
    }
  }

  return order
}

// Enhanced version to ensure all dependencies are updated
export function updateNodeInputs(nodes: Node[], edges: Edge[], changedNodeId?: string) {
  console.log("Starting recalculation", changedNodeId ? `from changed node ${changedNodeId}` : "for all nodes")

  // Create a deep copy of nodes to avoid reference issues
  const nodesCopy = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      inputs: JSON.parse(JSON.stringify(node.data.inputs || {})),
      outputs: JSON.parse(JSON.stringify(node.data.outputs || {})),
      // Preserve function
      function: node.data.function,
      // Reset impact flag
      wasImpacted: false,
    },
  }))

  // Create a map for quick node lookup
  const nodeMap = new Map(nodesCopy.map((node) => [node.id, node]))

  // Group edges by target node
  const edgesByTarget: Record<string, Edge[]> = {}
  edges.forEach((edge) => {
    if (!edgesByTarget[edge.target]) {
      edgesByTarget[edge.target] = []
    }
    edgesByTarget[edge.target].push(edge)
  })

  // Build dependency graph
  const { graph, reverseGraph } = buildDependencyGraph(nodesCopy, edges)

  // Get execution order
  const executionOrder = topologicalSort(graph)

  // If we have a specific changed node, determine all affected downstream nodes
  const nodesToUpdate = new Set<string>()

  if (changedNodeId) {
    // Add the changed node itself
    nodesToUpdate.add(changedNodeId)

    // Function to recursively add all downstream nodes
    function addDownstreamNodes(nodeId: string) {
      const dependents = reverseGraph[nodeId] || []

      for (const depId of dependents) {
        if (!nodesToUpdate.has(depId)) {
          nodesToUpdate.add(depId)
          // Recursively add this node's dependents
          addDownstreamNodes(depId)
        }
      }
    }

    // Add all nodes affected by the change
    addDownstreamNodes(changedNodeId)

    console.log(`Found ${nodesToUpdate.size} nodes to update including node ${changedNodeId}`)
  } else {
    // Update all nodes if no specific changed node
    executionOrder.forEach((nodeId) => nodesToUpdate.add(nodeId))
  }

  // Track which nodes actually changed
  const updatedNodeIds = new Set<string>()

  // Execute nodes in order
  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId)
    if (!node) continue

    // Skip nodes that don't need recalculation
    if (changedNodeId && !nodesToUpdate.has(nodeId)) {
      continue
    }

    // Get edges targeting this node
    const targetingEdges = edgesByTarget[nodeId] || []
    let inputsChanged = false

    // Update inputs based on source node outputs
    targetingEdges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.source)
      if (!sourceNode) return

      // Get the most up-to-date source outputs
      const sourceOutputs = sourceNode.data.outputs || {}

      // Extract input and output keys from handles
      const sourceOutputKey = edge.sourceHandle?.replace("output-", "")
      const targetInputKey = edge.targetHandle?.replace("input-", "")

      if (sourceOutputKey && targetInputKey && sourceOutputs[sourceOutputKey] !== undefined) {
        // Always update the input to ensure the latest values are used
        const oldValue = JSON.stringify(node.data.inputs[targetInputKey])
        const newValue = JSON.stringify(sourceOutputs[sourceOutputKey])

        if (oldValue !== newValue) {
          // Update the input
          node.data.inputs[targetInputKey] = JSON.parse(newValue)
          inputsChanged = true
          console.log(`Updated input ${targetInputKey} of node ${nodeId} from ${oldValue} to ${newValue}`)
        }
      }
    })

    // Always recalculate outputs if this node is in the update list
    if (inputsChanged || nodesToUpdate.has(nodeId)) {
      try {
        // Execute the function to get new outputs
        const outputs = executeModule(node.data)

        // Check if outputs actually changed
        const outputsChanged = !Object.keys(outputs).every(
          (key) => JSON.stringify(outputs[key]) === JSON.stringify(node.data.outputs[key]),
        )

        if (outputsChanged) {
          node.data.outputs = outputs
          updatedNodeIds.add(nodeId)

          // Mark this node as impacted if it's not the original changed node
          if (nodeId !== changedNodeId) {
            node.data.wasImpacted = true
          }

          console.log(`Module ${nodeId} (${node.data.label}) output updated`)
        }
      } catch (error) {
        console.error(`Error executing module ${nodeId}:`, error)
      }
    }
  }

  // Add a flag to show recalculation for visual feedback
  nodesCopy.forEach((node) => {
    if (updatedNodeIds.has(node.id)) {
      node.data.wasRecalculated = true

      // Clear the flag after a short delay for animation
      setTimeout(() => {
        const element = document.getElementById(`node-${node.id}`)
        if (element) {
          element.classList.remove("recalculated")
        }
      }, 1000)
    }
  })

  console.log(`Recalculation complete, ${updatedNodeIds.size} nodes updated`)

  // Only create a new array if some nodes actually changed
  if (updatedNodeIds.size > 0) {
    return nodesCopy
  }

  // Return original nodes if nothing changed
  return nodes
}

// Recalculate all modules in the flowchart
export function recalculateFlowchart(nodes: Node[], edges: Edge[], changedNodeId?: string) {
  try {
    return updateNodeInputs(nodes, edges, changedNodeId)
  } catch (error) {
    console.error("Error in recalculateFlowchart:", error)
    return nodes // Return original nodes on error
  }
}

// Find all nodes that depend on the given node
export function findDependentNodes(nodeId: string, nodes: Node[], edges: Edge[]) {
  const dependents: string[] = []
  const visited = new Set<string>()

  function traverse(currentId: string) {
    if (visited.has(currentId)) return
    visited.add(currentId)

    // Find all edges where this node is the source
    const outgoingEdges = edges.filter((edge) => edge.source === currentId)

    for (const edge of outgoingEdges) {
      const targetId = edge.target
      if (!dependents.includes(targetId)) {
        dependents.push(targetId)
      }
      traverse(targetId)
    }
  }

  traverse(nodeId)
  return dependents
}

export { executeModule }
