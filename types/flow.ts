import type { Node } from "reactflow"

export type ModuleNode = Node<{
  label: string
  type: string
  description: string
  inputs: Record<string, any>
  outputs: Record<string, any>
  defaultInputs: Record<string, any>
  functionCode: string
  function: (inputs: any) => any
  value: any
  isUserAdded?: boolean
  isFromLibrary?: boolean
  onDelete?: (nodeId: string) => void
  onCancel?: (nodeId: string) => void
  needsRecalculation?: boolean
  category?: string
}>
