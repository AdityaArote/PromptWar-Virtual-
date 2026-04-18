"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { ZoneGrid } from "@/components/dashboard/zone-grid"
import { Recommendation } from "@/components/dashboard/recommendation"
import { StatsBar } from "@/components/dashboard/stats-bar"
import { useZones } from "@/hooks/use-zones"
import { useActiveVenue } from "@/hooks/use-venue"
import { useStats } from "@/hooks/use-stats"
import type { ZoneCategory, Zone, VenueInfo } from "@/lib/types"
import { RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function FlowZoneDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<ZoneCategory | "all">("all")
  const [isLive, setIsLive] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch real data from Supabase
  const { zones, isLoading: zonesLoading, error: zonesError, refresh: refreshZones } = useZones({
    enableRealtime: isLive,
  })
  
  const { venue, event, isLoading: venueLoading, error: venueError } = useActiveVenue()
  const { stats, isLoading: statsLoading, refresh: refreshStats } = useStats({
    venueId: venue?.id,
    refreshInterval: isLive ? 10000 : 0,
  })

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([refreshZones(), refreshStats()])
    setTimeout(() => setIsRefreshing(false), 500)
  }, [refreshZones, refreshStats])

  // Get best recommendation
  const recommendation = getBestRecommendation(zones)

  // Build venue info for header
  const venueInfo: VenueInfo | null = venue && event ? {
    id: venue.id,
    name: venue.name,
    event: event.name,
    currentAttendance: event.current_attendance,
    capacity: venue.capacity,
    eventTime: event.event_time || 'Live',
  } : null

  const hasError = zonesError || venueError
  const isLoading = zonesLoading || venueLoading

  if (isLoading && !zones.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div 
          className="flex flex-col items-center gap-4"
          role="status"
          aria-label="Loading venue data"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading venue data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      {venueInfo && <Header venue={venueInfo} isLive={isLive} />}

      <main id="main-content" className="container mx-auto px-4 py-6">
        {/* Error Alert */}
        {hasError && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Failed to fetch zones. Using cached data if available.
            </AlertDescription>
          </Alert>
        )}

        {/* Top Section: Recommendation + Stats */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Recommendation Banner */}
          {recommendation && (
            <Recommendation zone={recommendation.zone} message={recommendation.message} />
          )}

          {/* Stats Bar */}
          <StatsBar stats={stats} isLoading={statsLoading} />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Venue Zones</h2>
            <p className="text-sm text-muted-foreground">
              {zones.length} zones available
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Toggle */}
            <button
              onClick={() => setIsLive(!isLive)}
              aria-pressed={isLive}
              aria-label={isLive ? "Pause live updates" : "Resume live updates"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isLive
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span 
                className={`h-2 w-2 rounded-full ${isLive ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
                aria-hidden="true"
              />
              {isLive ? "Live" : "Paused"}
            </button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh zone data"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Zone Grid */}
        <ZoneGrid
          zones={zones}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isLoading={zonesLoading && !zones.length}
        />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            FlowZone - Real-time Crowd Intelligence for{" "}
            <span className="text-foreground font-medium">{venueInfo?.name || 'Your Venue'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isLive ? "Data updates in real-time via Supabase." : "Live updates paused."} Times are estimates based on crowd sensors.
          </p>
        </footer>
      </main>
    </div>
  )
}

// Helper function to get best recommendation
function getBestRecommendation(zones: Zone[]): { zone: Zone; message: string } | null {
  if (!zones.length) return null

  // Find zone with lowest wait time
  const sortedByWait = [...zones].sort((a, b) => a.wait_time_minutes - b.wait_time_minutes)
  const bestZone = sortedByWait[0]

  if (!bestZone) return null

  const categoryLabels: Record<string, string> = {
    food: 'grab food',
    drinks: 'get drinks', 
    restroom: 'use restroom',
    merchandise: 'shop merchandise',
    exit: 'exit venue',
  }

  const action = categoryLabels[bestZone.category] || 'visit'

  return {
    zone: bestZone,
    message: `Head to ${bestZone.name} now - only ${bestZone.wait_time_minutes} min wait to ${action}!`,
  }
}
