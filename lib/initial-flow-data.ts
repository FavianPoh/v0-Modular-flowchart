import type { Node, Edge } from "reactflow"

// Initial set of modules with mathematical and logical functions
export const initialNodes: Node[] = [
  {
    id: "1",
    type: "moduleNode",
    position: { x: 100, y: 100 },
    data: {
      label: "Revenue Data",
      type: "input",
      description: "Source data for monthly revenue figures",
      inputs: { monthlyRevenue: 50000 },
      defaultInputs: { monthlyRevenue: 50000 },
      outputs: { revenue: 50000 },
      function: (inputs: any) => ({ revenue: Number(inputs.monthlyRevenue) }),
      functionCode: "return { revenue: Number(inputs.monthlyRevenue) };",
      userAdded: false,
    },
  },
  {
    id: "2",
    type: "moduleNode",
    position: { x: 100, y: 250 },
    data: {
      label: "Cost Data",
      type: "input",
      description: "Source data for monthly operating costs",
      inputs: { fixedCosts: 20000, variableCosts: 15000 },
      defaultInputs: { fixedCosts: 20000, variableCosts: 15000 },
      outputs: { totalCosts: 35000 },
      function: (inputs: any) => ({ totalCosts: Number(inputs.fixedCosts) + Number(inputs.variableCosts) }),
      functionCode: "return { totalCosts: Number(inputs.fixedCosts) + Number(inputs.variableCosts) };",
      userAdded: false,
    },
  },
  {
    id: "3",
    type: "moduleNode",
    position: { x: 400, y: 175 },
    data: {
      label: "Profit Calculator",
      type: "math",
      description: "Calculates gross profit from revenue and costs",
      inputs: { revenue: 50000, costs: 35000 },
      defaultInputs: { revenue: 50000, costs: 35000 },
      outputs: { profit: 15000 },
      function: (inputs: any) => ({ profit: Number(inputs.revenue) - Number(inputs.costs) }),
      functionCode: "return { profit: Number(inputs.revenue) - Number(inputs.costs) };",
      userAdded: false,
    },
  },
  {
    id: "4",
    type: "moduleNode",
    position: { x: 100, y: 400 },
    data: {
      label: "Tax Rate",
      type: "input",
      description: "Current tax rate as a percentage",
      inputs: { taxPercentage: 21 },
      defaultInputs: { taxPercentage: 21 },
      outputs: { taxRate: 0.21 },
      function: (inputs: any) => ({ taxRate: Number(inputs.taxPercentage) / 100 }),
      functionCode: "return { taxRate: Number(inputs.taxPercentage) / 100 };",
      userAdded: false,
    },
  },
  {
    id: "5",
    type: "moduleNode",
    position: { x: 400, y: 325 },
    data: {
      label: "Tax Calculator",
      type: "math",
      description: "Calculates tax amount based on profit and tax rate",
      inputs: { profit: 15000, taxRate: 0.21 },
      defaultInputs: { profit: 15000, taxRate: 0.21 },
      outputs: { taxAmount: 3150 },
      function: (inputs: any) => ({ taxAmount: Number(inputs.profit) * Number(inputs.taxRate) }),
      functionCode: "return { taxAmount: Number(inputs.profit) * Number(inputs.taxRate) };",
      userAdded: false,
    },
  },
  {
    id: "6",
    type: "moduleNode",
    position: { x: 700, y: 250 },
    data: {
      label: "Net Profit",
      type: "math",
      description: "Calculates net profit after taxes",
      inputs: { profit: 15000, taxAmount: 3150 },
      defaultInputs: { profit: 15000, taxAmount: 3150 },
      outputs: { netProfit: 11850 },
      function: (inputs: any) => ({ netProfit: Number(inputs.profit) - Number(inputs.taxAmount) }),
      functionCode: "return { netProfit: Number(inputs.profit) - Number(inputs.taxAmount) };",
      userAdded: false,
    },
  },
  {
    id: "7",
    type: "moduleNode",
    position: { x: 100, y: 550 },
    data: {
      label: "Investment Data",
      type: "input",
      description: "Capital investment information",
      inputs: { totalInvestment: 100000 },
      defaultInputs: { totalInvestment: 100000 },
      outputs: { investment: 100000 },
      function: (inputs: any) => ({ investment: Number(inputs.totalInvestment) }),
      functionCode: "return { investment: Number(inputs.totalInvestment) };",
      userAdded: false,
    },
  },
  {
    id: "8",
    type: "moduleNode",
    position: { x: 400, y: 475 },
    data: {
      label: "ROI Calculator",
      type: "math",
      description: "Calculates Return on Investment percentage",
      inputs: { netProfit: 11850, investment: 100000 },
      defaultInputs: { netProfit: 11850, investment: 100000 },
      outputs: { roi: 11.85 },
      function: (inputs: any) => ({ roi: (Number(inputs.netProfit) / Number(inputs.investment)) * 100 }),
      functionCode: "return { roi: (Number(inputs.netProfit) / Number(inputs.investment)) * 100 };",
      userAdded: false,
    },
  },
  {
    id: "9",
    type: "moduleNode",
    position: { x: 700, y: 400 },
    data: {
      label: "Performance Threshold",
      type: "filter",
      description: "Evaluates if ROI meets target threshold",
      inputs: { roi: 11.85, threshold: 10 },
      defaultInputs: { roi: 11.85, threshold: 10 },
      outputs: { meetsTarget: true, status: "Target achieved" },
      function: (inputs: any) => {
        const roi = Number(inputs.roi)
        const threshold = Number(inputs.threshold)
        return {
          meetsTarget: roi >= threshold,
          status: roi >= threshold ? "Target achieved" : "Below target",
        }
      },
      functionCode: `const roi = Number(inputs.roi);
const threshold = Number(inputs.threshold);
return {
  meetsTarget: roi >= threshold,
  status: roi >= threshold ? "Target achieved" : "Below target",
};`,
      userAdded: false,
    },
  },
  {
    id: "10",
    type: "moduleNode",
    position: { x: 1000, y: 325 },
    data: {
      label: "Business KPI Dashboard",
      type: "output",
      description: "Final KPI metrics for business performance",
      inputs: {
        revenue: 50000,
        costs: 35000,
        profit: 15000,
        netProfit: 11850,
        roi: 11.85,
        performanceStatus: "Target achieved",
      },
      defaultInputs: {
        revenue: 50000,
        costs: 35000,
        profit: 15000,
        netProfit: 11850,
        roi: 11.85,
        performanceStatus: "Target achieved",
      },
      outputs: {
        profitMargin: 30,
        netMargin: 23.7,
        status: "Healthy",
      },
      function: (inputs: any) => {
        const revenue = Number(inputs.revenue)
        const profit = Number(inputs.profit)
        const netProfit = Number(inputs.netProfit)
        const profitMargin = (profit / revenue) * 100
        const netMargin = (netProfit / revenue) * 100
        let status = "Critical"

        if (netMargin > 20) {
          status = "Healthy"
        } else if (netMargin > 10) {
          status = "Stable"
        } else if (netMargin > 5) {
          status = "Concerning"
        }

        return {
          profitMargin: profitMargin.toFixed(1),
          netMargin: netMargin.toFixed(1),
          status,
        }
      },
      functionCode: `const revenue = Number(inputs.revenue);
const profit = Number(inputs.profit);
const netProfit = Number(inputs.netProfit);
const profitMargin = (profit / revenue) * 100;
const netMargin = (netProfit / revenue) * 100;
let status = "Critical";

if (netMargin > 20) {
  status = "Healthy";
} else if (netMargin > 10) {
  status = "Stable";
} else if (netMargin > 5) {
  status = "Concerning";
}

return {
  profitMargin: profitMargin.toFixed(1),
  netMargin: netMargin.toFixed(1),
  status
};`,
      userAdded: false,
    },
  },
]

