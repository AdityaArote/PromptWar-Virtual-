"use client"

import { useEffect, useState, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useZones } from "@/hooks/use-zones"
import { useHeatmap } from "@/hooks/use-heatmap"
import { useRouting } from "@/hooks/use-routing"
import { useActiveVenue } from "@/hooks/use-venue"
import { ZonePopup } from "./zone-popup"
import { RoutingPanel } from "./routing-panel"
import { Layers, Thermometer, MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ZoneWithCoords } from "@/lib/types"

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

const STATUS_COLORS: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
}

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔",
  drinks: "🍺",
  restroom: "🚻",
  merchandise: "🛍️",
  exit: "🚪",
}

export function VenueMap() {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const heatLayerRef = useRef<L.Layer | null>(null)

  const { zones } = useZones({ enableRealtime: true })
  const { venue } = useActiveVenue()
  const { heatPoints } = useHeatmap({ venueId: venue?.id, enabled: true })
  const { recommendations, isLoading: routingLoading, getRecommendations, clearRecommendations } = useRouting()

  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showPins, setShowPins] = useState(true)
  const [selectedZone, setSelectedZone] = useState<ZoneWithCoords | null>(null)
  const [showRouting, setShowRouting] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const centerLat = 40.7128
    const centerLng = -74.006
    const zoom = 17

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    // Use CartoDB dark tiles for premium look
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
    }).addTo(map)

    // Add zoom control to bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map)

    // Attribution
    L.control
      .attribution({ position: "bottomleft" })
      .addAttribution('&copy; <a href="https://carto.com/">CARTO</a>')
      .addTo(map)

    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update zone markers
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !showPins) return

    markersRef.current.clearLayers()

    const zonesWithCoords = zones.filter(
      (z) => (z as ZoneWithCoords).lat != null && (z as ZoneWithCoords).lng != null
    ) as ZoneWithCoords[]

    // If we have zones with coords, fit the map to their bounds
    if (zonesWithCoords.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(
        zonesWithCoords.map((z) => [z.lat!, z.lng!] as [number, number])
      )
      mapRef.current.fitBounds(bounds.pad(0.2))
    }

    zonesWithCoords.forEach((zone) => {
      if (zone.lat == null || zone.lng == null) return

      const color = STATUS_COLORS[zone.status] || "#6b7280"
      const icon = CATEGORY_ICONS[zone.category] || "📍"
      const pulseClass = zone.status === "critical" || zone.status === "high" ? "pulse-ring" : ""

      const customIcon = L.divIcon({
        className: "custom-zone-marker",
        html: `
          <div class="zone-pin ${pulseClass}" style="--pin-color: ${color}">
            <div class="zone-pin-inner" style="background: ${color}">
              <span class="zone-pin-icon">${icon}</span>
            </div>
            <div class="zone-pin-label">${zone.wait_time_minutes}m</div>
          </div>
        `,
        iconSize: [44, 56],
        iconAnchor: [22, 56],
        popupAnchor: [0, -56],
      })

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon })

      marker.on("click", () => {
        setSelectedZone(zone)
      })

      markersRef.current!.addLayer(marker)
    })
  }, [zones, showPins])

  // Handle heatmap layer
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    if (!showHeatmap || heatPoints.length === 0) return

    // Canvas-based heatmap rendering (simple gradient circles)
    const heatGroup = L.layerGroup()

    heatPoints.forEach(([lat, lng, intensity]) => {
      const radius = 15 + intensity * 30
      const opacity = 0.3 + intensity * 0.4

      // Color gradient: green → yellow → red
      let fillColor: string
      if (intensity < 0.33) fillColor = "#22c55e"
      else if (intensity < 0.66) fillColor = "#f59e0b"
      else fillColor = "#ef4444"

      L.circle([lat, lng], {
        radius: radius,
        fillColor,
        fillOpacity: opacity,
        stroke: false,
      }).addTo(heatGroup)
    })

    heatGroup.addTo(mapRef.current)
    heatLayerRef.current = heatGroup
  }, [showHeatmap, heatPoints])

  // Handle routing
  const handleFindAlternatives = (zoneId: string, category?: string) => {
    getRecommendations(zoneId, category)
    setShowRouting(true)
  }

  return (
    <div className="relative h-full w-full">
      {/* Inject pin styles */}
      <style jsx global>{`
        .custom-zone-marker {
          background: transparent !important;
          border: none !important;
        }
        .zone-pin {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .zone-pin:hover {
          transform: scale(1.15);
        }
        .zone-pin-inner {
          width: 36px;
          height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.3);
        }
        .zone-pin-icon {
          transform: rotate(45deg);
          font-size: 16px;
          line-height: 1;
        }
        .zone-pin-label {
          margin-top: 2px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          background: rgba(0,0,0,0.7);
          padding: 1px 5px;
          border-radius: 8px;
          white-space: nowrap;
          font-family: var(--font-geist-mono);
        }
        .pulse-ring::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 2px solid var(--pin-color);
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: translateX(-50%) scale(0.8); opacity: 1; }
          100% { transform: translateX(-50%) scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Map container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Layer controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Button
          variant={showPins ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowPins(!showPins)}
          className="gap-2 shadow-lg"
        >
          <MapPin className="h-4 w-4" />
          Pins
        </Button>
        <Button
          variant={showHeatmap ? "default" : "secondary"}
          size="sm"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="gap-2 shadow-lg"
        >
          <Thermometer className="h-4 w-4" />
          Heatmap
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (mapRef.current) {
              const zonesWithCoords = zones.filter(
                (z) => (z as ZoneWithCoords).lat != null
              ) as ZoneWithCoords[]
              if (zonesWithCoords.length > 0) {
                const bounds = L.latLngBounds(
                  zonesWithCoords.map((z) => [z.lat!, z.lng!] as [number, number])
                )
                mapRef.current.fitBounds(bounds.pad(0.2))
              }
            }
          }}
          className="gap-2 shadow-lg"
        >
          <Layers className="h-4 w-4" />
          Fit
        </Button>
      </div>

      {/* Zone popup */}
      {selectedZone && (
        <ZonePopup
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
          onFindAlternatives={() => handleFindAlternatives(selectedZone.id, selectedZone.category)}
        />
      )}

      {/* Routing panel */}
      {showRouting && (
        <RoutingPanel
          recommendations={recommendations}
          isLoading={routingLoading}
          onClose={() => {
            setShowRouting(false)
            clearRecommendations()
          }}
          onSelectZone={(zone) => {
            if (mapRef.current && zone.lat && zone.lng) {
              mapRef.current.setView([zone.lat, zone.lng], 18, { animate: true })
            }
            setSelectedZone(zone)
            setShowRouting(false)
            clearRecommendations()
          }}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-card/90 backdrop-blur-sm rounded-lg border border-border p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-2">Zone Status</p>
        <div className="flex flex-col gap-1">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted-foreground capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
