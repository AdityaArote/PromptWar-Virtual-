"use client"

import type { VenueStats } from "@/lib/types"
import { TrendingDown, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsBarProps {
  stats: VenueStats
  isLoading?: boolean
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  const statItems = [
    {
      label: "Low Wait Zones",
      value: stats.lowWaitZones,
      icon: CheckCircle,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      label: "Avg Wait Time",
      value: `${stats.averageWait}m`,
      icon: Clock,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      label: "Improving",
      value: stats.improvingZones,
      icon: TrendingDown,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Avoid",
      value: stats.criticalZones,
      icon: AlertTriangle,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="status" aria-label="Loading statistics">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      role="region"
      aria-label="Venue statistics"
    >
      {statItems.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div className={`p-2 rounded-lg ${stat.bgColor}`} aria-hidden="true">
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div>
              <p 
                className="text-2xl font-bold text-foreground tabular-nums"
                aria-label={`${stat.label}: ${stat.value}`}
              >
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
