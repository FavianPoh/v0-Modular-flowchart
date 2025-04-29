import type { Node, Edge } from "reactflow"

// Define types for metric data
export interface MetricNode {
  id: string
  name: string
  moduleId: string
  moduleName: string
  value: number | string
  type: "input" | "output"
  dependencies: string[]
  dependents: string[]
}

export interface MetricEdge {
  id: string
  source: string
  target: string
}

export interface MetricGraph {
  nodes: MetricNode[]
  edges: MetricEdge[]
}

// Extract all metrics from the flowchart nodes
export function extractMetrics(nodes: Node[], edges: Edge[]): MetricGraph {
  const metricNodes: MetricNode[] = []
  const metricEdges: MetricEdge[] = []
  const metricMap = new Map<string, MetricNode>()

  // First, extract all metrics from nodes
  nodes.forEach((node) => {
    // Extract inputs
    if (node.data.inputs) {
      Object.entries(node.data.inputs).forEach(([key, value]) => {
        const metricId = `${node.id}-input-${key}`
        const metricNode: MetricNode = {
          id: metricId,
          name: key,
          moduleId: node.id,
          moduleName: node.data.label,
          value: value as number | string,
          type: "input",
          dependencies: [],
          dependents: [],
        }
        metricNodes.push(metricNode)
        metricMap.set(metricId, metricNode)
      })
    }

    // Extract outputs
    if (node.data.outputs) {
      Object.entries(node.data.outputs).forEach(([key, value]) => {
        const metricId = `${node.id}-output-${key}`
        const metricNode: MetricNode = {
          id: metricId,
          name: key,
          moduleId: node.id,
          moduleName: node.data.label,
          value: value as number | string,
          type: "output",
          dependencies: [],
          dependents: [],
        }
        metricNodes.push(metricNode)
        metricMap.set(metricId, metricNode)
      })
    }
  })

  // Then analyze dependencies using edges
  edges.forEach((edge) => {
    if (edge.sourceHandle && edge.targetHandle) {
      const sourceMetricParts = edge.sourceHandle.split("-")
      const targetMetricParts = edge.targetHandle.split("-")

      if (sourceMetricParts.length > 1 && targetMetricParts.length > 1) {
        const sourceMetricName = sourceMetricParts[1]
        const targetMetricName = targetMetricParts[1]

        const sourceMetricId = `${edge.source}-output-${sourceMetricName}`
        const targetMetricId = `${edge.target}-input-${targetMetricName}`

        // Add edge between metrics
        const metricEdgeId = `${sourceMetricId}-to-${targetMetricId}`
        metricEdges.push({
          id: metricEdgeId,
          source: sourceMetricId,
          target: targetMetricId,
        })

        // Update dependencies and dependents
        const sourceMetric = metricMap.get(sourceMetricId)
        const targetMetric = metricMap.get(targetMetricId)

        if (sourceMetric && targetMetric) {
          sourceMetric.dependents.push(targetMetricId)
          targetMetric.dependencies.push(sourceMetricId)
        }
      }
    }
  })

  return { nodes: metricNodes, edges: metricEdges }
}

// Get all metrics that feed into a specific metric
export function getMetricDependencies(metricId: string, metricGraph: MetricGraph): MetricNode[] {
  const metric = metricGraph.nodes.find((n) => n.id === metricId)
  if (!metric) return []

  return metric.dependencies
    .map((depId) => metricGraph.nodes.find((n) => n.id === depId))
    .filter(Boolean) as MetricNode[]
}

// Get all metrics that depend on a specific metric
export function getMetricDependents(metricId: string, metricGraph: MetricGraph): MetricNode[] {
  const metric = metricGraph.nodes.find((n) => n.id === metricId)
  if (!metric) return []

  return metric.dependents.map((depId) => metricGraph.nodes.find((n) => n.id === depId)).filter(Boolean) as MetricNode[]
}

// Get all unique metric names across the entire graph
export function getUniqueMetricNames(metricGraph: MetricGraph): string[] {
  const names = new Set<string>()
  metricGraph.nodes.forEach((node) => {
    names.add(node.name)
  })
  return Array.from(names).sort()
}

// Filter metrics by name
export function filterMetricsByName(metricGraph: MetricGraph, name: string): MetricGraph {
  if (!name) return metricGraph

  const filteredNodes = metricGraph.nodes.filter((node) => node.name.toLowerCase().includes(name.toLowerCase()))

  const nodeIds = new Set(filteredNodes.map((n) => n.id))

  const filteredEdges = metricGraph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))

  return { nodes: filteredNodes, edges: filteredEdges }
}
