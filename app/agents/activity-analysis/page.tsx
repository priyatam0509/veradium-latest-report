"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Clock, RefreshCw, Activity, Pause, Coffee, User, Search, Download } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { useSortable, SortHead } from "@/lib/sort-table"
import { exportToCSV } from "@/lib/export-csv"

interface AgentPauseDetail {
  user_id: string
  agent_name: string
  region: string
  pause_start: string
  pause_end: string
  pause_duration: string
  pause_duration_sec: string
  pause_status: string
}

export default function AgentActivityAnalysis() {
  const [agentData, setAgentData] = useState<AgentPauseDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [localSearch, setLocalSearch] = useState("")
  const { user, isLoading: authLoading } = useAuth()

  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedAgents: selectedAgents,
    applyVersion,
  } = useGlobalFilters()

  // Refs to avoid stale closures
  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const agentsRef = useRef(selectedAgents)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { agentsRef.current = selectedAgents }, [selectedAgents])

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
      const result = await athenaAPI.getAgentPauseDetail(
        start,
        end,
        user?.email,
        agentFilter,
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

  const formatDuration = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }

  const uniqueAgents = new Set(agentData.map((a) => a.user_id || a.agent_name)).size
  const totalAgents = uniqueAgents
  const totalPauses = agentData.length
  const totalPauseSec = agentData.reduce((sum, a) => sum + parseInt(a.pause_duration_sec || '0'), 0)
  const avgPausesPerAgent = uniqueAgents > 0 ? (totalPauses / uniqueAgents).toFixed(1) : '0'

  const pauseCountByAgent = agentData.reduce<Record<string, { name: string; count: number }>>((acc, a) => {
    const key = a.user_id || a.agent_name
    if (!acc[key]) acc[key] = { name: a.agent_name, count: 0 }
    acc[key].count++
    return acc
  }, {})
  const mostActiveAgent = Object.values(pauseCountByAgent).sort((x, y) => y.count - x.count)[0] || null

  const formatTimestamp = (ts: string) => {
    if (!ts) return '—'
    // e.g. "2026-06-19 08:52:39.732 EST5EDT" or "2026-03-05 20:33:57.660000 UTC"
    const m = ts.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (!m) return ts
    const [, y, mo, d, hh, mm, ss] = m
    const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mm), Number(ss || '0'))
    if (isNaN(date.getTime())) return ts
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  const filteredAgentData = useMemo(() => {
    const search = localSearch.trim().toLowerCase()
    if (!search) return agentData
    return agentData.filter((agent) => {
      const values = [
        agent.agent_name,
        agent.region,
        agent.pause_status,
        agent.pause_start,
        agent.pause_end,
      ]
      return values.some((v) => (v || '').toString().toLowerCase().includes(search))
    })
  }, [agentData, localSearch])

  const sort = useSortable(filteredAgentData)

  const handleExport = () => {
    const headers = ['Agent Name', 'Region', 'Pause Start', 'Pause End', 'Duration', 'Status']
    const rows = sort.sorted.map((agent) => [
      agent.agent_name,
      agent.region || '',
      formatTimestamp(agent.pause_start),
      formatTimestamp(agent.pause_end),
      agent.pause_duration || '',
      agent.pause_status || '',
    ])
    exportToCSV('agent-activity', headers, rows)
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
                  <p className="text-xs text-muted-foreground">Agents with pauses</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pauses</CardTitle>
                  <Pause className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalPauses.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Pause events</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pause Time</CardTitle>
                  <Clock className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatDuration(totalPauseSec)}
                  </div>
                  <p className="text-xs text-muted-foreground">Combined duration</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Pauses/Agent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : avgPausesPerAgent}
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
                <div className="flex items-center gap-2">
                  {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || sort.sorted.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by agent name, region..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredAgentData.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="agent_name" label="Agent Name" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="pause_start" label="Pause Start" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="pause_end" label="Pause End" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="pause_duration_sec" label="Duration" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="pause_status" label="Status" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{agent.agent_name}</TableCell>
                          <TableCell>{agent.region || '—'}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(agent.pause_start)}</TableCell>
                          <TableCell className="text-sm">{formatTimestamp(agent.pause_end)}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pause_duration || '—'}</TableCell>
                          <TableCell>
                            {agent.pause_status ? <Badge variant="outline">{agent.pause_status}</Badge> : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {localSearch
                    ? `No results found for "${localSearch}"`
                    : 'No agent activity data available for the selected period'}
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
                      <p className="font-medium">Pause Patterns</p>
                      <p className="text-sm text-muted-foreground">
                        Avg <span className="font-semibold text-foreground">{avgPausesPerAgent}</span> pauses/agent
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {totalPauses.toLocaleString()} total pauses across {totalAgents} agents
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Most Active Agent</p>
                      <p className="text-sm font-semibold text-foreground">
                        {mostActiveAgent ? mostActiveAgent.name : 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mostActiveAgent ? `${mostActiveAgent.count.toLocaleString()} pauses` : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Total Pause Time</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{formatDuration(totalPauseSec)}</span> combined
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {totalAgents > 0
                          ? `Avg ${formatDuration(Math.round(totalPauseSec / totalAgents))} per agent`
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
