"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InputManagerProps {
  inputs: Record<string, any>
  onChange: (inputs: Record<string, any>) => void
  defaultInputs?: Record<string, any>
  showModifiedIndicator?: boolean
}

export function InputManager({ inputs, onChange, defaultInputs, showModifiedIndicator = false }: InputManagerProps) {
  const [localInputs, setLocalInputs] = useState<Record<string, any>>(inputs)
  const [newInputName, setNewInputName] = useState("")
  const [newInputValue, setNewInputValue] = useState(0)
  const [editingInput, setEditingInput] = useState<string | null>(null)
  const [editedNames, setEditedNames] = useState<Record<string, string>>({})

  // Handle input change
  const handleInputChange = useCallback(
    (key: string, value: any) => {
      // Convert to number if possible
      const parsedValue = !isNaN(Number.parseFloat(value)) ? Number.parseFloat(value) : value

      const newInputs = {
        ...localInputs,
        [key]: parsedValue,
      }

      setLocalInputs(newInputs)
      onChange(newInputs)
    },
    [localInputs, onChange],
  )

  // Check if an input has been modified from its default
  const isInputModified = useCallback(
    (key: string) => {
      if (!defaultInputs || defaultInputs[key] === undefined) return false

      if (typeof localInputs[key] === "number" && typeof defaultInputs[key] === "number") {
        return Math.abs(localInputs[key] - defaultInputs[key]) > 0.000001
      }
      return JSON.stringify(localInputs[key]) !== JSON.stringify(defaultInputs[key])
    },
    [defaultInputs, localInputs],
  )

  const handleAddInput = () => {
    if (newInputName.trim()) {
      onChange({
        ...inputs,
        [newInputName.trim()]: newInputValue,
      })
      setNewInputName("")
      setNewInputValue(0)
    }
  }

  const handleRenameInput = (oldName: string) => {
    const newName = editedNames[oldName]
    if (newName && newName !== oldName && newName.trim() !== "") {
      const newInputs = { ...localInputs }
      newInputs[newName] = newInputs[oldName]
      delete newInputs[oldName]
      setLocalInputs(newInputs)
      onChange(newInputs)
      setEditingInput(null)
      setEditedNames((prev) => {
        const { [oldName]: removed, ...rest } = prev
        return rest
      })
    } else {
      setEditingInput(null)
    }
  }

  const renderInputControl = useCallback(
    (key: string, value: any) => {
      const isModified = showModifiedIndicator && isInputModified(key)
      const isEditingName = editingInput === key

      const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          handleRenameInput(key)
        }
      }

      return (
        <div className="space-y-2 border p-3 rounded-md">
          <div className="flex items-center justify-between">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={editedNames[key] || key}
                  onChange={(e) => setEditedNames((prev) => ({ ...prev, [key]: e.target.value }))}
                  onBlur={() => handleRenameInput(key)}
                  onKeyDown={handleKeyDown}
                  className="w-full text-sm"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor={`input-${key}`}
                  className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}
                  onClick={() => {
                    setEditingInput(key)
                    setEditedNames((prev) => ({ ...prev, [key]: key }))
                  }}
                >
                  {key}
                  {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setEditingInput(key)
                    setEditedNames((prev) => ({ ...prev, [key]: key }))
                  }}
                >
                  ✏️
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500"
              onClick={() => {
                const newInputs = { ...localInputs }
                delete newInputs[key]
                setLocalInputs(newInputs)
                onChange(newInputs)
              }}
            >
              ✕
            </Button>
          </div>

          {typeof value === "number" && (
            <div className="space-y-2">
              <Input
                id={`input-${key}`}
                type="number"
                value={value}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full"
              />
              {value >= 0 && value <= 100 && Number.isInteger(value) && (
                <Slider
                  value={[value]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleInputChange(key, values[0])}
                />
              )}
            </div>
          )}

          {typeof value === "boolean" && (
            <Switch checked={value} onCheckedChange={(checked) => handleInputChange(key, checked)} />
          )}

          {typeof value === "string" &&
            (value.startsWith("option") && !isNaN(Number.parseInt(value.slice(6))) ? (
              <Select value={value} onValueChange={(value) => handleInputChange(key, value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={value} onChange={(e) => handleInputChange(key, e.target.value)} className="w-full" />
            ))}
        </div>
      )
    },
    [editingInput, editedNames, handleInputChange, isInputModified, localInputs, onChange, showModifiedIndicator],
  )

  return (
    <div className="space-y-4">
      {Object.entries(inputs).map(([key, value]) => (
        <div key={key}>{renderInputControl(key, value)}</div>
      ))}
      {/* Add new input section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-sm font-medium mb-2">Add New Input</h3>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Input name"
            value={newInputName}
            onChange={(e) => setNewInputName(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            placeholder="Value"
            value={newInputValue}
            onChange={(e) => setNewInputValue(Number(e.target.value))}
            className="w-24"
          />
          <Button onClick={handleAddInput} size="sm">
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
