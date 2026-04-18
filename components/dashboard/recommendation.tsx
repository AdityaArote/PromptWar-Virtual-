"use client"

import type { Zone } from "@/lib/types"
import { Zap, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecommendationProps {
  zone: Zone
  message: string
}

export function Recommendation({ zone, message }: RecommendationProps) {
  return (
    <div className="animate-slide-up">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-primary/30",
          "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent",
          "p-4 md:p-5"
        )}
      >
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 animate-pulse-glow">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wider">Best Time to Go</p>
              <p className="text-foreground font-semibold mt-0.5">{message}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="sm:ml-auto flex items-center gap-2 text-primary text-sm font-medium group cursor-pointer">
            <span>View on map</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
