"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Activity, WifiOff, LayoutList } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { useSortable, SortHead } from "@/lib/sort-table"

interface DisconnectionRow {
  queue_id: string
  region: string
  queue_name: string
  disconnect_reason: string
  total: string
  '%_calls': string
}

const REASON_COLORS: Record<string, string> = {
  Abandoned: 'bg-orange-100 text-orange-800',
  Unanswered: 'bg-red-100 text-red-800',
}

export default function DisconnectionCausePage() {
  const [data, setData] = useState<DisconnectionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading, user?.email, dateRange])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getUnansweredDisconnectionCause(
        dateRange.start,
        dateRange.end,
        null,
        user?.email
      )
      if (result.status === 'SUCCEEDED') {
        setData(result.data)
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to load disconnection cause data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const totalQueues = [...new Set(data.map(r => r.queue_id))].length
  const totalCalls = data.reduce((sum, r) => sum + parseInt(r.total || '0'), 0)
  const abandonedTotal = data.filter(r => r.disconnect_reason === 'Abandoned').reduce((sum, r) => sum + parseInt(r.total || '0'), 0)

  const sort = useSortable(data)
  const unansweredTotal = data.filter(r => r.disconnect_reason === 'Unanswered').reduce((sum, r) => sum + parseInt(r.total || '0'), 0)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Disconnection Cause</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Breakdown of unanswered call disconnect reasons by queue
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="w-full sm:w-auto">
                <CardContent className="p-4">
                  <select
                    defaultValue="getLastNDays"
                    onChange={(e) => {
                      const method = e.target.value
                      if (method === 'getLastNDays') setDateRange(DateHelper.getLastNDays(30))
                      else if (method === 'getToday') setDateRange(DateHelper.getToday())
                      else if (method === 'getThisMonth') setDateRange(DateHelper.getThisMonth())
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="getToday">Today</option>
                    <option value="getLastNDays">Last 30 Days</option>
                    <option value="getThisMonth">This Month</option>
                  </select>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queues Affected</CardTitle>
                <LayoutList className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQueues}
                </div>
                <p className="text-xs text-muted-foreground">Unique queues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Disconnects</CardTitle>
                <WifiOff className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCalls.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All disconnect events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
                <WifiOff className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : abandonedTotal.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Caller hung up</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unanswered</CardTitle>
                <WifiOff className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : unansweredTotal.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Not answered</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Disconnection Cause Breakdown</CardTitle>
                  <CardDescription>Unanswered call disconnect reasons per queue</CardDescription>
                </div>
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : data.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="queue_name" label="Queue Name" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="disconnect_reason" label="Disconnect Reason" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="total" label="Total" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="%_calls" label="% of Calls" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.queue_name || '—'}</TableCell>
                          <TableCell>{row.region || '—'}</TableCell>
                          <TableCell>
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${REASON_COLORS[row.disconnect_reason] || 'bg-muted text-muted-foreground'}`}>
                              {row.disconnect_reason || '—'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">{row.total || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{row['%_calls'] || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
