import type { Node, Edge } from "reactflow"

// Generate TypeScript code representation of the flowchart
export function generateTypeScriptCode(nodes: Node[], edges: Edge[]): string {
  // Create a clean version of nodes without circular references
  const cleanNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      function: undefined, // Don't include the function in the code
    },
  }))

  return `// Generated Flowchart Code
import type { Node, Edge } from "reactflow";

// Nodes
export const nodes: Node[] = ${JSON.stringify(cleanNodes, null, 2)};

// Edges
export const edges: Edge[] = ${JSON.stringify(edges, null, 2)};

// To use this code:
// 1. Import the nodes and edges
// 2. Recreate functions from functionCode
// nodes.forEach(node => {
//   if (node.data.functionCode) {
//     node.data.function = new Function("inputs", node.data.functionCode);
//   }
// });
`
}

// Generate JavaScript code representation of the flowchart
export function generateJavaScriptCode(nodes: Node[], edges: Edge[]): string {
  // Create a clean version of nodes without circular references
  const cleanNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      function: undefined, // Don't include the function in the code
    },
  }))

  return `// Generated Flowchart Code

// Nodes
export const nodes = ${JSON.stringify(cleanNodes, null, 2)};

// Edges
export const edges = ${JSON.stringify(edges, null, 2)};

// Recreate functions from functionCode
nodes.forEach(node => {
  if (node.data.functionCode) {
    node.data.function = new Function("inputs", node.data.functionCode);
  }
});
`
}

// Parse flowchart code and return nodes and edges
export function parseFlowchartCode(code: string): { nodes: Node[]; edges: Edge[] } {
  try {
    // Extract nodes
    const nodesMatch = code.match(/export const nodes[^[]*(\[[\s\S]*?\]);/m)
    const nodesStr = nodesMatch ? nodesMatch[1] : "[]"

    // Extract edges
    const edgesMatch = code.match(/export const edges[^[]*(\[[\s\S]*?\]);/m)
    const edgesStr = edgesMatch ? edgesMatch[1] : "[]"

    // Parse the extracted JSON
    const nodes = JSON.parse(nodesStr)
    const edges = JSON.parse(edgesStr)

    // Recreate function objects from functionCode
    nodes.forEach((node: any) => {
      if (node.data.functionCode) {
        node.data.function = new Function("inputs", node.data.functionCode)
      }
    })

    return { nodes, edges }
  } catch (error) {
    console.error("Error parsing flowchart code:", error)
    return { nodes: [], edges: [] }
  }
}
