"use client"

import type { Zone, ZoneCategory } from "@/lib/types"
import { ZoneCard } from "./zone-card"
import { Utensils, Beer, Bath, ShoppingBag, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface ZoneGridProps {
  zones: Zone[]
  selectedCategory: ZoneCategory | "all"
  onCategoryChange: (category: ZoneCategory | "all") => void
  isLoading?: boolean
}

const categories: { value: ZoneCategory | "all"; label: string; icon: typeof Utensils }[] = [
  { value: "all", label: "All", icon: Utensils },
  { value: "food", label: "Food", icon: Utensils },
  { value: "drinks", label: "Drinks", icon: Beer },
  { value: "restroom", label: "Restrooms", icon: Bath },
  { value: "merchandise", label: "Merch", icon: ShoppingBag },
  { value: "exit", label: "Exits", icon: DoorOpen },
]

export function ZoneGrid({ zones, selectedCategory, onCategoryChange, isLoading }: ZoneGridProps) {
  const filteredZones =
    selectedCategory === "all" ? zones : zones.filter((z) => z.category === selectedCategory)

  // Sort by wait time (lowest first)
  const sortedZones = [...filteredZones].sort((a, b) => a.wait_time_minutes - b.wait_time_minutes)

  return (
    <div>
      {/* Category Tabs */}
      <nav 
        className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide"
        role="tablist"
        aria-label="Filter zones by category"
      >
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.value
          const count = cat.value === "all" ? zones.length : zones.filter((z) => z.category === cat.value).length

          return (
            <button
              key={cat.value}
              role="tab"
              aria-selected={isActive}
              aria-controls="zones-panel"
              onClick={() => onCategoryChange(cat.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{cat.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-xs",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
                aria-label={`${count} zones`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Grid */}
      <div 
        id="zones-panel"
        role="tabpanel"
        aria-label={`${selectedCategory === 'all' ? 'All' : selectedCategory} zones`}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ))
        ) : (
          sortedZones.map((zone, index) => (
            <div
              key={zone.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ZoneCard zone={zone} />
            </div>
          ))
        )}
      </div>

      {!isLoading && filteredZones.length === 0 && (
        <div 
          className="text-center py-12 text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          No zones found for this category
        </div>
      )}
    </div>
  )
}
