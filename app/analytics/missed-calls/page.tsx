"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, PhoneOff, Phone, AlertTriangle, RefreshCw, Activity } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface UnansweredByQueueData {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  total: string
  unanswered: string
  abandoned: string
  '%_calls': string
}

export default function MissedCallsAnalysis() {
  const [queueData, setQueueData] = useState<UnansweredByQueueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const [appliedRegion, setAppliedRegion] = useState<string[] | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getUnansweredByQueue(
        dateRange.start,
        dateRange.end,
        null,
        user?.email
      )

      if (result.status === 'SUCCEEDED') {
        setQueueData(result.data)
        setAppliedRegion(result.appliedRegion || null)
      } else {
        throw new Error(result.error || 'Query failed')
      }

      setLastRefresh(new Date())
    } catch (error) {
      console.error("Unanswered by queue error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load unanswered calls data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const totalCalls = queueData.reduce((sum, q) => sum + parseInt(q.total || '0'), 0)
  const totalUnanswered = queueData.reduce((sum, q) => sum + parseInt(q.unanswered || '0'), 0)
  const totalAbandoned = queueData.reduce((sum, q) => sum + parseInt(q.abandoned || '0'), 0)
  const totalQueues = queueData.length

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Unanswered Calls by Queue</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
                {appliedRegion && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Region: {appliedRegion.join(', ')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Unanswered and abandoned call breakdown per queue
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="w-full sm:w-auto">
                <CardContent className="p-4">
                  <select
                    defaultValue="getLastNDays"
                    onChange={(e) => {
                      const method = e.target.value
                      if (method === 'getLastNDays') {
                        setDateRange(DateHelper.getLastNDays(30))
                      } else if (method === 'getToday') {
                        setDateRange(DateHelper.getToday())
                      } else if (method === 'getThisMonth') {
                        setDateRange(DateHelper.getThisMonth())
                      }
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="h-10 w-10"
                    >
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
          <div>
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCalls.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all queues</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unanswered</CardTitle>
                  <PhoneOff className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUnanswered.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Not picked up</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
                  <PhoneOff className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAbandoned.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Caller hung up</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Queues</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQueues}
                  </div>
                  <p className="text-xs text-muted-foreground">Queues with data</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unanswered Calls by Queue</CardTitle>
                  <CardDescription>
                    Queue-level unanswered and abandoned breakdown
                  </CardDescription>
                </div>
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : queueData.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Queue Name</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Initiation Method</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Unanswered</TableHead>
                        <TableHead className="text-right">Abandoned</TableHead>
                        <TableHead className="text-right">% of Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueData.map((queue, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{queue.queue_name || queue.queue_id}</TableCell>
                          <TableCell>
                            <Badge variant={queue.channel === 'VOICE' ? "default" : "secondary"}>
                              {queue.channel || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>{queue.initiation_method || '-'}</TableCell>
                          <TableCell className="text-right font-mono">{queue.total}</TableCell>
                          <TableCell className="text-right font-mono text-orange-600">{queue.unanswered}</TableCell>
                          <TableCell className="text-right font-mono text-red-600">{queue.abandoned}</TableCell>
                          <TableCell className="text-right font-mono">{queue['%_calls'] || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No unanswered calls data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
