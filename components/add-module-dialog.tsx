"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputManager } from "@/components/input-manager"
import { FormulaBuilder } from "@/components/formula-builder"

interface AddModuleDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddModule: () => void
  newModuleType: string
  setNewModuleType: (type: string) => void
  newModuleName: string
  setNewModuleName: (name: string) => void
  newModuleDescription: string
  setNewModuleDescription: (description: string) => void
  newModuleInputs: Record<string, any>
  setNewModuleInputs: (inputs: Record<string, any>) => void
  newModuleFormula: string
  newModuleFunctionCode: string
  handleFormulaChange: (formula: string, functionCode: string) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AddModuleDialog({
  isOpen,
  onClose,
  onAddModule,
  newModuleType,
  setNewModuleType,
  newModuleName,
  setNewModuleName,
  newModuleDescription,
  setNewModuleDescription,
  newModuleInputs,
  setNewModuleInputs,
  newModuleFormula,
  newModuleFunctionCode,
  handleFormulaChange,
  activeTab,
  setActiveTab,
}: AddModuleDialogProps) {
  const [nameError, setNameError] = useState("")

  const validateAndSubmit = () => {
    if (!newModuleName.trim()) {
      setNameError("Module name is required")
      return
    }

    setNameError("")
    onAddModule()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Module</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="formula">Formula & Inputs</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="module-type" className="text-right">
                Module Type
              </Label>
              <Select value={newModuleType} onValueChange={setNewModuleType}>
                <SelectTrigger id="module-type" className="col-span-3">
                  <SelectValue placeholder="Select module type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="input">Input</SelectItem>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="logic">Logic</SelectItem>
                  <SelectItem value="transform">Transform</SelectItem>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="output">Output</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="module-name" className="text-right">
                Module Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="module-name"
                  value={newModuleName}
                  onChange={(e) => {
                    setNewModuleName(e.target.value)
                    if (e.target.value.trim()) setNameError("")
                  }}
                  className={nameError ? "border-red-500" : ""}
                />
                {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="module-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="module-description"
                value={newModuleDescription}
                onChange={(e) => setNewModuleDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="formula" className="space-y-4 mt-4">
            <div className="space-y-4">
              <InputManager inputs={newModuleInputs} onChange={setNewModuleInputs} />

              <div className="border-t pt-4">
                <FormulaBuilder
                  inputs={newModuleInputs}
                  initialFormula={newModuleFormula}
                  functionCode={newModuleFunctionCode}
                  onChange={handleFormulaChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={validateAndSubmit}>Add Module</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
