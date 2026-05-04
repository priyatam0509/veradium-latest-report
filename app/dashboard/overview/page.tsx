"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, PhoneOff, Target, User, RefreshCw } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface QueueData {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  contacts: string
  answered: string
  outbound: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  _answered: string
  _unanswered: string
  sla: string
}


export default function DashboardOverview() {
  const [queueStats, setQueueStats] = useState<QueueData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [kpis, setKpis] = useState({
    totalCalls: 0,
    answeredCalls: 0,
    missedCalls: 0,
    avgSLA: 0
  })
  const { user } = useAuth()
  const [appliedRegion, setAppliedRegion] = useState<string[] | null>(null)

  useEffect(() => {
    if (!user?.email) return

    loadDashboardData()
  }, [user?.email])

  const loadDashboardData = async () => {
    setIsLoading(true)

    try {
      // Get yesterday's date range
      const yesterday = DateHelper.getYesterday()

      // Fetch yesterday's queue data
      const [queueResult] = await Promise.all([
        athenaAPI.getDistributionByQueue(yesterday.start, yesterday.end, null, user?.email),
      ])
      
      if (queueResult.status === 'SUCCEEDED') {
        setQueueStats(queueResult.data)
        setAppliedRegion(queueResult.appliedRegion || null)
        
        // Calculate yesterday's KPIs
        const totalReceived = queueResult.data.reduce((sum, q) => sum + parseInt(q.contacts || '0'), 0)
        const totalAnswered = queueResult.data.reduce((sum, q) => sum + parseInt(q.answered || '0'), 0)
        const totalAbandoned = queueResult.data.reduce((sum, q) => sum + parseInt(q.abandoned || '0'), 0)
        const avgSLA = queueResult.data.length > 0
          ? queueResult.data.reduce((sum, q) => sum + parseFloat(q.sla || '0'), 0) / queueResult.data.length
          : 0

        setKpis({
          totalCalls: totalReceived,
          answeredCalls: totalAnswered,
          missedCalls: totalAbandoned,
          avgSLA: Math.round(avgSLA)
        })
      }

      setLastRefresh(new Date())

    } catch (error) {
      console.error("Dashboard data error:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    loadDashboardData()
  }

  const formatRefreshTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }


  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section with User Info */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome, {user?.email?.split('@')[0] || 'User'}
                </h1>
                {appliedRegion && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Target className="h-3 w-3 mr-1" />
                    Region: {appliedRegion.join(', ')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Contact center performance {appliedRegion ? `(${appliedRegion.join(', ')} region)` : '(all regions)'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* User Info Card */}
              <Card className="w-full sm:w-auto">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Last Refresh Info with Manual Refresh */}
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
                        {isRefreshing ? 'Refreshing...' : formatRefreshTime(lastRefresh)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Real-time Metrics */}
          {/* <div>
            <h2 className="text-xl font-semibold mb-4">Real-time Status</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : realtimeMetrics.activeCalls}
                  </div>
                  <p className="text-xs text-muted-foreground">In progress now</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Waiting</CardTitle>
                  <Phone className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : realtimeMetrics.waitingCalls}
                  </div>
                  <p className="text-xs text-muted-foreground">In queue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agents Online</CardTitle>
                  <User className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : realtimeMetrics.agentsOnline}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {realtimeMetrics.agentsBusy} busy
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Longest Wait</CardTitle>
                  <Calendar className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatWaitTime(realtimeMetrics.longestWaitTime)}
                  </div>
                  <p className="text-xs text-muted-foreground">Current max</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${Math.round((realtimeMetrics.agentsBusy / realtimeMetrics.agentsOnline) * 100)}%`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Agent capacity</p>
                </CardContent>
              </Card>
            </div>
          </div> */}

          {/* Historical KPI Cards (Last 30 Days) */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Yesterday's Performance</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.totalCalls.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Yesterday</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Answered Calls</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.answeredCalls.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpis.totalCalls > 0 ? `${Math.round((kpis.answeredCalls / kpis.totalCalls) * 100)}% of total` : '0%'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Abandoned Calls</CardTitle>
                  <PhoneOff className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : kpis.missedCalls.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpis.totalCalls > 0 ? `${Math.round((kpis.missedCalls / kpis.totalCalls) * 100)}% of total` : '0%'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average SLA</CardTitle>
                  <Target className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${kpis.avgSLA}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all queues</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Queue Performance Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Queue Performance (Top 10)</CardTitle>
                  <CardDescription>Summary metrics for all queues - Yesterday</CardDescription>
                </div>
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Queue Name</TableHead>
                        <TableHead className="text-right">Channel</TableHead>
                        <TableHead className="text-right">Method</TableHead>
                        <TableHead className="text-right">Contacts</TableHead>
                        <TableHead className="text-right">Answered</TableHead>
                        <TableHead className="text-right">Outbound</TableHead>
                        <TableHead className="text-right">Unanswered</TableHead>
                        <TableHead className="text-right">Abandoned</TableHead>
                        <TableHead className="text-right">Transferred</TableHead>
                        <TableHead className="text-right">Avg Wait</TableHead>
                        <TableHead className="text-right">Avg Talk</TableHead>
                        <TableHead className="text-right">Max Callers</TableHead>
                        <TableHead className="text-right">SLA %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueStats.slice(0, 10).map((queue, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{queue.queue_name || queue.queue_id}</TableCell>
                          <TableCell className="text-right">{queue.channel || '-'}</TableCell>
                          <TableCell className="text-right">{queue.initiation_method || '-'}</TableCell>
                          <TableCell className="text-right">{queue.contacts}</TableCell>
                          <TableCell className="text-right text-green-600">{queue.answered}</TableCell>
                          <TableCell className="text-right text-blue-600">{queue.outbound || '0'}</TableCell>
                          <TableCell className="text-right text-red-600">{queue.unanswered}</TableCell>
                          <TableCell className="text-right text-orange-600">{queue.abandoned || '0'}</TableCell>
                          <TableCell className="text-right text-blue-600">{queue.transferred || '0'}</TableCell>
                          <TableCell className="text-right">{queue.avg_wait || '-'}</TableCell>
                          <TableCell className="text-right">{queue.avg_talk || '-'}</TableCell>
                          <TableCell className="text-right">{queue.max_callers || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={parseFloat(queue.sla) >= 80 ? "default" : "destructive"}
                              className="font-mono"
                            >
                              {queue.sla}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {queueStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={13} className="text-center text-muted-foreground">
                            No queue data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hourly Traffic Chart */}
          {/* <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Today's Hourly Traffic</CardTitle>
                  <CardDescription>Calls received by hour - {new Date().toLocaleDateString()}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  Today
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : hourlyData.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Hour</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Answered</TableHead>
                        <TableHead className="text-right">Answer Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hourlyData.map((hour, index) => {
                        const received = parseInt(hour.received || '0')
                        const answered = parseInt(hour.answered || '0')
                        const answerRate = received > 0 ? Math.round((answered / received) * 100) : 0
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{hour.hour}</TableCell>
                            <TableCell className="text-right">{hour.received}</TableCell>
                            <TableCell className="text-right text-green-600">{hour.answered}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={answerRate >= 80 ? "default" : answerRate >= 60 ? "secondary" : "destructive"}
                              >
                                {answerRate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hourly data available for today</p>
              )}
            </CardContent>
          </Card> */}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}