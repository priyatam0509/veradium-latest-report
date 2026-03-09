"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Activity, UserCheck, Users, Phone, Clock } from "lucide-react"
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
}

export default function AgentAvailabilityPage() {
  const [agentData, setAgentData] = useState<AgentAvailData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [authLoading, user?.email, dateRange])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentAvailability(
        dateRange.start,
        dateRange.end,
        user?.email
      )
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      setLastRefresh(new Date())
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load agent availability",
        description: error instanceof Error ? error.message : "Unknown error",
      })
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Agent Availability</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Agent online time, pause time, talk time, and call metrics
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
                        <TableHead className="text-right">Online Time</TableHead>
                        <TableHead className="text-right">Pause Time</TableHead>
                        <TableHead className="text-right">Pauses</TableHead>
                        <TableHead className="text-right">Talk Time</TableHead>
                        <TableHead className="text-right">Wrap-up Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{agent.agent}</TableCell>
                          <TableCell>{agent.agent_region || '—'}</TableCell>
                          <TableCell className="text-right text-green-600 font-mono">{agent.answered || '0'}</TableCell>
                          <TableCell className="text-right text-red-600 font-mono">{agent.failed || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.online_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pause_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pauses || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.talk_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.wrap_up_time || '—'}</TableCell>
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
