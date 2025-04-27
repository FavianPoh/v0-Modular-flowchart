import type { Node } from "reactflow"

// Execute a module's function with its current inputs
export function executeModule(moduleData: any) {
  try {
    if (typeof moduleData.function === "function") {
      // Create a clean copy of inputs to prevent reference issues
      const inputsCopy = JSON.parse(JSON.stringify(moduleData.inputs || {}))
      return moduleData.function(inputsCopy)
    }

    // If no function is defined, return the default outputs
    return moduleData.outputs || {}
  } catch (error) {
    console.error("Error executing module:", error)
    return { error: "Execution failed" }
  }
}

// Create a new module with default settings based on type
export function createNewModule(
  type: string,
  name: string,
  existingNodes: Node[],
  description?: string,
  customInputs?: Record<string, any>,
  customFunctionCode?: string,
) {
  // Generate a unique ID
  const id = (Math.max(0, ...existingNodes.map((n) => Number.parseInt(n.id))) + 1).toString()

  // Find a position that doesn't overlap with existing nodes
  const position = findAvailablePosition(existingNodes)

  // Use provided description or generate a default one
  const moduleDescription = description || `Custom ${type} module: ${name}`

  // Create module data based on type
  let moduleData: any = {
    label: name,
    type: type,
    description: moduleDescription,
  }

  // Use custom inputs if provided
  const inputs = customInputs || { value: 0 }
  const defaultInputs = { ...inputs }

  // Use custom function code if provided
  let functionCode = customFunctionCode || "return { output: Number(inputs.value) };"
  let moduleFunction

  try {
    // Ensure the function code is properly formatted
    if (!functionCode.trim().startsWith("return")) {
      functionCode = `return ${functionCode};`
    }

    // Basic validation - check if the code has balanced braces
    let braceCount = 0
    for (let i = 0; i < functionCode.length; i++) {
      if (functionCode[i] === "{") braceCount++
      if (functionCode[i] === "}") braceCount--
      if (braceCount < 0) throw new Error("Unbalanced braces")
    }
    if (braceCount !== 0) throw new Error("Unbalanced braces")

    // Create the function safely
    moduleFunction = new Function("inputs", functionCode)

    // Test the function with empty inputs to catch any immediate errors
    try {
      moduleFunction({})
    } catch (testError) {
      console.error("Error testing function:", testError)
      throw new Error("Function execution failed")
    }
  } catch (error) {
    console.error("Error creating function from code:", error)
    functionCode = "return { result: 0 };"
    moduleFunction = (inputs) => ({ result: 0 })
  }

  // Set default inputs, outputs, and function based on module type
  switch (type) {
    case "input":
      moduleData = {
        ...moduleData,
        description: description || `Source data input for ${name}`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "math":
      moduleData = {
        ...moduleData,
        description: description || `Performs mathematical calculations on inputs`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "logic":
      moduleData = {
        ...moduleData,
        description: description || `Performs logical operations on boolean inputs`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "transform":
      moduleData = {
        ...moduleData,
        description: description || `Transforms input data into a different format`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "filter":
      moduleData = {
        ...moduleData,
        description: description || `Filters input based on specified conditions`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "output":
      moduleData = {
        ...moduleData,
        description: description || `Final output module that summarizes results`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
    case "custom":
      moduleData = {
        ...moduleData,
        description: description || `Custom module with user-defined functionality`,
        inputs: inputs,
        defaultInputs: defaultInputs,
        outputs: moduleFunction(inputs),
        function: moduleFunction,
        functionCode: functionCode,
      }
      break
  }

  return {
    id,
    type: "moduleNode",
    position,
    data: moduleData,
  }
}

// Find an available position for a new node
function findAvailablePosition(nodes: Node[]) {
  // Default position if no nodes exist
  if (nodes.length === 0) {
    return { x: 100, y: 100 }
  }

  // Find the rightmost node
  const rightmostNode = nodes.reduce((prev, current) => {
    return current.position.x > prev.position.x ? current : prev
  }, nodes[0])

  // Position the new node to the right of the rightmost node
  return {
    x: rightmostNode.position.x + 300,
    y: rightmostNode.position.y,
  }
}
