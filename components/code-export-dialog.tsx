"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Copy, Check, Download } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Node, Edge } from "reactflow"

interface CodeExportDialogProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
}

export function CodeExportDialog({ isOpen, onClose, nodes, edges }: CodeExportDialogProps) {
  const [activeTab, setActiveTab] = useState("typescript")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Generate TypeScript code representation of the flowchart
  const generateTypeScriptCode = () => {
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
`
  }

  // Generate JavaScript code representation of the flowchart
  const generateJavaScriptCode = () => {
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

  // Get the code based on the active tab
  const getCode = () => {
    if (activeTab === "typescript") {
      return generateTypeScriptCode()
    } else {
      return generateJavaScriptCode()
    }
  }

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(getCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Code copied",
      description: "Flowchart code has been copied to clipboard",
    })
  }

  // Handle download as file
  const handleDownload = () => {
    const blob = new Blob([getCode()], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeTab === "typescript" ? "flowchart.ts" : "flowchart.js"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Code downloaded",
      description: `Flowchart code has been downloaded as a ${activeTab === "typescript" ? "TypeScript" : "JavaScript"} file`,
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Export Flowchart as Code</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
          </TabsList>

          <TabsContent value="typescript" className="space-y-4 mt-4">
            <div className="flex justify-between">
              <Label>TypeScript Code</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-1">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <Textarea value={generateTypeScriptCode()} readOnly className="font-mono text-sm h-[400px] overflow-auto" />
          </TabsContent>

          <TabsContent value="javascript" className="space-y-4 mt-4">
            <div className="flex justify-between">
              <Label>JavaScript Code</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex items-center gap-1">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center gap-1">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
            <Textarea value={generateJavaScriptCode()} readOnly className="font-mono text-sm h-[400px] overflow-auto" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
