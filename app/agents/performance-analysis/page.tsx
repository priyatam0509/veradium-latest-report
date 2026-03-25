"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, User, RefreshCw, CheckCircle, Calendar, Search } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"

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
  const { user, isLoading: authLoading } = useAuth()

  // Task 27: start/end date pickers
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartOpen, setIsStartOpen] = useState(false)
  const [isEndOpen, setIsEndOpen] = useState(false)

  // Task 26: agent multi-select filter
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [agentFilterOpen, setAgentFilterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!authLoading) {
      loadAgentPerformanceData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  const loadAgentPerformanceData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentCallDisposition(
        DateHelper.formatDateFromDate(startDate),
        DateHelper.formatDateFromDate(endDate, true),
        user?.email
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

  const handleApplyFilter = () => {
    setSelectedAgents([])
    loadAgentPerformanceData()
  }

  const handleResetFilter = () => {
    setStartDate(subDays(new Date(), 30))
    setEndDate(new Date())
    setSelectedAgents([])
    setSearchTerm("")
    setTimeout(() => loadAgentPerformanceData(), 0)
  }

  // All agent names for multi-select
  const allAgentNames = useMemo(
    () => Array.from(new Set(agentData.map((a) => a.agent_name))).sort(),
    [agentData]
  )

  // Filtered by agent selection + search
  const displayedAgents = useMemo(() => {
    let rows = agentData
    if (selectedAgents.length > 0) rows = rows.filter((a) => selectedAgents.includes(a.agent_name))
    if (searchTerm) rows = rows.filter((a) => a.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    return rows
  }, [agentData, selectedAgents, searchTerm])

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

          {/* Controls — Tasks 26, 27 */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-3 items-end">
                {/* Start Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                  <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal text-sm", !startDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setIsStartOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">End Date</label>
                  <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal text-sm", !endDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setIsEndOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Agent Multi-Select — Task 26 */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Agent Filter</label>
                  <Popover open={agentFilterOpen} onOpenChange={setAgentFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[200px] justify-start text-left font-normal text-sm">
                        {selectedAgents.length === 0 ? "All Agents"
                          : selectedAgents.length === 1 ? selectedAgents[0]
                          : `${selectedAgents.length} agents selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-2" align="start">
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent text-sm" onClick={() => setSelectedAgents([])}>
                          <Checkbox checked={selectedAgents.length === 0} />
                          <span>All Agents</span>
                        </div>
                        {allAgentNames.map((name) => (
                          <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-accent text-sm"
                            onClick={() => setSelectedAgents((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name])}>
                            <Checkbox checked={selectedAgents.includes(name)} />
                            <span className="truncate">{name}</span>
                          </div>
                        ))}
                        {allAgentNames.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">Load data first</p>}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search agents..." className="pl-8 w-[180px] text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground invisible">Actions</label>
                  <div className="flex gap-2">
                    <Button onClick={handleApplyFilter} disabled={isLoading} size="sm">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                      Apply
                    </Button>
                    <Button variant="outline" onClick={handleResetFilter} size="sm">Reset</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
