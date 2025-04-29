"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, ChevronDown, ChevronRight, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type Operator = "+" | "-" | "*" | "/" | "%" | "^" | "(" | ")" | "&&" | "||" | ">" | "<" | ">=" | "<=" | "==" | "!="
type MathFunction = "sqrt" | "abs" | "round" | "floor" | "ceil" | "sin" | "cos" | "tan" | "max" | "min" | "pow" | "if"
type FormulaItem = {
  type: "input" | "number" | "operator" | "function" | "string" | "boolean" | "ifStatement"
  value: string
  params?: FormulaItem[][] // For if statements or functions with multiple parameters
}

interface FormulaBuilderProps {
  inputs: Record<string, any>
  initialFormula?: string
  functionCode?: string
  onChange: (formula: string, functionCode: string) => void
  readOnly?: boolean
}

export function FormulaBuilder({
  inputs,
  initialFormula,
  functionCode,
  onChange,
  readOnly = false,
}: FormulaBuilderProps) {
  const [formula, setFormula] = useState<FormulaItem[]>([])
  const [outputName, setOutputName] = useState("result")
  const [previewResult, setPreviewResult] = useState<string | number | boolean>("")
  const [previewError, setPreviewError] = useState("")
  const [outputNameError, setOutputNameError] = useState("")
  const [isBasicFunctionsOpen, setIsBasicFunctionsOpen] = useState(true)
  const [isAdvancedFunctionsOpen, setIsAdvancedFunctionsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const formulaBeforeEdit = useRef<FormulaItem[]>([])
  const outputNameBeforeEdit = useRef<string>("")
  const isInitialRenderRef = useRef(true)
  const isUpdatingRef = useRef(false)
  const lastFormulaRef = useRef<string>("")
  const lastFunctionCodeRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Parse initial formula if provided - only run once
  useEffect(() => {
    if (!isInitialRenderRef.current) return
    isInitialRenderRef.current = false

    try {
      // Extract output name from function code if available
      if (functionCode) {
        const match = functionCode.match(/return\s*{\s*([a-zA-Z0-9_]+):/)
        if (match && match[1]) {
          setOutputName(match[1])
          outputNameBeforeEdit.current = match[1]
        }
      }

      // Try to parse the formula
      if (initialFormula && initialFormula.trim()) {
        const parsed = parseFormulaFromString(initialFormula)
        setFormula(parsed)
        formulaBeforeEdit.current = [...parsed]
      }
    } catch (error) {
      console.error("Failed to parse initial formula:", error)
    }
  }, [initialFormula, functionCode])

  // Parse a formula string into our FormulaItem structure
  const parseFormulaFromString = (formulaString: string): FormulaItem[] => {
    if (!formulaString || formulaString.trim() === "") return []

    // This is a simplified parser that handles basic math expressions
    // In a real app, you'd want a more robust parser
    const result: FormulaItem[] = []
    let i = 0

    const parseExpression = (): FormulaItem[] => {
      const tokens: FormulaItem[] = []

      while (i < formulaString.length) {
        const char = formulaString[i]

        // Handle operators
        if ("+-*/^%()><!=&|".includes(char)) {
          let op = char
          i++

          // Check for double-character operators
          if (char === ">" && formulaString[i] === "=") {
            op = ">="
            i++
          } else if (char === "<" && formulaString[i] === "=") {
            op = "<="
            i++
          } else if (char === "=" && formulaString[i] === "=") {
            op = "=="
            i++
          } else if (char === "!" && formulaString[i] === "=") {
            op = "!="
            i++
          } else if (char === "&" && formulaString[i] === "&") {
            op = "&&"
            i++
          } else if (char === "|" && formulaString[i] === "|") {
            op = "||"
            i++
          }

          tokens.push({ type: "operator", value: op })
          continue
        }

        // Handle numbers
        if (/[0-9.]/.test(char)) {
          let num = ""
          while (i < formulaString.length && /[0-9.]/.test(formulaString[i])) {
            num += formulaString[i++]
          }
          tokens.push({ type: "number", value: num })
          continue
        }

        // Handle identifiers (variables or functions)
        if (/[a-zA-Z_]/.test(char)) {
          let name = ""
          while (i < formulaString.length && /[a-zA-Z0-9_]/.test(formulaString[i])) {
            name += formulaString[i++]
          }

          // Skip whitespace
          while (i < formulaString.length && /\s/.test(formulaString[i])) {
            i++
          }

          // Check if it's a function call
          if (i < formulaString.length && formulaString[i] === "(") {
            i++ // Skip the opening parenthesis

            // Special handling for if function
            if (name === "if") {
              // Parse condition
              const condition = parseExpression()

              // Skip comma
              while (i < formulaString.length && formulaString[i] !== ",") i++
              if (i < formulaString.length && formulaString[i] === ",") i++

              // Parse true expression
              const trueExpr = parseExpression()

              // Skip comma
              while (i < formulaString.length && formulaString[i] !== ",") i++
              if (i < formulaString.length && formulaString[i] === ",") i++

              // Parse false expression
              const falseExpr = parseExpression()

              // Skip closing parenthesis
              while (i < formulaString.length && formulaString[i] !== ")") i++
              if (i < formulaString.length && formulaString[i] === ")") i++

              tokens.push({
                type: "ifStatement",
                value: "if",
                params: [condition, trueExpr, falseExpr],
              })
            } else {
              // Regular function call
              const params: FormulaItem[][] = []
              let currentParam: FormulaItem[] = []

              while (i < formulaString.length && formulaString[i] !== ")") {
                if (formulaString[i] === ",") {
                  params.push([...currentParam])
                  currentParam = []
                  i++ // Skip the comma
                  continue
                }

                const paramExpr = parseExpression()
                currentParam.push(...paramExpr)
              }

              if (currentParam.length > 0) {
                params.push(currentParam)
              }

              if (i < formulaString.length && formulaString[i] === ")") i++ // Skip the closing parenthesis

              tokens.push({ type: "function", value: name, params })
            }
          } else {
            // It's a variable or boolean literal
            if (name === "true" || name === "false") {
              tokens.push({ type: "boolean", value: name })
            } else if (name === "if" || name === "then" || name === "else") {
              tokens.push({ type: "operator", value: name })
              continue
            } else if (Object.keys(inputs).includes(name)) {
              tokens.push({ type: "input", value: name })
            } else {
              // Unknown identifier, treat as a string
              tokens.push({ type: "string", value: name })
            }
          }
          continue
        }

        // Skip whitespace
        if (/\s/.test(char)) {
          i++
          continue
        }

        // Handle string literals
        if (char === '"' || char === "'") {
          const quote = char
          let str = ""
          i++ // Skip the opening quote

          while (i < formulaString.length && formulaString[i] !== quote) {
            str += formulaString[i++]
          }

          if (i < formulaString.length && formulaString[i] === quote) i++ // Skip the closing quote

          tokens.push({ type: "string", value: str })
          continue
        }

        // Unknown character, skip it
        i++
      }

      return tokens
    }

    return parseExpression()
  }

  // Debounced code generation to prevent update loops
  const debouncedGenerateCode = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      if (isUpdatingRef.current || (readOnly && !editMode)) return

      try {
        isUpdatingRef.current = true

        // Convert formula to JavaScript expression
        let expression = ""

        const processItems = (items: FormulaItem[]): string => {
          return items
            .map((item) => {
              if (item.type === "input") {
                return `Number(inputs.${item.value})`
              } else if (item.type === "operator") {
                if (item.value === "^") {
                  return "**" // Convert ^ to ** for JavaScript exponentiation
                } else if (item.value === "if" || item.value === "then" || item.value === "else") {
                  // These operators will be part of the overall expression structure
                  return item.value
                } else {
                  return item.value
                }
              } else if (item.type === "boolean") {
                return item.value // true or false
              } else if (item.type === "string") {
                return `"${item.value}"` // String literal
              } else if (item.type === "function") {
                const funcName = item.value
                const params = item.params?.map((param) => processItems(param)) || []

                if (funcName === "sqrt") {
                  return `Math.sqrt(${params.join(", ")})`
                } else if (funcName === "abs") {
                  return `Math.abs(${params.join(", ")})`
                } else if (funcName === "round") {
                  return `Math.round(${params.join(", ")})`
                } else if (funcName === "floor") {
                  return `Math.floor(${params.join(", ")})`
                } else if (funcName === "ceil") {
                  return `Math.ceil(${params.join(", ")})`
                } else if (funcName === "sin") {
                  return `Math.sin(${params.join(", ")})`
                } else if (funcName === "cos") {
                  return `Math.cos(${params.join(", ")})`
                } else if (funcName === "tan") {
                  return `Math.tan(${params.join(", ")})`
                } else if (funcName === "max") {
                  return `Math.max(${params.join(", ")})`
                } else if (funcName === "min") {
                  return `Math.min(${params.join(", ")})`
                } else if (funcName === "pow") {
                  return `Math.pow(${params.join(", ")})`
                } else {
                  // Unknown function, use as-is
                  return `${funcName}(${params.join(", ")})`
                }
              } else if (item.type === "ifStatement") {
                const condition = item.params?.[0] ? processItems(item.params[0]) : "true"
                const trueBranch = item.params?.[1] ? processItems(item.params[1]) : "null"
                const falseBranch = item.params?.[2] ? processItems(item.params[2]) : "null"
                return `((${condition}) ? (${trueBranch}) : (${falseBranch}))`
              } else {
                return item.value
              }
            })
            .join(" ")
        }

        expression = processItems(formula)

        // Handle empty formula
        if (!expression.trim()) {
          expression = "0"
        }

        // Create the function code
        const functionCode = `return { ${outputName}: ${expression} };`

        // Only update if the code has actually changed
        if (lastFormulaRef.current !== expression || lastFunctionCodeRef.current !== functionCode) {
          lastFormulaRef.current = expression
          lastFunctionCodeRef.current = functionCode

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
        }
      } catch (error) {
        console.error("Error generating code:", error)
        setPreviewError("Error generating code")
      } finally {
        isUpdatingRef.current = false
      }
    }, 300) // 300ms debounce
  }, [formula, outputName, inputs, onChange, readOnly, editMode])

  // Trigger code generation when formula or output name changes
  useEffect(() => {
    if (isInitialRenderRef.current || (readOnly && !editMode)) return

    if (outputName.trim() && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(outputName)) {
      setOutputNameError("")
      debouncedGenerateCode()
    } else if (outputName.trim()) {
      setOutputNameError("Output name must start with a letter and contain only letters, numbers, and underscores")
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [formula, outputName, debouncedGenerateCode, readOnly, editMode])

  const addInput = (inputName: string) => {
    if (readOnly && !editMode) return
    setFormula((prev) => [...prev, { type: "input", value: inputName }])
  }

  const addCustomInput = (inputName: string) => {
    if (readOnly && !editMode) return
    if (!inputName.trim()) return

    // Add the custom input to the formula
    setFormula((prev) => [...prev, { type: "input", value: inputName }])
  }

  const addNumber = () => {
    if (readOnly && !editMode) return
    setFormula((prev) => [...prev, { type: "number", value: "0" }])
  }

  const addOperator = (op: Operator) => {
    if (readOnly && !editMode) return
    setFormula((prev) => [...prev, { type: "operator", value: op }])
  }

  const addBoolean = (value: string) => {
    if (readOnly && !editMode) return
    setFormula((prev) => [...prev, { type: "boolean", value }])
  }

  const addFunction = (func: MathFunction) => {
    if (readOnly && !editMode) return

    if (func === "if") {
      // Add just the IF condition container
      setFormula((prev) => [
        ...prev,
        {
          type: "ifStatement",
          value: "if",
          params: [
            [], // Condition
            [], // True expression
            [], // False expression
          ],
        },
      ])
    } else {
      // For regular functions, add them with an empty parameter list
      setFormula((prev) => [...prev, { type: "function", value: func, params: [[]] }])
    }
  }

  const addConditionalOperator = (type: "if" | "then" | "else") => {
    if (readOnly && !editMode) return

    if (type === "if") {
      setFormula((prev) => [
        ...prev,
        {
          type: "operator",
          value: "if",
        },
      ])
    } else if (type === "then") {
      setFormula((prev) => [
        ...prev,
        {
          type: "operator",
          value: "then",
        },
      ])
    } else if (type === "else") {
      setFormula((prev) => [
        ...prev,
        {
          type: "operator",
          value: "else",
        },
      ])
    }
  }

  const updateItem = (index: number, value: string) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      newFormula[index] = { ...newFormula[index], value }
      return newFormula
    })
  }

  const updateIfCondition = (index: number, items: FormulaItem[]) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      if (newFormula[index].type === "ifStatement" && newFormula[index].params) {
        newFormula[index].params![0] = items
      }
      return newFormula
    })
  }

  const updateIfTrueBranch = (index: number, items: FormulaItem[]) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      if (newFormula[index].type === "ifStatement" && newFormula[index].params) {
        newFormula[index].params![1] = items
      }
      return newFormula
    })
  }

  const updateIfFalseBranch = (index: number, items: FormulaItem[]) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      if (newFormula[index].type === "ifStatement" && newFormula[index].params) {
        newFormula[index].params![2] = items
      }
      return newFormula
    })
  }

  const updateFunctionParam = (index: number, paramIndex: number, items: FormulaItem[]) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      if (newFormula[index].type === "function" && newFormula[index].params) {
        newFormula[index].params![paramIndex] = items
      }
      return newFormula
    })
  }

  const removeItem = (index: number) => {
    if (readOnly && !editMode) return
    setFormula((prev) => {
      const newFormula = [...prev]
      newFormula.splice(index, 1)
      return newFormula
    })
  }

  const renderFormulaItem = (item: FormulaItem, index: number) => {
    switch (item.type) {
      case "input":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
            {item.value}
            {(!readOnly || editMode) && (
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeItem(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        )
      case "number":
        return (
          <div className="flex items-center">
            <Input
              type="number"
              value={item.value}
              onChange={(e) => updateItem(index, e.target.value)}
              className="w-20 h-8 text-sm"
              readOnly={readOnly && !editMode}
            />
            {(!readOnly || editMode) && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )
      case "boolean":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 flex items-center gap-1">
            {item.value}
            {(!readOnly || editMode) && (
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeItem(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        )
      case "operator":
        return (
          <Badge variant="outline" className="bg-gray-100 flex items-center gap-1">
            {item.value}
            {(!readOnly || editMode) && (
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeItem(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        )
      case "string":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1">
            "{item.value}"
            {(!readOnly || editMode) && (
              <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => removeItem(index)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </Badge>
        )
      case "function":
        return (
          <Card className="border border-green-200 bg-green-50">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-medium text-green-800 flex items-center justify-between">
                {item.value}()
                {(!readOnly || editMode) && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mt-1 -mr-1" onClick={() => removeItem(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              {item.params?.map((param, paramIndex) => (
                <div key={paramIndex} className="mb-1 last:mb-0">
                  <Label className="text-xs text-green-800 mb-1 block">Parameter {paramIndex + 1}:</Label>
                  <div className="flex flex-wrap items-center gap-1 p-1 border border-green-200 rounded-sm min-h-[24px] bg-white">
                    {param.length > 0 ? (
                      param.map((subItem, subIndex) => (
                        <div key={subIndex} className="flex items-center">
                          {renderFormulaItem(subItem, 0)}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Empty parameter</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      case "ifStatement":
        return (
          <Card className="border border-indigo-200 bg-indigo-50">
            <CardHeader className="p-2 pb-1">
              <CardTitle className="text-xs font-medium text-indigo-800 flex items-center justify-between">
                if-then-else
                {(!readOnly || editMode) && (
                  <Button variant="ghost" size="icon" className="h-5 w-5 -mt-1 -mr-1" onClick={() => removeItem(index)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="mb-1">
                <Label className="text-xs text-indigo-800 mb-1 block">Condition:</Label>
                <div className="flex flex-wrap items-center gap-1 p-1 border border-indigo-200 rounded-sm min-h-[24px] bg-white">
                  {item.params && item.params[0]?.length > 0 ? (
                    item.params[0].map((subItem, subIndex) => (
                      <div key={subIndex} className="flex items-center">
                        {renderFormulaItem(subItem, 0)}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Empty condition</span>
                  )}
                </div>
              </div>
              <div className="mb-1">
                <Label className="text-xs text-indigo-800 mb-1 block">Then:</Label>
                <div className="flex flex-wrap items-center gap-1 p-1 border border-indigo-200 rounded-sm min-h-[24px] bg-white">
                  {item.params && item.params[1]?.length > 0 ? (
                    item.params[1].map((subItem, subIndex) => (
                      <div key={subIndex} className="flex items-center">
                        {renderFormulaItem(subItem, 0)}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Empty result</span>
                  )}
                </div>
              </div>
              <div className="mb-1">
                <Label className="text-xs text-indigo-800 mb-1 block">Else:</Label>
                <div className="flex flex-wrap items-center gap-1 p-1 border border-indigo-200 rounded-sm min-h-[24px] bg-white">
                  {item.params && item.params[2]?.length > 0 ? (
                    item.params[2].map((subItem, subIndex) => (
                      <div key={subIndex} className="flex items-center">
                        {renderFormulaItem(subItem, 0)}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Empty result</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  const handleOutputNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly && !editMode) return

    const newName = e.target.value
    setOutputName(newName)

    if (!newName.trim()) {
      setOutputNameError("Output name cannot be empty")
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newName)) {
      setOutputNameError("Output name must start with a letter and contain only letters, numbers, and underscores")
    } else {
      setOutputNameError("")
    }
  }

  const startEditing = () => {
    formulaBeforeEdit.current = [...formula]
    outputNameBeforeEdit.current = outputName
    setEditMode(true)
  }

  const cancelEditing = () => {
    setFormula(formulaBeforeEdit.current)
    setOutputName(outputNameBeforeEdit.current)
    setEditMode(false)
  }

  const saveEditing = () => {
    // Keep current formula and output name
    setEditMode(false)
    // Force code generation
    debouncedGenerateCode()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="output-name" className="text-right">
          Output Name
        </Label>
        <div className="col-span-3">
          <Input
            id="output-name"
            value={outputName}
            onChange={handleOutputNameChange}
            className={outputNameError ? "border-red-500" : ""}
            readOnly={readOnly && !editMode}
          />
          {outputNameError && <p className="text-xs text-red-500 mt-1">{outputNameError}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Formula Builder</Label>
          {readOnly && (
            <div>
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEditing}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 min-h-[40px]">
              {formula.length > 0 ? (
                formula.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {renderFormulaItem(item, index)}
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {readOnly && !editMode
                    ? "No formula defined"
                    : "Add inputs, numbers, and operators to build your formula"}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {(!readOnly || editMode) && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-2 block">Add Input</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Select onValueChange={addInput} disabled={readOnly && !editMode}>
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
                  <Button variant="outline" onClick={addNumber} disabled={readOnly && !editMode}>
                    Number
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Custom input name"
                    disabled={readOnly && !editMode}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addCustomInput((e.target as HTMLInputElement).value)
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling as HTMLInputElement
                      addCustomInput(input.value)
                      input.value = ""
                    }}
                    disabled={readOnly && !editMode}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Add Value Type</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => addBoolean("true")} disabled={readOnly && !editMode}>
                  true
                </Button>
                <Button variant="outline" onClick={() => addBoolean("false")} disabled={readOnly && !editMode}>
                  false
                </Button>
              </div>
            </div>
          </div>

          <Collapsible open={isBasicFunctionsOpen} onOpenChange={setIsBasicFunctionsOpen}>
            <div className="border-t mt-2 pt-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer p-2 hover:bg-slate-50 rounded-md">
                <Label className="cursor-pointer m-0">Basic Operators</Label>
                {isBasicFunctionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <div className="flex flex-wrap gap-1 mt-2 p-2 bg-slate-50 rounded-md">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("+")}
                    disabled={readOnly && !editMode}
                  >
                    +
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("-")}
                    disabled={readOnly && !editMode}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("*")}
                    disabled={readOnly && !editMode}
                  >
                    ×
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("/")}
                    disabled={readOnly && !editMode}
                  >
                    ÷
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("^")}
                    disabled={readOnly && !editMode}
                  >
                    ^
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("%")}
                    disabled={readOnly && !editMode}
                  >
                    %
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator("(")}
                    disabled={readOnly && !editMode}
                  >
                    (
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => addOperator(")")}
                    disabled={readOnly && !editMode}
                  >
                    )
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Collapsible open={isAdvancedFunctionsOpen} onOpenChange={setIsAdvancedFunctionsOpen}>
            <div className="border-t mt-2 pt-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer p-2 hover:bg-slate-50 rounded-md">
                <Label className="cursor-pointer m-0">Advanced Functions & Comparisons</Label>
                {isAdvancedFunctionsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-2 bg-slate-50 rounded-md">
                  <Label className="text-xs text-muted-foreground mb-1">Math Functions:</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("sqrt")}
                            disabled={readOnly && !editMode}
                          >
                            sqrt()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Square root of a value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("abs")}
                            disabled={readOnly && !editMode}
                          >
                            abs()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Absolute value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("round")}
                            disabled={readOnly && !editMode}
                          >
                            round()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Round to nearest integer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("floor")}
                            disabled={readOnly && !editMode}
                          >
                            floor()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Round down to integer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("ceil")}
                            disabled={readOnly && !editMode}
                          >
                            ceil()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Round up to integer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("max")}
                            disabled={readOnly && !editMode}
                          >
                            max()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Find maximum value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("min")}
                            disabled={readOnly && !editMode}
                          >
                            min()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Find minimum value</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("pow")}
                            disabled={readOnly && !editMode}
                          >
                            pow()
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Power function (x^y)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Label className="text-xs text-muted-foreground mb-1">Comparisons:</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator(">")}
                      disabled={readOnly && !editMode}
                    >
                      &gt;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("<")}
                      disabled={readOnly && !editMode}
                    >
                      &lt;
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator(">=")}
                      disabled={readOnly && !editMode}
                    >
                      &gt;=
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("<=")}
                      disabled={readOnly && !editMode}
                    >
                      &lt;=
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("==")}
                      disabled={readOnly && !editMode}
                    >
                      ==
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("!=")}
                      disabled={readOnly && !editMode}
                    >
                      !=
                    </Button>
                  </div>

                  <Label className="text-xs text-muted-foreground mb-1">Logical Operators:</Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("&&")}
                      disabled={readOnly && !editMode}
                    >
                      AND
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOperator("||")}
                      disabled={readOnly && !editMode}
                    >
                      OR
                    </Button>
                  </div>

                  <Label className="text-xs text-muted-foreground mb-1">Conditional Operators:</Label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionalOperator("if")}
                      disabled={readOnly && !editMode}
                    >
                      IF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionalOperator("then")}
                      disabled={readOnly && !editMode}
                    >
                      THEN
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addConditionalOperator("else")}
                      disabled={readOnly && !editMode}
                    >
                      ELSE
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addFunction("if")}
                            disabled={readOnly && !editMode}
                          >
                            if-then-else (block)
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Full conditional block: if(condition, trueValue, falseValue)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </>
      )}

      <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 text-sm">
          <span className="font-medium">Preview:</span>{" "}
          {previewError ? (
            <span className="text-red-500">{previewError}</span>
          ) : (
            <span className="font-mono">
              {outputName} = {previewResult !== undefined ? String(previewResult) : ""}
            </span>
          )}
        </div>
      </div>

      <AlertDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit formula</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit this formula? Make sure to save your changes when done.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startEditing}>Edit Formula</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
