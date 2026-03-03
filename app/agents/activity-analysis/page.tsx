"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Clock, User, Calendar, RefreshCw, Activity, Pause, Play, Coffee, AlertTriangle } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface AgentPauseDetail {
  user_id: string
  name: string
  on_custom_status: string
  number_of_holds: string
}

export default function AgentActivityAnalysis() {
  const [agentData, setAgentData] = useState<AgentPauseDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadAgentActivityData()
  }, [dateRange])

  const loadAgentActivityData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentPauseDetail(
        dateRange.start,
        dateRange.end
      )
      
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Agent activity data error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load agent activity data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadAgentActivityData().finally(() => setIsRefreshing(false))
  }

  const totalAgents = agentData.length
  const totalHolds = agentData.reduce((sum, a) => sum + parseInt(a.number_of_holds || '0'), 0)
  const customStatusAgents = agentData.filter(a => a.on_custom_status === 'true').length
  const avgHoldsPerAgent = totalAgents > 0 ? (totalHolds / totalAgents).toFixed(1) : '0'
  const mostActiveAgent = agentData.length > 0 
    ? agentData.reduce((max, a) => parseInt(a.number_of_holds) > parseInt(max.number_of_holds) ? a : max)
    : null

  const formatTime = (minutes: string) => {
    const mins = parseFloat(minutes)
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = Math.round(mins % 60)
      return `${hours}h ${remainingMins}m`
    }
    return `${Math.round(mins)}m`
  }

  const getProductivityColor = (score: string) => {
    const s = parseFloat(score)
    if (s >= 90) return 'text-green-600'
    if (s >= 75) return 'text-blue-600'
    if (s >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getProductivityVariant = (score: string) => {
    const s = parseFloat(score)
    if (s >= 90) return 'default'
    if (s >= 75) return 'secondary'
    if (s >= 60) return 'outline'
    return 'destructive'
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Agent Activity Analysis</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
                <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Region Filter: Not Available
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Agent pause patterns, break times, and productivity metrics
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
            <h2 className="text-xl font-semibold mb-4">Activity Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                  <User className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAgents}
                  </div>
                  <p className="text-xs text-muted-foreground">Tracked agents</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Holds</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalHolds.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Combined holds</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Custom Status</CardTitle>
                  <Pause className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : customStatusAgents}
                  </div>
                  <p className="text-xs text-muted-foreground">Agents on custom status</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Holds/Agent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : avgHoldsPerAgent}
                  </div>
                  <p className="text-xs text-muted-foreground">Team average</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Agent Activity Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Activity Details</CardTitle>
                  <CardDescription>
                    Individual agent pause patterns and productivity - Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}
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
              ) : agentData.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Agent Name</TableHead>
                        <TableHead className="text-right">on custom status</TableHead>
                        <TableHead className="text-right">Number of Holds</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{agent.user_id}</TableCell>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell className="text-right font-mono">
                              {agent.on_custom_status}
                            </TableCell>
                          <TableCell className="text-right font-mono">{agent.number_of_holds}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No agent activity data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activity Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Insights</CardTitle>
              <CardDescription>
                Key patterns and recommendations based on agent activity data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Coffee className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-medium">Hold Patterns</p>
                    <p className="text-sm text-muted-foreground">
                      {totalHolds > 0 ? `${avgHoldsPerAgent} holds per agent` : 'No data'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="font-medium">Most Active Agent</p>
                    <p className="text-sm text-muted-foreground">
                      {mostActiveAgent ? mostActiveAgent.name : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">Team Status</p>
                    <p className="text-sm text-muted-foreground">
                      {customStatusAgents > 0 ? `${customStatusAgents} on custom status` : 'All standard status'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
