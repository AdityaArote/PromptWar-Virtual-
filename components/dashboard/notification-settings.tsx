"use client"

import { useState, useEffect } from "react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"
import type { Zone, NotificationPreference } from "@/lib/types"

interface NotificationSettingsProps {
  zones: Zone[]
}

export function NotificationSettings({ zones }: NotificationSettingsProps) {
  const { sessionId } = useSession()
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, error } =
    usePushNotifications(sessionId)
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [waitThreshold, setWaitThreshold] = useState(5)
  const [capacityThreshold, setCapacityThreshold] = useState(80)
  const [saving, setSaving] = useState(false)

  // Load existing preferences
  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/push/preferences?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setPreferences(res.data)
      })
      .catch(console.error)
  }, [sessionId])

  const handleSavePreference = async () => {
    if (!selectedZone || !sessionId) return
    setSaving(true)

    try {
      const res = await fetch("/api/push/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          zone_id: selectedZone,
          wait_threshold_minutes: waitThreshold,
          capacity_threshold_pct: capacityThreshold,
        }),
      })
      const result = await res.json()
      if (result.data) {
        setPreferences((prev) => {
          const existing = prev.findIndex((p) => p.zone_id === selectedZone)
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = result.data
            return updated
          }
          return [...prev, result.data]
        })
      }
    } catch (err) {
      console.error("Failed to save preference:", err)
    } finally {
      setSaving(false)
    }
  }

  if (!isSupported) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 relative"
          aria-label="Notification settings"
        >
          {isSubscribed ? (
            <BellRing className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Alerts</span>
          {preferences.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {preferences.length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Push Notification Settings
          </DialogTitle>
          <DialogDescription>
            Get alerted when your favorite zones have short wait times or capacity changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Push Notifications</Label>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? "Receiving alerts" : "Enable to get zone alerts"}
              </p>
            </div>
            <Switch
              checked={isSubscribed}
              onCheckedChange={(checked) => {
                if (checked) subscribe()
                else unsubscribe()
              }}
              disabled={isLoading}
              aria-label="Toggle push notifications"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {isSubscribed && (
            <>
              {/* Zone selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Set Zone Alert</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedZone || ""}
                  onChange={(e) => {
                    setSelectedZone(e.target.value || null)
                    const pref = preferences.find((p) => p.zone_id === e.target.value)
                    if (pref) {
                      setWaitThreshold(pref.wait_threshold_minutes)
                      setCapacityThreshold(pref.capacity_threshold_pct)
                    }
                  }}
                >
                  <option value="">Select a zone...</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.category})
                    </option>
                  ))}
                </select>
              </div>

              {selectedZone && (
                <>
                  {/* Wait time threshold */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-sm font-medium">Alert when wait drops below</Label>
                      <span className="text-sm font-mono text-primary">{waitThreshold} min</span>
                    </div>
                    <Slider
                      value={[waitThreshold]}
                      onValueChange={([v]) => setWaitThreshold(v)}
                      min={1}
                      max={30}
                      step={1}
                    />
                  </div>

                  {/* Capacity threshold */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-sm font-medium">Alert when capacity exceeds</Label>
                      <span className="text-sm font-mono text-primary">{capacityThreshold}%</span>
                    </div>
                    <Slider
                      value={[capacityThreshold]}
                      onValueChange={([v]) => setCapacityThreshold(v)}
                      min={50}
                      max={100}
                      step={5}
                    />
                  </div>

                  <Button onClick={handleSavePreference} disabled={saving} className="w-full gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Alert Rule
                  </Button>
                </>
              )}

              {/* Active preferences */}
              {preferences.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Active Alerts</Label>
                  {preferences.map((pref) => {
                    const zone = zones.find((z) => z.id === pref.zone_id)
                    return (
                      <div
                        key={pref.id}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{zone?.name || "Unknown"}</span>
                          <span className="text-muted-foreground ml-2">
                            &lt;{pref.wait_threshold_minutes}min / &gt;{pref.capacity_threshold_pct}%
                          </span>
                        </div>
                        <BellOff
                          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => {
                            fetch("/api/push/preferences", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                session_id: sessionId,
                                zone_id: pref.zone_id,
                                is_active: false,
                                wait_threshold_minutes: pref.wait_threshold_minutes,
                                capacity_threshold_pct: pref.capacity_threshold_pct,
                              }),
                            }).then(() => {
                              setPreferences((prev) => prev.filter((p) => p.id !== pref.id))
                            })
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
