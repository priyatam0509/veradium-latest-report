"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, RefreshCw, Users, Phone, Clock, Calendar } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface AgentAvailData {
  agent_id: string
  agent: string
  agent_region: string
  answered: string
  failed: string
  online_time: string
  pause_time: string
  pauses: string
  talk_time: string
  wrap_up_time: string
  hold_time: string
  idle_time: string
  aht: string
  '%_pauses': string
  missed_rejected: string
}

export default function AgentAvailabilityPage() {
  const [agentData, setAgentData] = useState<AgentAvailData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 1))
  const [endDate, setEndDate] = useState<Date | undefined>(subDays(new Date(), 1))
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, user?.email])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentAvailability(
        DateHelper.formatDateFromDate(startDate),
        DateHelper.formatDateFromDate(endDate, true),
        user?.email
      )
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Failed to load agent availability:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const totalAgents = agentData.length
  const totalAnswered = agentData.reduce((sum, a) => sum + parseInt(a.answered || '0'), 0)
  const totalFailed = agentData.reduce((sum, a) => sum + parseInt(a.failed || '0'), 0)
  const totalPauses = agentData.reduce((sum, a) => sum + parseInt(a.pauses || '0'), 0)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Availability</h1>
              <p className="text-muted-foreground mt-1">Agent online time, pause time, talk time, and call metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <Card className="w-auto">
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

          {/* Date Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setIsStartDateOpen(false) }} autoFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setIsEndDateOpen(false) }} autoFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button onClick={loadData} disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</> : <>Apply Filter</>}
                </Button>
                <Button variant="outline" onClick={() => { setStartDate(subDays(new Date(), 1)); setEndDate(subDays(new Date(), 1)) }}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
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
                <CardTitle className="text-sm font-medium">Calls Answered</CardTitle>
                <Phone className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAnswered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total answered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
                <Phone className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalFailed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total failed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pauses</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalPauses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Combined pauses</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agent Availability Details</CardTitle>
                  <CardDescription>Online time, pause time, talk time, and wrap-up per agent</CardDescription>
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
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead className="text-right">Answered</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Missed/Rejected</TableHead>
                        <TableHead className="text-right">Online Time</TableHead>
                        <TableHead className="text-right">Pause Time</TableHead>
                        <TableHead className="text-right">% Pauses</TableHead>
                        <TableHead className="text-right">Pauses</TableHead>
                        <TableHead className="text-right">Talk Time</TableHead>
                        <TableHead className="text-right">Hold Time</TableHead>
                        <TableHead className="text-right">Wrap-up Time</TableHead>
                        <TableHead className="text-right">Idle Time</TableHead>
                        <TableHead className="text-right">AHT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{agent.agent}</TableCell>
                          <TableCell>{agent.agent_region || '—'}</TableCell>
                          <TableCell className="text-right text-green-600 font-mono">{agent.answered || '0'}</TableCell>
                          <TableCell className="text-right text-red-600 font-mono">{agent.failed || '0'}</TableCell>
                          <TableCell className="text-right text-orange-600 font-mono">{agent.missed_rejected || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.online_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pause_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent['%_pauses'] || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pauses || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.talk_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.hold_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.wrap_up_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.idle_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.aht || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No agent availability data for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