// Initial connections between modules
export const initialEdges: Edge[] = [
  // Revenue data to Profit Calculator
  {
    id: "e1-3",
    source: "1",
    target: "3",
    sourceHandle: "output-revenue",
    targetHandle: "input-revenue",
    animated: true,
  },

  // Cost data to Profit Calculator
  {
    id: "e2-3",
    source: "2",
    target: "3",
    sourceHandle: "output-totalCosts",
    targetHandle: "input-costs",
    animated: true,
  },

  // Profit Calculator to Tax Calculator
  { id: "e3-5", source: "3", target: "5", sourceHandle: "output-profit", targetHandle: "input-profit", animated: true },

  // Tax Rate to Tax Calculator
  {
    id: "e4-5",
    source: "4",
    target: "5",
    sourceHandle: "output-taxRate",
    targetHandle: "input-taxRate",
    animated: true,
  },

  // Profit Calculator to Net Profit
  { id: "e3-6", source: "3", target: "6", sourceHandle: "output-profit", targetHandle: "input-profit", animated: true },

  // Tax Calculator to Net Profit
  {
    id: "e5-6",
    source: "5",
    target: "6",
    sourceHandle: "output-taxAmount",
    targetHandle: "input-taxAmount",
    animated: true,
  },

  // Investment Data to ROI Calculator
  {
    id: "e7-8",
    source: "7",
    target: "8",
    sourceHandle: "output-investment",
    targetHandle: "input-investment",
    animated: true,
  },

  // Net Profit to ROI Calculator
  {
    id: "e6-8",
    source: "6",
    target: "8",
    sourceHandle: "output-netProfit",
    targetHandle: "input-netProfit",
    animated: true,
  },

  // ROI Calculator to Performance Threshold
  { id: "e8-9", source: "8", target: "9", sourceHandle: "output-roi", targetHandle: "input-roi", animated: true },

  // Revenue to KPI Dashboard
  {
    id: "e1-10",
    source: "1",
    target: "10",
    sourceHandle: "output-revenue",
    targetHandle: "input-revenue",
    animated: true,
  },

  // Costs to KPI Dashboard
  {
    id: "e2-10",
    source: "2",
    target: "10",
    sourceHandle: "output-totalCosts",
    targetHandle: "input-costs",
    animated: true,
  },

  // Profit to KPI Dashboard
  {
    id: "e3-10",
    source: "3",
    target: "10",
    sourceHandle: "output-profit",
    targetHandle: "input-profit",
    animated: true,
  },

  // Net Profit to KPI Dashboard
  {
    id: "e6-10",
    source: "6",
    target: "10",
    sourceHandle: "output-netProfit",
    targetHandle: "input-netProfit",
    animated: true,
  },

  // ROI to KPI Dashboard
  { id: "e8-10", source: "8", target: "10", sourceHandle: "output-roi", targetHandle: "input-roi", animated: true },

  // Performance Status to KPI Dashboard
  {
    id: "e9-10",
    source: "9",
    target: "10",
    sourceHandle: "output-status",
    targetHandle: "input-performanceStatus",
    animated: true,
  },
]
