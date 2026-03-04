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

interface MissedCallsData {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  sla: string
}

interface DisconnectReasonData {
  disconnect_reason: string
  total: string
  _calls: string
}

export default function MissedCallsAnalysis() {
  const [missedCallsData, setMissedCallsData] = useState<MissedCallsData[]>([])
  const [disconnectReasons, setDisconnectReasons] = useState<DisconnectReasonData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const [appliedRegion, setAppliedRegion] = useState<string[] | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadMissedCallsData()
  }, [dateRange])

  const loadMissedCallsData = async () => {
    setIsLoading(true)
    try {
      // Parallel data fetching
      const [missedResult, reasonsResult] = await Promise.all([
        athenaAPI.getUnansweredByQueue(
          dateRange.start,
          dateRange.end,
          null,
          user?.email
        ),
        athenaAPI.getUnansweredDisconnectionCause(
          dateRange.start,
          dateRange.end,
          null,
          user?.email
        )
      ])
      
      if (missedResult.status === 'SUCCEEDED') {
        setMissedCallsData(missedResult.data)
        setAppliedRegion(missedResult.appliedRegion || null)
      }
      
      if (reasonsResult.status === 'SUCCEEDED') {
        setDisconnectReasons(reasonsResult.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Missed calls data error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load missed calls data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadMissedCallsData().finally(() => setIsRefreshing(false))
  }

  const totalMissed = missedCallsData.reduce((sum, q) => sum + parseInt(q.unanswered || '0'), 0)
  const totalReceived = missedCallsData.reduce((sum, q) => sum + parseInt(q.received || '0'), 0)
  const totalAnswered = missedCallsData.reduce((sum, q) => sum + parseInt(q.answered || '0'), 0)
  const totalAbandoned = missedCallsData.reduce((sum, q) => sum + parseInt(q.abandoned || '0'), 0)
  const avgSLA = missedCallsData.length > 0 
    ? (missedCallsData.reduce((sum, q) => sum + parseFloat(q.sla || '0'), 0) / missedCallsData.length).toFixed(1)
    : '0'

  // Prepare data for pie chart visualization (table format for now)
  const chartData = disconnectReasons.map(reason => ({
    name: reason.disconnect_reason,
    value: parseInt(reason.total || '0'),
    percentage: reason._calls
  }))

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Missed Calls Analysis</h1>
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
                Missed and abandoned call analysis {appliedRegion ? `(${appliedRegion.join(', ')} region)` : '(all regions)'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date Range Selector */}
              <Card className="w-full sm:w-auto">
                <CardContent className="p-4">
                  <select 
                    defaultValue="getLastNDays"
                    onChange={(e) => {
                      const method = e.target.value as keyof typeof DateHelper
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

              {/* Refresh Info */}
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
                      <p className="text-xs text-muted-foreground">
                        Last updated
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* KPI Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Missed Calls Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalReceived.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg SLA</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${avgSLA}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">Service level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unanswered</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalMissed.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalAbandoned > 0 ? `${totalAbandoned} abandoned calls` : 'No abandoned calls'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Reason</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 truncate">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : disconnectReasons.length > 0 ? (
                      disconnectReasons[0].disconnect_reason.length > 15 
                        ? disconnectReasons[0].disconnect_reason.substring(0, 15) + '...'
                        : disconnectReasons[0].disconnect_reason
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {disconnectReasons.length > 0 ? `${disconnectReasons[0].total} calls` : 'No data'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Disconnect Reasons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Disconnect Reasons</CardTitle>
                  <CardDescription>
                    Why calls were missed or abandoned - Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}
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
              ) : disconnectReasons.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                        <TableHead className="text-right">Visual</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {disconnectReasons.map((reason, index) => {
                        const count = parseInt(reason.total || '0')
                        const percentage = parseFloat(reason._calls) || 0
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium max-w-xs truncate">
                              {reason.disconnect_reason}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600">
                              {count}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={percentage >= 20 ? "destructive" : percentage >= 10 ? "secondary" : "outline"}
                                className="font-mono"
                              >
                                {percentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No disconnect reason data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>

          {/* Missed Calls by Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Missed Calls by Queue</CardTitle>
                  <CardDescription>
                    Queue-level missed call breakdown - Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}
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
              ) : missedCallsData.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Queue Name</TableHead>
                        <TableHead className="text-right">Channel</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Answered</TableHead>
                        <TableHead className="text-right">Abandoned</TableHead>
                        <TableHead className="text-right">Avg Wait</TableHead>
                        <TableHead className="text-right">SLA</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {missedCallsData.map((queue, index) => {
                        const abandonRate = parseInt(queue.received) > 0 
                          ? ((parseInt(queue.abandoned) / parseInt(queue.received)) * 100).toFixed(1)
                          : '0'
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{queue.queue_name}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={queue.channel === 'VOICE' ? "default" : "secondary"}
                                className="font-mono"
                              >
                                {queue.channel || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{queue.received}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{queue.answered}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{queue.abandoned}</TableCell>
                            <TableCell className="text-right font-mono">{queue.avg_wait || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={parseFloat(queue.sla) >= 90 ? "default" : parseFloat(queue.sla) >= 70 ? "secondary" : "destructive"}
                                className="font-mono"
                              >
                                {queue.sla || 'N/A'}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={parseFloat(queue.sla) >= 90 ? "default" : parseFloat(queue.sla) >= 70 ? "secondary" : "destructive"}
                                className="font-mono"
                              >
                                {parseFloat(queue.sla) >= 90 ? 'Good' : parseFloat(queue.sla) >= 70 ? 'Fair' : 'Poor'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No missed calls data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
