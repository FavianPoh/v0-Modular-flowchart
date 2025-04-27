"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type Operator = "+" | "-" | "*" | "/" | "%" | "^" | "(" | ")"
type FormulaItem = { type: "input" | "number" | "operator"; value: string }

interface FormulaBuilderProps {
  inputs: Record<string, any>
  initialFormula?: string
  onChange: (formula: string, functionCode: string) => void
}

export function FormulaBuilder({ inputs, initialFormula, onChange }: FormulaBuilderProps) {
  const [formula, setFormula] = useState<FormulaItem[]>([])
  const [outputName, setOutputName] = useState("result")
  const [previewResult, setPreviewResult] = useState<string | number>("")
  const [previewError, setPreviewError] = useState("")

  // Parse initial formula if provided
  useEffect(() => {
    if (initialFormula && initialFormula.trim()) {
      try {
        // This is a very basic parser and won't handle complex formulas
        // In a real app, you'd want a more robust parser
        const parsed: FormulaItem[] = []
        let currentNumber = ""

        for (let i = 0; i < initialFormula.length; i++) {
          const char = initialFormula[i]

          if ("+-*/^%()".includes(char)) {
            if (currentNumber) {
              parsed.push({ type: "number", value: currentNumber })
              currentNumber = ""
            }
            parsed.push({ type: "operator", value: char as Operator })
          } else if (/[0-9.]/.test(char)) {
            currentNumber += char
          } else if (/[a-zA-Z]/.test(char)) {
            // This is a very simplified approach - won't handle complex variable names
            let varName = char
            while (i + 1 < initialFormula.length && /[a-zA-Z0-9_]/.test(initialFormula[i + 1])) {
              varName += initialFormula[++i]
            }

            if (Object.keys(inputs).includes(varName)) {
              parsed.push({ type: "input", value: varName })
            }
          }
        }

        if (currentNumber) {
          parsed.push({ type: "number", value: currentNumber })
        }

        setFormula(parsed)
      } catch (error) {
        console.error("Failed to parse initial formula:", error)
      }
    }
  }, [initialFormula, inputs])

  // Generate code and update parent when formula changes
  useEffect(() => {
    generateCode()
  }, [formula, outputName])

  const addInput = (inputName: string) => {
    setFormula([...formula, { type: "input", value: inputName }])
  }

  const addNumber = () => {
    setFormula([...formula, { type: "number", value: "0" }])
  }

  const addOperator = (op: Operator) => {
    setFormula([...formula, { type: "operator", value: op }])
  }

  const updateItem = (index: number, value: string) => {
    const newFormula = [...formula]
    newFormula[index] = { ...newFormula[index], value }
    setFormula(newFormula)
  }

  const removeItem = (index: number) => {
    const newFormula = [...formula]
    newFormula.splice(index, 1)
    setFormula(newFormula)
  }

  const generateCode = () => {
    try {
      // Convert formula to JavaScript expression
      let expression = formula
        .map((item) => {
          if (item.type === "input") {
            return `Number(inputs.${item.value})`
          } else if (item.type === "operator" && item.value === "^") {
            return "**" // Convert ^ to ** for JavaScript exponentiation
          } else {
            return item.value
          }
        })
        .join(" ")

      // Handle empty formula
      if (!expression.trim()) {
        expression = "0"
      }

      // Create the function code
      const functionCode = `return { ${outputName}: ${expression} };`

      // Try to evaluate the expression with current inputs
      try {
        const testFunction = new Function("inputs", functionCode)
        const result = testFunction(inputs)
        setPreviewResult(result[outputName])
        setPreviewError("")
      } catch (error) {
        setPreviewError("Invalid formula")
        setPreviewResult("")
      }

      // Pass the generated code to parent
      onChange(expression, functionCode)
    } catch (error) {
      console.error("Error generating code:", error)
      setPreviewError("Error generating code")
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="output-name" className="text-right">
          Output Name
        </Label>
        <Input
          id="output-name"
          value={outputName}
          onChange={(e) => setOutputName(e.target.value)}
          className="col-span-3"
        />
      </div>

      <div className="space-y-2">
        <Label>Formula Builder</Label>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
              {formula.length > 0 ? (
                formula.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {item.type === "input" ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                        {item.value}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ) : item.type === "number" ? (
                      <div className="flex items-center">
                        <Input
                          value={item.value}
                          onChange={(e) => updateItem(index, e.target.value)}
                          className="w-16 h-8 text-sm"
                        />
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100">
                        {item.value}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 rounded-full"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Add inputs, numbers, and operators to build your formula
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-2 block">Add Input</Label>
          <div className="flex gap-2">
            <Select onValueChange={addInput}>
              <SelectTrigger>
                <SelectValue placeholder="Select input" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(inputs).map((input) => (
                  <SelectItem key={input} value={input}>
                    {input}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={addNumber}>
              Number
            </Button>
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Add Operator</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="icon" onClick={() => addOperator("+")}>
              +
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator("-")}>
              -
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator("*")}>
              ×
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator("/")}>
              ÷
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator("^")}>
              ^
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator("(")}>
              (
            </Button>
            <Button variant="outline" size="icon" onClick={() => addOperator(")")}>
              )
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 text-sm">
          <span className="font-medium">Preview:</span>{" "}
          {previewError ? (
            <span className="text-red-500">{previewError}</span>
          ) : (
            <span className="font-mono">
              {outputName} = {previewResult}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
