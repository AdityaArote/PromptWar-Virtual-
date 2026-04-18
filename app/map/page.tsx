"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// Leaflet must be loaded client-side only (no SSR)
const VenueMap = dynamic(() => import("@/components/map/venue-map").then((m) => m.VenueMap), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Map Header */}
      <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground">Venue Map</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Live
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <VenueMap />
        </Suspense>
      </div>
    </div>
  )
}
