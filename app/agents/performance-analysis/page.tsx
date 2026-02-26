"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, User, Calendar, RefreshCw, Activity, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface AgentCallDisposition {
  user_id: string
  agent_name: string
  username: string
  completed_by_caller: string
  completed_by_agent: string
  transferred_out: string
  failed: string
  missed_rejected: string
  failed_out: string
}

interface AgentPauseDetail {
  user_id: string
  name: string
  on_custom_status: string
  number_of_holds: string
}

export default function AgentPerformanceAnalysis() {
  const [agentData, setAgentData] = useState<AgentCallDisposition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadAgentPerformanceData()
  }, [dateRange])

  const loadAgentPerformanceData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAgentCallDisposition(
        dateRange.start,
        dateRange.end
      )
      
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Agent performance data error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load agent performance data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadAgentPerformanceData().finally(() => setIsRefreshing(false))
  }

  const totalAgents = agentData.length
  const totalCompleted = agentData.reduce((sum, a) => sum + parseInt(a.completed_by_agent || '0'), 0)
  const totalTransferred = agentData.reduce((sum, a) => sum + parseInt(a.transferred_out || '0'), 0)
  const totalFailed = agentData.reduce((sum, a) => sum + parseInt(a.failed || '0'), 0)
  const avgCompletionRate = totalCompleted > 0 ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(1) : '0'
  const topAgent = agentData.length > 0 
    ? agentData.reduce((max, a) => parseInt(a.completed_by_agent) > parseInt(max.completed_by_agent) ? a : max)
    : null

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Agent Performance Analysis</h1>
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
                Agent call disposition and performance metrics
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
                  <p className="text-xs text-muted-foreground">Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}</p>
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
                    Individual agent call disposition metrics - Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}
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
                        <TableHead className="text-right">Username</TableHead>
                        <TableHead className="text-right">Completed</TableHead>
                        <TableHead className="text-right">Caller Completed</TableHead>
                        <TableHead className="text-right">Transferred</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Failed Out</TableHead>
                        <TableHead className="text-right">Completion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent, index) => {
                        const completed = parseInt(agent.completed_by_agent || '0')
                        const failed = parseInt(agent.failed || '0')
                        const completionRate = (completed + failed) > 0 
                          ? ((completed / (completed + failed)) * 100).toFixed(1)
                          : '0'
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{agent.agent_name}</TableCell>
                            <TableCell className="text-right font-mono text-gray-600">{agent.username}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{agent.completed_by_agent}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{agent.completed_by_caller}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{agent.transferred_out}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{agent.failed}</TableCell>
                            <TableCell className="text-right font-mono text-orange-600">{agent.failed_out}</TableCell>
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
