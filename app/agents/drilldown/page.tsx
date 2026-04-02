"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, List, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"

interface AgentDrilldownRow {
  maxof_eventtimestamp: string
  event_type: string
  status_name: string
  status_timestamp: string
  user_id: string
  first_name: string
}

const EVENT_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-red-100 text-red-800',
  STATE_CHANGE: 'bg-blue-100 text-blue-800',
}

const formatTimestamp = (ts: string) => {
  if (!ts) return '—'
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ts
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

export default function AgentDrilldownPage() {
  const [rows, setRows] = useState<AgentDrilldownRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentDrilldown(
        DateHelper.formatDateFromDate(startDate),
        DateHelper.formatDateFromDate(endDate, true)
      )
      if (result.status === 'SUCCEEDED') {
        setRows(result.data)
      } else {
        throw new Error(result.error || 'Query failed')
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to load agent state log:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Agent State Log</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Agent login, logout, and state change events
            </p>
          </div>

          {/* Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Date Range</CardTitle>
              <CardDescription>Select a date range and generate the report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setIsStartOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setIsEndOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={loadData} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Generate Report
                </Button>
              </div>
              {lastRefresh && (
                <p className="text-xs text-muted-foreground mt-3">Last loaded: {lastRefresh.toLocaleTimeString()}</p>
              )}
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agent State Events</CardTitle>
              <CardDescription>
                {rows.length > 0
                  ? `${rows.length.toLocaleString()} events`
                  : 'Run the report to see data'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : rows.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Max Event Timestamp</TableHead>
                        <TableHead>Status Timestamp</TableHead>
                        <TableHead>User ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.first_name || '—'}</TableCell>
                          <TableCell>
                            <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", EVENT_COLORS[row.event_type] || 'bg-muted text-muted-foreground')}>
                              {row.event_type || '—'}
                            </span>
                          </TableCell>
                          <TableCell>{row.status_name || '—'}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(row.maxof_eventtimestamp)}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(row.status_timestamp)}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.user_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Select a date range and click Generate Report
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
