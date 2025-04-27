"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface HeatmapLegendProps {
  onClose: () => void
  metric: string
  minValue: number
  maxValue: number
}

export function HeatmapLegend({ onClose, metric, minValue, maxValue }: HeatmapLegendProps) {
  return (
    <Card className="absolute bottom-4 right-4 w-64 shadow-lg">
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium">Heatmap: {metric}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-sm" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minValue.toFixed(2)}</span>
            <span>{((minValue + maxValue) / 2).toFixed(2)}</span>
            <span>{maxValue.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Color intensity represents the value of {metric} across modules
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
