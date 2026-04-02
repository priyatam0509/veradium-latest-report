"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Activity, Phone, LayoutList } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface AnsweredByQueueRow {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  region: string
  answered: string
  '%_calls': string
}

export default function AnsweredByQueuePage() {
  const [data, setData] = useState<AnsweredByQueueRow[]>([])
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
      const result = await athenaAPI.getAnsweredByQueue(
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
      console.error("Failed to load answered by queue:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const totalQueues = data.length
  const totalAnswered = data.reduce((sum, r) => sum + parseInt(r.answered || '0'), 0)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Answered by Queue</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Answered call totals and rates broken down by queue
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Queues</CardTitle>
                <LayoutList className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQueues}
                </div>
                <p className="text-xs text-muted-foreground">Queues with answered calls</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Answered</CardTitle>
                <Phone className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAnswered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Across all queues</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queue Breakdown</CardTitle>
                  <CardDescription>Answered calls per queue with percentage share</CardDescription>
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
                        <TableHead>Queue Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Initiation Method</TableHead>
                        <TableHead className="text-right">Answered</TableHead>
                        <TableHead className="text-right">% of Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.queue_name}</TableCell>
                          <TableCell>{row.region || '—'}</TableCell>
                          <TableCell>{row.channel || '—'}</TableCell>
                          <TableCell>{row.initiation_method || '—'}</TableCell>
                          <TableCell className="text-right text-green-600 font-mono">{row.answered || '0'}</TableCell>
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
