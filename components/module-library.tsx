"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Save, Trash2, Code } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Node } from "reactflow"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the module library item type
export interface ModuleLibraryItem {
  id: string
  name: string
  type: string
  description: string
  inputs: Record<string, any>
  functionCode: string
  createdAt: number
  category: string
}

interface ModuleLibraryProps {
  isOpen: boolean
  onClose: () => void
  onAddModule: (module: ModuleLibraryItem) => void
  currentNodes: Node[]
}

const MODULE_LIBRARY_KEY = "modular-flowchart-library"

export function ModuleLibrary({ isOpen, onClose, onAddModule, currentNodes }: ModuleLibraryProps) {
  const [library, setLibrary] = useState<ModuleLibraryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedModule, setSelectedModule] = useState<ModuleLibraryItem | null>(null)
  const [showCode, setShowCode] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string>("")
  const { toast } = useToast()

  // Refs to prevent update loops
  const isSavingRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const libraryLoadedRef = useRef(false)

  // Load the module library from localStorage only once when dialog opens
  useEffect(() => {
    if (isOpen && !libraryLoadedRef.current) {
      try {
        const savedLibrary = localStorage.getItem(MODULE_LIBRARY_KEY)
        if (savedLibrary) {
          setLibrary(JSON.parse(savedLibrary))
        }
        libraryLoadedRef.current = true
      } catch (error) {
        console.error("Error loading module library:", error)
      }
    }

    // Reset state when dialog closes
    if (!isOpen) {
      setSearchTerm("")
      setSelectedNodeId("")
      setShowCode(false)
      isInitialLoadRef.current = true
    }
  }, [isOpen])

  // Save the current module to the library
  const saveCurrentModuleToLibrary = () => {
    if (!selectedNodeId || isSavingRef.current) return

    const node = currentNodes.find((n) => n.id === selectedNodeId)
    if (!node) return

    try {
      isSavingRef.current = true
      const moduleData = node.data

      // Create a new library item
      const newItem: ModuleLibraryItem = {
        id: `lib-${Date.now()}`,
        name: moduleData.label,
        type: moduleData.type,
        description: moduleData.description,
        inputs: { ...moduleData.inputs },
        functionCode: moduleData.functionCode,
        createdAt: Date.now(),
        category: getCategoryFromType(moduleData.type),
      }

      // Add to library
      const updatedLibrary = [...library, newItem]
      setLibrary(updatedLibrary)

      // Save to localStorage
      localStorage.setItem(MODULE_LIBRARY_KEY, JSON.stringify(updatedLibrary))

      toast({
        title: "Module saved to library",
        description: `${moduleData.label} has been added to your module library`,
      })

      // Reset selection
      setSelectedNodeId("")

      // Use setTimeout to ensure state updates don't cascade
      setTimeout(() => {
        isSavingRef.current = false
      }, 0)
    } catch (error) {
      console.error("Error saving to library:", error)
      isSavingRef.current = false
    }
  }

  // Delete a module from the library
  const deleteFromLibrary = (id: string) => {
    if (isSavingRef.current) return

    try {
      isSavingRef.current = true
      const updatedLibrary = library.filter((item) => item.id !== id)

      // Use a local variable to avoid state update loops
      const wasSelected = selectedModule?.id === id

      setLibrary(updatedLibrary)
      localStorage.setItem(MODULE_LIBRARY_KEY, JSON.stringify(updatedLibrary))

      if (wasSelected) {
        setSelectedModule(null)
      }

      toast({
        title: "Module removed",
        description: "Module has been removed from your library",
      })

      // Use setTimeout to ensure state updates don't cascade
      setTimeout(() => {
        isSavingRef.current = false
      }, 0)
    } catch (error) {
      console.error("Error deleting from library:", error)
      isSavingRef.current = false
    }
  }

  // Get a category based on module type
  const getCategoryFromType = (type: string): string => {
    switch (type) {
      case "input":
        return "Data Sources"
      case "math":
      case "logic":
        return "Calculations"
      case "filter":
      case "transform":
        return "Data Processing"
      case "output":
        return "Outputs"
      default:
        return "Custom"
    }
  }

  // Filter modules based on search and active tab
  const filteredModules = library.filter((module) => {
    const matchesSearch =
      searchTerm === "" ||
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "data" && module.category === "Data Sources") ||
      (activeTab === "calc" && module.category === "Calculations") ||
      (activeTab === "process" && module.category === "Data Processing") ||
      (activeTab === "output" && module.category === "Outputs") ||
      (activeTab === "custom" && module.category === "Custom")

    return matchesSearch && matchesTab
  })

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

  // Handle module selection with debounce to prevent update loops
  const handleModuleSelect = (module: ModuleLibraryItem) => {
    if (selectedModule?.id === module.id) return

    // Use setTimeout to ensure state updates don't cascade
    setTimeout(() => {
      setSelectedModule(module)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Module Library</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_2fr] gap-4 h-[500px]">
          {/* Left side - Module list */}
          <div className="border rounded-md flex flex-col">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search modules..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1">
              <TabsList className="grid grid-cols-6 h-auto p-1 m-2">
                <TabsTrigger value="all" className="text-xs py-1 px-2">
                  All
                </TabsTrigger>
                <TabsTrigger value="data" className="text-xs py-1 px-2">
                  Data
                </TabsTrigger>
                <TabsTrigger value="calc" className="text-xs py-1 px-2">
                  Calc
                </TabsTrigger>
                <TabsTrigger value="process" className="text-xs py-1 px-2">
                  Process
                </TabsTrigger>
                <TabsTrigger value="output" className="text-xs py-1 px-2">
                  Output
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs py-1 px-2">
                  Custom
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 p-2">
                {filteredModules.length > 0 ? (
                  <div className="space-y-2">
                    {filteredModules.map((module) => (
                      <Card
                        key={module.id}
                        className={`cursor-pointer ${selectedModule?.id === module.id ? "border-primary" : ""}`}
                        onClick={() => handleModuleSelect(module)}
                      >
                        <CardContent className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-sm">{module.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                            </div>
                            <Badge className={getTypeColor(module.type)}>{module.type}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">No modules found</p>
                  </div>
                )}
              </ScrollArea>
            </Tabs>

            <div className="p-2 border-t">
              <Label className="text-xs text-muted-foreground mb-1 block">Save current module to library</Label>
              <div className="flex gap-2">
                <Select value={selectedNodeId} onValueChange={setSelectedNodeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.data.label} ({node.data.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={saveCurrentModuleToLibrary}
                  disabled={!selectedNodeId || isSavingRef.current}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right side - Module details */}
          <div className="border rounded-md">
            {selectedModule ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedModule.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={getTypeColor(selectedModule.type)}>{selectedModule.type}</Badge>
                        <Badge variant="outline">{selectedModule.category}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setShowCode(!showCode)}>
                        <Code className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFromLibrary(selectedModule.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        disabled={isSavingRef.current}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedModule.description}</p>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {showCode ? (
                    <div className="space-y-2">
                      <Label>Function Code</Label>
                      <pre className="bg-slate-50 p-3 rounded-md text-xs overflow-auto max-h-[300px]">
                        {selectedModule.functionCode}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Inputs</Label>
                        <div className="mt-1 space-y-1">
                          {Object.entries(selectedModule.inputs).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                              <span className="text-sm font-medium">{key}</span>
                              <span className="text-sm text-muted-foreground">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t">
                  <Button
                    className="w-full"
                    onClick={() => {
                      onAddModule(selectedModule)
                      onClose()
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add to Flowchart
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">No module selected</h3>
                  <p className="text-sm text-muted-foreground mt-1">Select a module from the library to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
