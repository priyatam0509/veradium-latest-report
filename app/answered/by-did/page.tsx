"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Activity, Phone, Hash } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { useSortable, SortHead } from "@/lib/sort-table"

interface AnsweredByDIDRow {
  did: string
  channel: string
  initiation_method: string
  region: string
  received: string
  completed: string
  transferred: string
  '%_calls': string
  talk_time: string
  '%_talk_time': string
  avg_talk: string
  ring_time: string
}

export default function AnsweredByDIDPage() {
  const [data, setData] = useState<AnsweredByDIDRow[]>([])
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
      const result = await athenaAPI.getAnsweredByDID(
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
      console.error("Failed to load answered by DID:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const totalDIDs = data.length
  const totalReceived = data.reduce((sum, r) => sum + parseInt(r.received || '0'), 0)
  const totalCompleted = data.reduce((sum, r) => sum + parseInt(r.completed || '0'), 0)
  const totalTransferred = data.reduce((sum, r) => sum + parseInt(r.transferred || '0'), 0)

  const sort = useSortable(data)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Answered by DID</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Answered call metrics broken down by inbound phone number (DID)
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

              <Card className="w-full sm:w-auto">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-10 w-10">
                      <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">
                        {isRefreshing ? 'Refreshing...' : lastRefresh.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Last updated</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active DIDs</CardTitle>
                <Hash className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalDIDs}
                </div>
                <p className="text-xs text-muted-foreground">Inbound numbers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <Phone className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalReceived.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Calls received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Phone className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCompleted.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Calls completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transferred</CardTitle>
                <Phone className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalTransferred.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Calls transferred</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>DID Breakdown</CardTitle>
                  <CardDescription>Call metrics per inbound phone number</CardDescription>
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
                        <SortHead col="did" label="DID" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="channel" label="Channel" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="initiation_method" label="Initiation" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="received" label="Received" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="completed" label="Completed" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="transferred" label="Transferred" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="%_calls" label="% Calls" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="talk_time" label="Talk Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="avg_talk" label="Avg Talk" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="ring_time" label="Ring Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{row.did}</TableCell>
                          <TableCell>{row.region || '—'}</TableCell>
                          <TableCell>{row.channel || '—'}</TableCell>
                          <TableCell>{row.initiation_method || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{row.received || '0'}</TableCell>
                          <TableCell className="text-right text-green-600 font-mono">{row.completed || '0'}</TableCell>
                          <TableCell className="text-right text-blue-600 font-mono">{row.transferred || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{row['%_calls'] || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{row.talk_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{row.avg_talk || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{row.ring_time || '—'}</TableCell>
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
