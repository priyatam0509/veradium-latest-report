"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"

interface Freshness {
  data_lake_updates?: string
  agent_events_updates?: string
}

/** Formats "2026-07-12 12:25:04.146" → "Jul 12, 12:25:04 PM" (no timezone math). */
function formatTimestamp(ts?: string): string {
  if (!ts) return "—"
  const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!m) return ts
  const [, y, mo, d, hh, mm, ss] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss || "0"))
  if (isNaN(date.getTime())) return ts
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

interface DataFreshnessCardProps {
  /** Called when the refresh button is clicked (reload the page's own data). */
  onRefresh?: () => void
  /** Spinner state driven by the page's data reload. */
  isRefreshing?: boolean
}

/**
 * Shows how fresh the underlying data is, using the backend
 * `dashboard_qry_data_freshness` query. Displays both the data-lake and
 * agent-events update timestamps. Refetches on mount and whenever the refresh
 * button is clicked.
 */
export function DataFreshnessCard({ onRefresh, isRefreshing }: DataFreshnessCardProps) {
  const [data, setData] = useState<Freshness | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await athenaAPI.getDataFreshness()
      if (res.status === "SUCCEEDED" && res.data?.length) {
        setData(res.data[0])
      }
    } catch (error) {
      console.error("[DataFreshness] Failed to load data freshness:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleClick = () => {
    onRefresh?.()
    load()
  }

  return (
    <Card className="w-full sm:w-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={isRefreshing || loading}
            className="h-10 w-10 shrink-0"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing || loading ? "animate-spin" : ""}`} />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Data Lake</span>
              <span className="text-xs font-medium leading-none">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : formatTimestamp(data?.data_lake_updates)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Agent Events</span>
              <span className="text-xs font-medium leading-none">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : formatTimestamp(data?.agent_events_updates)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
