"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, User, RefreshCw, CheckCircle, Search } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useGlobalFilters } from "@/lib/global-filters-context"

interface AgentCallDisposition {
  user_id: string
  agent_name: string
  username: string
  region: string
  received: string
  completed_by_caller: string
  completed_by_agent: string
  transferred_out: string
  failed: string
  missed_rejected: string
}

export default function AgentPerformanceAnalysis() {
  const [agentData, setAgentData] = useState<AgentCallDisposition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const { user, isLoading: authLoading } = useAuth()

  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedAgents: selectedAgents,
    appliedQueues: selectedQueues,
    applyVersion,
  } = useGlobalFilters()

  // Refs to avoid stale closures
  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const agentsRef = useRef(selectedAgents)
  const queuesRef = useRef(selectedQueues)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { agentsRef.current = selectedAgents }, [selectedAgents])
  useEffect(() => { queuesRef.current = selectedQueues }, [selectedQueues])

  useEffect(() => {
    if (!authLoading) {
      loadAgentPerformanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) {
      loadAgentPerformanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  const loadAgentPerformanceData = async () => {
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const result = await athenaAPI.getAgentCallDisposition(
        start,
        end,
        user?.email,
        agentFilter,
        queueFilter,
      )

      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Agent performance data error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadAgentPerformanceData().finally(() => setIsRefreshing(false))
  }

  // Filtered by local search term only (global agent filter already applied at API level)
  const displayedAgents = useMemo(() => {
    if (!searchTerm) return agentData
    return agentData.filter((a) => a.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [agentData, searchTerm])

  const totalAgents = displayedAgents.length
  const totalReceived = displayedAgents.reduce((sum, a) => sum + parseInt(a.received || '0'), 0)
  const totalCompleted = displayedAgents.reduce((sum, a) => sum + parseInt(a.completed_by_agent || '0'), 0)
  const totalTransferred = displayedAgents.reduce((sum, a) => sum + parseInt(a.transferred_out || '0'), 0)
  const totalFailed = displayedAgents.reduce((sum, a) => sum + parseInt(a.failed || '0'), 0)
  const avgCompletionRate = totalReceived > 0 ? ((totalCompleted / totalReceived) * 100).toFixed(1) : '0'
  const topAgent = displayedAgents.length > 0
    ? displayedAgents.reduce((max, a) => parseInt(a.completed_by_agent || '0') > parseInt(max.completed_by_agent || '0') ? a : max)
    : null

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Performance</h1>
            <p className="text-muted-foreground mt-1">Agent call disposition and performance metrics</p>
          </div>

          {/* KPI Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
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
                  <p className="text-xs text-muted-foreground">Active agents</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
                  <Phone className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalCompleted.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Selected period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${avgCompletionRate}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">Overall performance</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Agent</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600 truncate">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : topAgent ? (
                      topAgent.agent_name.length > 15 
                        ? topAgent.agent_name.substring(0, 15) + '...'
                        : topAgent.agent_name
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {topAgent ? `${topAgent.completed_by_agent} completed` : 'No data'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Agent Performance Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Performance Details</CardTitle>
                  <CardDescription>
                    Individual agent call disposition metrics
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search agents..." className="pl-8 w-[180px] text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : displayedAgents.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead className="text-right">Username</TableHead>
                        <TableHead className="text-right">Region</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Caller Completed</TableHead>
                        <TableHead className="text-right">Transferred</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Missed/Rejected</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedAgents.map((agent, index) => {
                        const completed = parseInt(agent.completed_by_agent || '0')
                        const failed = parseInt(agent.failed || '0')
                        const completionRate = (completed + failed) > 0 
                          ? ((completed / (completed + failed)) * 100).toFixed(1)
                          : '0'
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{agent.agent_name}</TableCell>
                            <TableCell className="text-right font-mono text-gray-600">{agent.username}</TableCell>
                            <TableCell className="text-right">{agent.region || '—'}</TableCell>
                            <TableCell className="text-right font-mono">{agent.received}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{agent.completed_by_agent}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{agent.completed_by_caller}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{agent.transferred_out}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{agent.failed}</TableCell>
                            <TableCell className="text-right font-mono text-orange-600">{agent.missed_rejected}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={parseFloat(completionRate) >= 90 ? "default" : parseFloat(completionRate) >= 70 ? "secondary" : "destructive"}
                                className="font-mono"
                              >
                                {completionRate}%
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
                  No agent performance data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
