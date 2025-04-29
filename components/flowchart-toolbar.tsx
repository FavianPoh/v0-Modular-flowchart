"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Plus, Link, Code, Save, RefreshCw, RotateCcw, BookOpen, BarChart3, Thermometer, Network } from "lucide-react"

interface FlowchartToolbarProps {
  onAddModule: () => void
  onManageConnections: () => void
  onExportCode: () => void
  onSaveFlowchart: () => void
  onResetFlowchart: () => void
  onRecalculate: () => void
  onOpenLibrary: () => void
  onToggleAutoRecalculate: (enabled: boolean) => void
  onOpenSensitivityAnalysis: () => void
  onToggleHeatmap: () => void
  onOpenMetricView?: () => void
  autoRecalculate: boolean
  needsRecalculation: boolean
  heatmapEnabled: boolean
  lastSaved: Date | null
}

export function FlowchartToolbar({
  onAddModule,
  onManageConnections,
  onExportCode,
  onSaveFlowchart,
  onResetFlowchart,
  onRecalculate,
  onOpenLibrary,
  onToggleAutoRecalculate,
  onOpenSensitivityAnalysis,
  onToggleHeatmap,
  onOpenMetricView,
  autoRecalculate,
  needsRecalculation,
  heatmapEnabled,
  lastSaved,
}: FlowchartToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onAddModule}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Module</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onManageConnections}>
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage Connections</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onExportCode}>
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export Code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onOpenLibrary}>
                <BookOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Module Library</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onOpenSensitivityAnalysis}>
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sensitivity Analysis</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={heatmapEnabled ? "secondary" : "outline"} size="icon" onClick={onToggleHeatmap}>
                <Thermometer className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Heatmap</TooltipContent>
          </Tooltip>

          {onOpenMetricView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={onOpenMetricView}>
                  <Network className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Metric View</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-recalculate" checked={autoRecalculate} onCheckedChange={onToggleAutoRecalculate} />
            <Label htmlFor="auto-recalculate">Auto-recalculate</Label>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={needsRecalculation ? "default" : "outline"}
                size="sm"
                onClick={onRecalculate}
                disabled={!needsRecalculation}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Recalculate
              </Button>
            </TooltipTrigger>
            <TooltipContent>Recalculate Flowchart</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onSaveFlowchart}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : "Save flowchart"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={onResetFlowchart}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset to Initial State</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
