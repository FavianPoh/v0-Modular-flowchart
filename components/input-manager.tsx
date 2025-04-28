"use client"

import { useState } from "react"
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

  // Handle input change
  const handleInputChange = (key: string, value: any) => {
    // Convert to number if possible
    const parsedValue = !isNaN(Number.parseFloat(value)) ? Number.parseFloat(value) : value

    const newInputs = {
      ...localInputs,
      [key]: parsedValue,
    }

    setLocalInputs(newInputs)
    onChange(newInputs)
  }

  // Check if an input has been modified from its default
  const isInputModified = (key: string) => {
    if (!defaultInputs || defaultInputs[key] === undefined) return false

    if (typeof localInputs[key] === "number" && typeof defaultInputs[key] === "number") {
      return Math.abs(localInputs[key] - defaultInputs[key]) > 0.000001
    }
    return JSON.stringify(localInputs[key]) !== JSON.stringify(defaultInputs[key])
  }

  // Render the appropriate input control based on the value type
  const renderInputControl = (key: string, value: any) => {
    const isModified = showModifiedIndicator && isInputModified(key)

    if (typeof value === "number") {
      // For numbers, render a slider for values between 0-100, otherwise a number input
      if (value >= 0 && value <= 100 && Number.isInteger(value)) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
                {key}
                {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
              </Label>
              <span className="text-sm font-mono">{value}</span>
            </div>
            <Slider
              id={`input-${key}`}
              value={[value]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => handleInputChange(key, values[0])}
            />
          </div>
        )
      } else {
        return (
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
              {key}
              {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
            </Label>
            <Input
              id={`input-${key}`}
              type="number"
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="col-span-2"
            />
          </div>
        )
      }
    } else if (typeof value === "boolean") {
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
            {key}
            {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
          </Label>
          <Switch id={`input-${key}`} checked={value} onCheckedChange={(checked) => handleInputChange(key, checked)} />
        </div>
      )
    } else if (typeof value === "string") {
      // Check if it's a select option (e.g., "option1", "option2", "option3")
      if (value.startsWith("option") && !isNaN(Number.parseInt(value.slice(6)))) {
        return (
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
              {key}
              {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
            </Label>
            <Select value={value} onValueChange={(value) => handleInputChange(key, value)}>
              <SelectTrigger id={`input-${key}`} className="col-span-2">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      } else {
        return (
          <div className="grid grid-cols-3 items-center gap-2">
            <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
              {key}
              {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
            </Label>
            <Input
              id={`input-${key}`}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="col-span-2"
            />
          </div>
        )
      }
    } else {
      // For other types, render a simple text input
      return (
        <div className="grid grid-cols-3 items-center gap-2">
          <Label htmlFor={`input-${key}`} className={`text-sm ${isModified ? "text-blue-600 font-medium" : ""}`}>
            {key}
            {isModified && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 inline-block"></span>}
          </Label>
          <Input
            id={`input-${key}`}
            value={String(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="col-span-2"
          />
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(inputs).map(([key, value]) => (
        <div key={key}>{renderInputControl(key, value)}</div>
      ))}
    </div>
  )
}
