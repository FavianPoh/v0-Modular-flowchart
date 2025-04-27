"use client"

import { Button } from "@/components/ui/button"
import {
  PlusCircle,
  Save,
  RotateCcw,
  RefreshCw,
  Cable,
  Code,
  Library,
  ToggleLeft,
  ToggleRight,
  BarChart4,
  TrendingUp,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { format } from "date-fns"

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
  autoRecalculate: boolean
  needsRecalculation: boolean
  heatmapEnabled: boolean
  lastSaved?: Date | null
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
  autoRecalculate,
  needsRecalculation,
  heatmapEnabled,
  lastSaved,
}: FlowchartToolbarProps) {
  return (
    <TooltipProvider>
      <div className="border-b px-3 py-2 flex items-center justify-between gap-2 bg-background">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onAddModule} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add Module
          </Button>
          <Button size="sm" variant="outline" onClick={onManageConnections} className="flex items-center gap-2">
            <Cable className="h-4 w-4" /> Connections
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenLibrary} className="flex items-center gap-2">
            <Library className="h-4 w-4" /> Library
          </Button>
          <Button size="sm" variant="outline" onClick={onExportCode} className="flex items-center gap-2">
            <Code className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={onOpenSensitivityAnalysis} className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Sensitivity Analysis
          </Button>
          <Button
            size="sm"
            variant={heatmapEnabled ? "default" : "outline"}
            onClick={onToggleHeatmap}
            className="flex items-center gap-2"
          >
            <BarChart4 className="h-4 w-4" /> {heatmapEnabled ? "Hide Heatmap" : "Show Heatmap"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleAutoRecalculate(!autoRecalculate)}
            className="flex items-center gap-2"
          >
            {autoRecalculate ? (
              <>
                <ToggleRight className="h-4 w-4" /> Auto Recalc: On
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4" /> Auto Recalc: Off
              </>
            )}
          </Button>
          {!autoRecalculate && needsRecalculation && (
            <Button size="sm" onClick={onRecalculate} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Recalculate
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground">
                  Last saved: {format(lastSaved, "MMM d, h:mm:ss a")}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last time your flowchart was automatically saved</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Button size="sm" variant="default" onClick={onSaveFlowchart} className="flex items-center gap-2">
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={onResetFlowchart} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
