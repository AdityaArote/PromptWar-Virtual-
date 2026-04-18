"use client"

import type { VenueInfo, Zone } from "@/lib/types"
import { Activity, Users, Radio, Map } from "lucide-react"
import { NotificationSettings } from "./notification-settings"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  venue: VenueInfo
  isLive: boolean
  zones?: Zone[]
}

export function Header({ venue, isLive, zones = [] }: HeaderProps) {
  const occupancyPercent = Math.round((venue.currentAttendance / venue.capacity) * 100)

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Logo and Venue */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">FlowZone</h1>
                <p className="text-xs text-muted-foreground">{venue.name}</p>
              </div>
            </div>
          </div>

          {/* Event Info */}
          <div className="flex items-center gap-4">
            {/* Map Link */}
            <Link href="/map">
              <Button variant="outline" size="sm" className="gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Map View</span>
              </Button>
            </Link>

            {/* Notifications */}
            <NotificationSettings zones={zones} />

            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              )}
              <span className="text-sm font-medium text-primary">{isLive ? "LIVE" : "OFFLINE"}</span>
            </div>

            {/* Event Time */}
            <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono font-semibold text-foreground">{venue.eventTime}</span>
            </div>

            {/* Attendance */}
            <div className="hidden sm:flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {venue.currentAttendance.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">/ {venue.capacity.toLocaleString()}</span>
              </div>
              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${occupancyPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Event Name */}
        <p className="mt-2 text-sm text-muted-foreground">{venue.event}</p>
      </div>
    </header>
  )
}
