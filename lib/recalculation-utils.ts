import type { Node, Edge } from "reactflow"

// Execute a module's function with its current inputs
function executeModule(moduleData: any) {
  try {
    if (typeof moduleData.function === "function") {
      // Create a clean copy of inputs to prevent reference issues
      const inputsCopy = JSON.parse(JSON.stringify(moduleData.inputs || {}))
      return moduleData.function(inputsCopy)
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

  // Initialize graph with all nodes
  nodes.forEach((node) => {
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

  return graph
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

// Update node inputs based on connections
export function updateNodeInputs(nodes: Node[], edges: Edge[]) {
  // Create a deep copy of nodes to avoid reference issues
  const nodesCopy = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      inputs: JSON.parse(JSON.stringify(node.data.inputs || {})),
      outputs: JSON.parse(JSON.stringify(node.data.outputs || {})),
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

  // Get execution order
  const graph = buildDependencyGraph(nodesCopy, edges)
  const executionOrder = topologicalSort(graph)

  // Track which nodes actually changed
  const updatedNodeIds = new Set<string>()

  // Execute nodes in order
  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId)
    if (!node) continue

    // Get edges targeting this node
    const targetingEdges = edgesByTarget[nodeId] || []
    let inputsChanged = false

    // Update inputs based on source node outputs
    targetingEdges.forEach((edge) => {
      const sourceNode = nodeMap.get(edge.source)
      if (!sourceNode) return

      // Calculate source node outputs
      const sourceOutputs = executeModule(sourceNode.data)

      // Extract input and output keys from handles
      const sourceOutputKey = edge.sourceHandle?.replace("output-", "")
      const targetInputKey = edge.targetHandle?.replace("input-", "")

      if (sourceOutputKey && targetInputKey && sourceOutputs[sourceOutputKey] !== undefined) {
        // Check if the input value would actually change
        if (JSON.stringify(node.data.inputs[targetInputKey]) !== JSON.stringify(sourceOutputs[sourceOutputKey])) {
          // Update the input
          node.data.inputs[targetInputKey] = sourceOutputs[sourceOutputKey]
          inputsChanged = true
          updatedNodeIds.add(nodeId)
        }
      }
    })

    // Only recalculate outputs if inputs changed
    if (inputsChanged || updatedNodeIds.has(nodeId)) {
      const outputs = executeModule(node.data)
      if (JSON.stringify(outputs) !== JSON.stringify(node.data.outputs)) {
        node.data.outputs = outputs
        updatedNodeIds.add(nodeId)
      }
    }
  }

  // Only create a new array if some nodes actually changed
  if (updatedNodeIds.size > 0) {
    return nodesCopy
  }

  // Return original nodes if nothing changed
  return nodes
}

// Recalculate all modules in the flowchart
export function recalculateFlowchart(nodes: Node[], edges: Edge[]) {
  try {
    return updateNodeInputs(nodes, edges)
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
      dependents.push(targetId)
      traverse(targetId)
    }
  }

  traverse(nodeId)
  return dependents
}

export { executeModule }
