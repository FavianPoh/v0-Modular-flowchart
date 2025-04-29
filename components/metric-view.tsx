"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { extractMetrics, filterMetricsByName, getUniqueMetricNames, type MetricNode } from "@/lib/metric-utils"
import { Search, ArrowLeft, ArrowRight, Maximize2, Network } from "lucide-react"
import type { Node, Edge } from "reactflow"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface MetricViewProps {
  nodes: Node[]
  edges: Edge[]
  onSelectMetric?: (metricName: string) => void
  onSelectModule?: (moduleId: string) => void
  onClose: () => void
}

export function MetricView({ nodes, edges, onSelectMetric, onSelectModule, onClose }: MetricViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMetric, setSelectedMetric] = useState<MetricNode | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // Extract metrics once when the component mounts or when nodes/edges change
  const metricGraph = useMemo(() => extractMetrics(nodes, edges), [nodes, edges])

  // Get unique metric names for filtering
  const uniqueMetricNames = useMemo(() => getUniqueMetricNames(metricGraph), [metricGraph])

  // Filter metrics based on search term and active tab
  const filteredGraph = useMemo(() => {
    let filtered = filterMetricsByName(metricGraph, searchTerm)

    if (activeTab === "inputs") {
      filtered = {
        ...filtered,
        nodes: filtered.nodes.filter((n) => n.type === "input"),
      }
    } else if (activeTab === "outputs") {
      filtered = {
        ...filtered,
        nodes: filtered.nodes.filter((n) => n.type === "output"),
      }
    }

    return filtered
  }, [metricGraph, searchTerm, activeTab])

  // Group metrics by module
  const metricsByModule = useMemo(() => {
    const moduleMap: Record<string, { moduleName: string; metrics: MetricNode[] }> = {}

    filteredGraph.nodes.forEach((node) => {
      if (!moduleMap[node.moduleId]) {
        moduleMap[node.moduleId] = {
          moduleName: node.moduleName,
          metrics: [],
        }
      }

      moduleMap[node.moduleId].metrics.push(node)
    })

    return moduleMap
  }, [filteredGraph])

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }))
  }

  // Select a metric for detailed view
  const handleSelectMetric = (metric: MetricNode) => {
    setSelectedMetric(metric)
    if (onSelectMetric) {
      onSelectMetric(metric.name)
    }
  }

  // Select a module to view in the flowchart
  const handleSelectModule = (moduleId: string) => {
    if (onSelectModule) {
      onSelectModule(moduleId)
      onClose()
    }
  }

  // Find dependencies and dependents for the selected metric
  const dependencies = useMemo(() => {
    if (!selectedMetric) return []

    return selectedMetric.dependencies
      .map((depId) => metricGraph.nodes.find((n) => n.id === depId))
      .filter(Boolean) as MetricNode[]
  }, [selectedMetric, metricGraph])

  const dependents = useMemo(() => {
    if (!selectedMetric) return []

    return selectedMetric.dependents
      .map((depId) => metricGraph.nodes.find((n) => n.id === depId))
      .filter(Boolean) as MetricNode[]
  }, [selectedMetric, metricGraph])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">Metric View</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - List of metrics */}
        <div className="w-1/2 border-r flex flex-col">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-4 py-2">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="all">All Metrics</TabsTrigger>
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="outputs">Outputs</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0 flex-1">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {Object.entries(metricsByModule).map(([moduleId, { moduleName, metrics }]) => (
                    <Collapsible
                      key={moduleId}
                      open={expandedModules[moduleId]}
                      onOpenChange={() => toggleModule(moduleId)}
                    >
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 cursor-pointer">
                        <CollapsibleTrigger className="flex items-center space-x-2 text-left w-full">
                          <span className="font-medium">{moduleName}</span>
                          <Badge>{metrics.length}</Badge>
                        </CollapsibleTrigger>
                        <Button variant="ghost" size="sm" onClick={() => handleSelectModule(moduleId)}>
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CollapsibleContent>
                        <div className="pl-4 pt-2 space-y-1">
                          {metrics.map((metric) => (
                            <div
                              key={metric.id}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                selectedMetric?.id === metric.id ? "bg-gray-100 border-l-4 border-primary" : ""
                              }`}
                              onClick={() => handleSelectMetric(metric)}
                            >
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={metric.type === "input" ? "outline" : "default"}
                                  className="uppercase text-xs"
                                >
                                  {metric.type}
                                </Badge>
                                <span>{metric.name}</span>
                              </div>
                              <span className="text-sm font-mono">{metric.value}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="inputs" className="m-0 flex-1">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {Object.entries(metricsByModule).map(
                    ([moduleId, { moduleName, metrics }]) =>
                      metrics.length > 0 && (
                        <Collapsible
                          key={moduleId}
                          open={expandedModules[moduleId]}
                          onOpenChange={() => toggleModule(moduleId)}
                        >
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 cursor-pointer">
                            <CollapsibleTrigger className="flex items-center space-x-2 text-left w-full">
                              <span className="font-medium">{moduleName}</span>
                              <Badge>{metrics.length}</Badge>
                            </CollapsibleTrigger>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectModule(moduleId)}>
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <CollapsibleContent>
                            <div className="pl-4 pt-2 space-y-1">
                              {metrics.map((metric) => (
                                <div
                                  key={metric.id}
                                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedMetric?.id === metric.id ? "bg-gray-100 border-l-4 border-primary" : ""
                                  }`}
                                  onClick={() => handleSelectMetric(metric)}
                                >
                                  <span>{metric.name}</span>
                                  <span className="text-sm font-mono">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ),
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="outputs" className="m-0 flex-1">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="p-4 space-y-4">
                  {Object.entries(metricsByModule).map(
                    ([moduleId, { moduleName, metrics }]) =>
                      metrics.length > 0 && (
                        <Collapsible
                          key={moduleId}
                          open={expandedModules[moduleId]}
                          onOpenChange={() => toggleModule(moduleId)}
                        >
                          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2 cursor-pointer">
                            <CollapsibleTrigger className="flex items-center space-x-2 text-left w-full">
                              <span className="font-medium">{moduleName}</span>
                              <Badge>{metrics.length}</Badge>
                            </CollapsibleTrigger>
                            <Button variant="ghost" size="sm" onClick={() => handleSelectModule(moduleId)}>
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <CollapsibleContent>
                            <div className="pl-4 pt-2 space-y-1">
                              {metrics.map((metric) => (
                                <div
                                  key={metric.id}
                                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                                    selectedMetric?.id === metric.id ? "bg-gray-100 border-l-4 border-primary" : ""
                                  }`}
                                  onClick={() => handleSelectMetric(metric)}
                                >
                                  <span>{metric.name}</span>
                                  <span className="text-sm font-mono">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ),
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Selected metric details */}
        <div className="w-1/2 flex flex-col">
          {selectedMetric ? (
            <div className="flex-1 overflow-auto p-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedMetric.name}</CardTitle>
                      <CardDescription>
                        {selectedMetric.type.charAt(0).toUpperCase() + selectedMetric.type.slice(1)} from{" "}
                        {selectedMetric.moduleName}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedMetric.type === "input" ? "outline" : "default"} className="uppercase">
                      {selectedMetric.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Value</h3>
                      <div className="p-3 bg-muted rounded-md font-mono">
                        {typeof selectedMetric.value === "object"
                          ? JSON.stringify(selectedMetric.value, null, 2)
                          : selectedMetric.value}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Dependencies {dependencies.length > 0 && `(${dependencies.length})`}
                      </h3>
                      {dependencies.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Module</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dependencies.map((dep) => (
                              <TableRow
                                key={dep.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSelectMetric(dep)}
                              >
                                <TableCell>{dep.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={dep.type === "input" ? "outline" : "default"}
                                    className="uppercase text-xs"
                                  >
                                    {dep.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{dep.moduleName}</TableCell>
                                <TableCell className="font-mono">{dep.value.toString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No dependencies found</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2 flex items-center">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Dependents {dependents.length > 0 && `(${dependents.length})`}
                      </h3>
                      {dependents.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Metric</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Module</TableHead>
                              <TableHead>Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dependents.map((dep) => (
                              <TableRow
                                key={dep.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => handleSelectMetric(dep)}
                              >
                                <TableCell>{dep.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={dep.type === "input" ? "outline" : "default"}
                                    className="uppercase text-xs"
                                  >
                                    {dep.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>{dep.moduleName}</TableCell>
                                <TableCell className="font-mono">{dep.value.toString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No dependents found</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md p-6">
                <Network className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Metric</h3>
                <p className="text-gray-500 mb-4">
                  Choose a metric from the list to view its details, dependencies, and dependents.
                </p>
                {uniqueMetricNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {uniqueMetricNames.slice(0, 5).map((name) => (
                      <Button key={name} variant="outline" size="sm" onClick={() => setSearchTerm(name)}>
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
