"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useSortable, SortHead } from "@/lib/sort-table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, List, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"

interface AgentDrilldownRow {
  user_id: string
  agent_name: string
  event_timestamp: string
  eventtype: string
  agent_status_timestamp: string
  agent_status: string
  contact_state_start_timestamp: string
  contact_state: string
  contact_id: string
  recording: string
}

const EVENT_COLORS: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800',
  LOGOUT: 'bg-red-100 text-red-800',
  STATE_CHANGE: 'bg-blue-100 text-blue-800',
  CONTACT_INBOUND: 'bg-purple-100 text-purple-800',
  CONTACT_OUTBOUND: 'bg-orange-100 text-orange-800',
  CONTACT_TRANSFERRED: 'bg-purple-100 text-purple-800',
  AGENT_STATUS_CHANGED: 'bg-yellow-100 text-yellow-800',
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

  const sort = useSortable(rows)

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
                        <SortHead col="agent_name" label="Agent" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="eventtype" label="Event Type" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="event_timestamp" label="Event Timestamp" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="agent_status_timestamp" label="Status Timestamp" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="agent_status" label="Agent Status" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="contact_state_start_timestamp" label="Contact State Start" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="contact_state" label="Contact State" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="contact_id" label="Contact ID" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="user_id" label="User ID" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.agent_name || '—'}</TableCell>
                          <TableCell>
                            <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", EVENT_COLORS[row.eventtype] || 'bg-muted text-muted-foreground')}>
                              {row.eventtype || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{formatTimestamp(row.event_timestamp)}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(row.agent_status_timestamp)}</TableCell>
                          <TableCell>{row.agent_status || '—'}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(row.contact_state_start_timestamp)}</TableCell>
                          <TableCell>{row.contact_state || '—'}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.contact_id || '—'}</TableCell>
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
