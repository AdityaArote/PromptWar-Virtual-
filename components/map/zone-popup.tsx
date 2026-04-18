"use client"

import type { ZoneWithCoords } from "@/lib/types"
import { X, Clock, Users, TrendingUp, TrendingDown, ArrowRight, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  critical: "bg-red-600/20 text-red-300 border-red-600/30",
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Dining",
  drinks: "Beverages",
  restroom: "Restroom",
  merchandise: "Merchandise",
  exit: "Exit",
}

interface ZonePopupProps {
  zone: ZoneWithCoords
  onClose: () => void
  onFindAlternatives: () => void
}

export function ZonePopup({ zone, onClose, onFindAlternatives }: ZonePopupProps) {
  const statusClass = STATUS_COLORS[zone.status] || "bg-muted text-muted-foreground"
  const capacityPercent = zone.crowd_density

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-80 max-w-[90vw]">
      <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border", statusClass)}>
                {zone.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {CATEGORY_LABELS[zone.category] || zone.category}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{zone.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{zone.location}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 px-4 py-3">
          <div className="text-center">
            <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold font-mono text-foreground">{zone.wait_time_minutes}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Min Wait</p>
          </div>
          <div className="text-center">
            <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-lg font-bold font-mono text-foreground">{capacityPercent}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Capacity</p>
          </div>
          <div className="text-center">
            {zone.trending === "down" ? (
              <TrendingDown className="h-4 w-4 mx-auto text-green-400 mb-1" />
            ) : zone.trending === "up" ? (
              <TrendingUp className="h-4 w-4 mx-auto text-red-400 mb-1" />
            ) : (
              <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            )}
            <p className="text-lg font-bold font-mono text-foreground capitalize">{zone.trending}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Trend</p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="px-4 pb-3">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                capacityPercent > 80 ? "bg-red-500" : capacityPercent > 50 ? "bg-amber-500" : "bg-green-500"
              )}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={onFindAlternatives}
          >
            <Navigation className="h-3.5 w-3.5" />
            Find Alternatives
          </Button>
        </div>
      </div>
    </div>
  )
}
