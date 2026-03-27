"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Clock, RefreshCw, Activity, Pause, Coffee, User } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { useGlobalFilters } from "@/lib/global-filters-context"

interface AgentPauseDetail {
  user_id: string
  agent_name: string
  agent_region: string
  max_interval_start_time: string
  max_interval_end_time: string
  on_custom_status: string
  number_of_holds: string
}

export default function AgentActivityAnalysis() {
  const [agentData, setAgentData] = useState<AgentPauseDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user, isLoading: authLoading } = useAuth()

  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedAgents: selectedAgents,
    appliedRegions: selectedRegions,
    applyVersion,
  } = useGlobalFilters()

  // Refs to avoid stale closures
  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const agentsRef = useRef(selectedAgents)
  const regionsRef = useRef(selectedRegions)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { agentsRef.current = selectedAgents }, [selectedAgents])
  useEffect(() => { regionsRef.current = selectedRegions }, [selectedRegions])

  useEffect(() => {
    if (!authLoading) {
      loadAgentActivityData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) {
      // Sync refs immediately so loadAgentActivityData reads the new applied values
      startRef.current = startDate
      endRef.current = endDate
      agentsRef.current = selectedAgents
      regionsRef.current = selectedRegions
      loadAgentActivityData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  const loadAgentActivityData = async () => {
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const regionFilter = regionsRef.current.length > 0 ? regionsRef.current : undefined
      const result = await athenaAPI.getAgentPauseDetail(
        start,
        end,
        user?.email,
        agentFilter,
        regionFilter,
      )
      
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Agent activity data error:", error)
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
  const totalCustomStatus = agentData.reduce((sum, a) => sum + parseInt(a.on_custom_status || '0'), 0)
  const avgHoldsPerAgent = totalAgents > 0 ? (totalHolds / totalAgents).toFixed(1) : '0'
  const mostActiveAgent = agentData.length > 0
    ? agentData.reduce((max, a) => parseInt(a.number_of_holds || '0') > parseInt(max.number_of_holds || '0') ? a : max)
    : null

  const formatTimestamp = (ts: string) => {
    if (!ts) return '—'
    // "2026-03-05 20:33:57.660000 UTC" → "Mar 5, 2026 20:33"
    const clean = ts.replace(' UTC', '')
    const d = new Date(clean)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
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
              </div>
              <p className="text-muted-foreground mt-1">
                Agent pause patterns, break times, and productivity metrics
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
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
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCustomStatus.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total custom status events</p>
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
                    Individual agent pause patterns and productivity
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
                        <TableHead>Agent Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Interval Start</TableHead>
                        <TableHead>Interval End</TableHead>
                        <TableHead className="text-right">Custom Status Events</TableHead>
                        <TableHead className="text-right">Number of Holds</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{agent.agent_name}</TableCell>
                          <TableCell>{agent.agent_region || '—'}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(agent.max_interval_start_time)}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(agent.max_interval_end_time)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {agent.on_custom_status || '0'}
                          </TableCell>
                          <TableCell className="text-right font-mono">{agent.number_of_holds || '0'}</TableCell>
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
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : agentData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No data available to generate insights</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Coffee className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="font-medium">Hold Patterns</p>
                      <p className="text-sm text-muted-foreground">
                        Avg <span className="font-semibold text-foreground">{avgHoldsPerAgent}</span> holds/agent
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {totalHolds.toLocaleString()} total holds across {totalAgents} agents
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Most Active Agent</p>
                      <p className="text-sm font-semibold text-foreground">
                        {mostActiveAgent ? mostActiveAgent.agent_name : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mostActiveAgent ? `${parseInt(mostActiveAgent.number_of_holds).toLocaleString()} holds` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Custom Status Events</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{totalCustomStatus.toLocaleString()}</span> total events
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {totalAgents > 0
                          ? `Avg ${(totalCustomStatus / totalAgents).toFixed(1)} per agent`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
