"use client"

import type { RouteRecommendation, ZoneWithCoords } from "@/lib/types"
import { X, Loader2, TrendingDown, TrendingUp, ArrowRight, MapPin, Clock, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RoutingPanelProps {
  recommendations: RouteRecommendation[]
  isLoading: boolean
  onClose: () => void
  onSelectZone: (zone: ZoneWithCoords) => void
}

export function RoutingPanel({ recommendations, isLoading, onClose, onSelectZone }: RoutingPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1001] animate-in slide-in-from-bottom-6 duration-300">
      <div className="bg-card/95 backdrop-blur-xl rounded-t-2xl border-t border-x border-border shadow-2xl max-h-[60vh] overflow-hidden flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Smart Recommendations</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Finding best alternatives..." : `${recommendations.length} alternatives found`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close routing panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No alternatives available</p>
            </div>
          ) : (
            recommendations.map((rec, idx) => {
              const TrendIcon =
                rec.trend_indicator === "improving"
                  ? TrendingDown
                  : rec.trend_indicator === "worsening"
                    ? TrendingUp
                    : ArrowRight

              const trendColor =
                rec.trend_indicator === "improving"
                  ? "text-green-400"
                  : rec.trend_indicator === "worsening"
                    ? "text-red-400"
                    : "text-muted-foreground"

              return (
                <button
                  key={rec.zone.id}
                  onClick={() => onSelectZone(rec.zone)}
                  className={cn(
                    "w-full text-left rounded-xl border border-border p-3 hover:bg-secondary/50 transition-all",
                    idx === 0 && "ring-1 ring-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {idx === 0 && (
                        <span className="text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded-full uppercase">
                          Best
                        </span>
                      )}
                      <span className="text-sm font-semibold text-foreground">{rec.zone.name}</span>
                    </div>
                    <TrendIcon className={cn("h-4 w-4", trendColor)} />
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {rec.zone.wait_time_minutes}m wait
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Footprints className="h-3 w-3" />
                      {rec.estimated_walk_minutes}m walk
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Score: {rec.score}
                    </span>
                  </div>

                  <p className="text-[11px] text-primary/80 mt-1.5 font-medium">
                    {rec.recommendation_reason}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
