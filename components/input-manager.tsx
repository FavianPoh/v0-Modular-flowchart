"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, MoveVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface InputManagerProps {
  inputs: Record<string, any> // Changed from string[] to Record<string, any>
  onChange: (inputs: Record<string, any>) => void // Changed return type
  defaultInputs?: Record<string, any>
  showModifiedIndicator?: boolean
}

export function InputManager({ inputs, onChange, defaultInputs, showModifiedIndicator }: InputManagerProps) {
  const [newInputName, setNewInputName] = useState("")
  const [newInputValue, setNewInputValue] = useState("")
  const [error, setError] = useState("")

  const handleAddInput = () => {
    if (!newInputName.trim()) {
      setError("Input name cannot be empty")
      return
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newInputName)) {
      setError("Input name must start with a letter and contain only letters, numbers, and underscores")
      return
    }

    if (inputs[newInputName] !== undefined) {
      setError("Input name already exists")
      return
    }

    const updatedInputs = {
      ...inputs,
      [newInputName]: newInputValue || 0,
    }

    onChange(updatedInputs)
    setNewInputName("")
    setNewInputValue("")
    setError("")
  }

  const handleRemoveInput = (name: string) => {
    const { [name]: _, ...rest } = inputs
    onChange(rest)
  }

  const handleInputChange = (name: string, value: string) => {
    onChange({
      ...inputs,
      [name]: value,
    })
  }

  const handleRenameInput = (oldName: string, newName: string) => {
    if (!newName.trim()) {
      return // Don't rename to empty string
    }

    if (oldName === newName) return

    // Only validate if the name actually changed
    if (oldName !== newName) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newName)) {
        setError("Input name must start with a letter and contain only letters, numbers, and underscores")
        return
      }

      if (inputs[newName] !== undefined) {
        setError("Input name already exists")
        return
      }
    }

    // Create a new object with the renamed key
    const newInputs: Record<string, any> = {}
    Object.entries(inputs).forEach(([key, value]) => {
      if (key === oldName) {
        newInputs[newName] = value
      } else {
        newInputs[key] = value
      }
    })

    onChange(newInputs)
    setError("")
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Object.entries(inputs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const reorderedInputs = Object.fromEntries(items)
    onChange(reorderedInputs)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Module Inputs</Label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="inputs">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {Object.entries(inputs).map(([name, value], index) => {
                  // Check if this value is modified from default
                  const isModified =
                    showModifiedIndicator &&
                    defaultInputs &&
                    (typeof value === "number" && typeof defaultInputs[name] === "number"
                      ? Math.abs(value - defaultInputs[name]) > 0.000001
                      : JSON.stringify(value) !== JSON.stringify(defaultInputs[name]))

                  return (
                    <Draggable key={name} draggableId={name} index={index}>
                      {(provided) => (
                        <Card ref={provided.innerRef} {...provided.draggableProps} className="border border-gray-200">
                          <CardContent className="p-2 flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-move">
                              <MoveVertical className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 flex-1">
                              <Input
                                value={name}
                                onChange={(e) => handleRenameInput(name, e.target.value)}
                                placeholder="Name"
                                className="text-sm"
                                onBlur={(e) => {
                                  // If the input is invalid, revert to the original name
                                  if (
                                    !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(e.target.value) ||
                                    inputs[e.target.value] !== undefined
                                  ) {
                                    e.target.value = name
                                  }
                                }}
                              />
                              <Input
                                value={value}
                                onChange={(e) => handleInputChange(name, e.target.value)}
                                placeholder="Value"
                                className="text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100"
                              onClick={() => handleRemoveInput(name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
        <Input
          value={newInputName}
          onChange={(e) => setNewInputName(e.target.value)}
          placeholder="New input name"
          className="text-sm"
        />
        <Input
          value={newInputValue}
          onChange={(e) => setNewInputValue(e.target.value)}
          placeholder="Default value"
          className="text-sm"
        />
        <Button variant="outline" size="sm" onClick={handleAddInput} className="flex items-center gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
