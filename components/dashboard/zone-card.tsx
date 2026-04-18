"use client"

import type { Zone, ZoneStatus, ZoneCategory } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Utensils,
  Beer,
  Bath,
  ShoppingBag,
  DoorOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ZoneCardProps {
  zone: Zone
}

const statusConfig: Record<ZoneStatus, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  low: {
    label: "Go Now",
    bgClass: "bg-chart-1/20",
    textClass: "text-chart-1",
    borderClass: "border-chart-1/30",
  },
  medium: {
    label: "Moderate",
    bgClass: "bg-chart-2/20",
    textClass: "text-chart-2",
    borderClass: "border-chart-2/30",
  },
  high: {
    label: "Busy",
    bgClass: "bg-chart-3/20",
    textClass: "text-chart-3",
    borderClass: "border-chart-3/30",
  },
  critical: {
    label: "Avoid",
    bgClass: "bg-chart-4/20",
    textClass: "text-chart-4",
    borderClass: "border-chart-4/30",
  },
}

const categoryIcons: Record<ZoneCategory, typeof Utensils> = {
  food: Utensils,
  drinks: Beer,
  restroom: Bath,
  merchandise: ShoppingBag,
  exit: DoorOpen,
}

const trendingIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

export function ZoneCard({ zone }: ZoneCardProps) {
  const status = statusConfig[zone.status]
  const CategoryIcon = categoryIcons[zone.category]
  const TrendIcon = trendingIcons[zone.trending]

  // Format last updated time
  const lastUpdated = new Date(zone.last_updated)
  const timeAgo = getTimeAgo(lastUpdated)

  return (
    <Card
      role="article"
      aria-label={`${zone.name} - ${status.label}, ${zone.wait_time_minutes} minute wait`}
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        "border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        status.borderClass,
        "bg-card"
      )}
      tabIndex={0}
    >
      {/* Status Bar */}
      <div 
        className={cn("absolute top-0 left-0 right-0 h-1", status.bgClass.replace("/20", ""))} 
        role="presentation"
        aria-hidden="true"
      />

      <CardContent className="p-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          {/* Icon and Info */}
          <div className="flex gap-3 flex-1 min-w-0">
            <div className={cn("p-2 rounded-lg shrink-0", status.bgClass)} aria-hidden="true">
              <CategoryIcon className={cn("h-5 w-5", status.textClass)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate text-sm">{zone.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{zone.location}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div 
            className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0", status.bgClass, status.textClass)}
            role="status"
            aria-label={`Status: ${status.label}`}
          >
            {status.label}
          </div>
        </div>

        {/* Wait Time Display */}
        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <Clock className="h-4 w-4 text-muted-foreground mr-1" aria-hidden="true" />
            <span className={cn("text-3xl font-bold tabular-nums", status.textClass)} aria-label={`${zone.wait_time_minutes} minutes wait time`}>
              {zone.wait_time_minutes}
            </span>
            <span className="text-sm text-muted-foreground">min</span>
          </div>

          {/* Trending */}
          <div className="flex items-center gap-1" aria-label={`Trend: ${zone.trending}`}>
            <TrendIcon
              className={cn(
                "h-4 w-4",
                zone.trending === "up" && "text-chart-4",
                zone.trending === "down" && "text-chart-1",
                zone.trending === "stable" && "text-muted-foreground"
              )}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground capitalize">{zone.trending}</span>
          </div>
        </div>

        {/* Crowd Density Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Crowd Density</span>
            <span aria-label={`${zone.crowd_density}% capacity`}>{zone.crowd_density}%</span>
          </div>
          <div 
            className="h-1.5 bg-secondary rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={zone.crowd_density}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Crowd density"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                zone.crowd_density < 35 && "bg-chart-1",
                zone.crowd_density >= 35 && zone.crowd_density < 60 && "bg-chart-2",
                zone.crowd_density >= 60 && zone.crowd_density < 80 && "bg-chart-3",
                zone.crowd_density >= 80 && "bg-chart-4"
              )}
              style={{ width: `${zone.crowd_density}%` }}
            />
          </div>
        </div>

        {/* Last Updated */}
        <p className="mt-2 text-xs text-muted-foreground text-right">
          <span className="sr-only">Last updated</span>
          {timeAgo}
        </p>
      </CardContent>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 120) return '1 min ago'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`
  if (seconds < 7200) return '1 hour ago'
  return `${Math.floor(seconds / 3600)} hours ago`
}
