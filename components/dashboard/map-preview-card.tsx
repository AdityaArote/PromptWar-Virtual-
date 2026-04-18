"use client"

import Link from "next/link"
import { Map, ArrowRight, MapPin } from "lucide-react"
import type { Zone } from "@/lib/types"

interface MapPreviewCardProps {
  zones: Zone[]
}

export function MapPreviewCard({ zones }: MapPreviewCardProps) {
  const busyZones = zones.filter((z) => z.status === "high" || z.status === "critical").length
  const lowZones = zones.filter((z) => z.status === "low").length

  return (
    <Link href="/map" className="block group">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Mini map visualization */}
        <div className="relative h-32 mb-3 rounded-lg bg-secondary/50 overflow-hidden">
          {/* Simulated map dots */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              {zones.slice(0, 8).map((zone, idx) => {
                const x = 15 + ((idx * 37 + 13) % 70)
                const y = 15 + ((idx * 29 + 7) % 65)
                const color =
                  zone.status === "low"
                    ? "bg-green-500"
                    : zone.status === "medium"
                      ? "bg-amber-500"
                      : "bg-red-500"

                return (
                  <div
                    key={zone.id}
                    className={`absolute h-3 w-3 rounded-full ${color} shadow-lg`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    {(zone.status === "high" || zone.status === "critical") && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-red-500/40" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

          {/* Map icon */}
          <div className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Map className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Venue Map
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lowZones} open · {busyZones} busy
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  )
}
