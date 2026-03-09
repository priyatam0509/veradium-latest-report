"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, User, Calendar, RefreshCw, Activity } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface TransferData {
  agent_id: string
  agent_name: string
  type: string
  destination: string
  total: string
}

export default function TransferAnalysis() {
  const [transferData, setTransferData] = useState<TransferData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const [appliedRegion, setAppliedRegion] = useState<string[] | null>(null)
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      loadTransferData()
    }
  }, [authLoading, user?.email, dateRange])

  const loadTransferData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getAnsweredTransfers(
        dateRange.start,
        dateRange.end,
        null,
        user?.email
      )
      
      if (result.status === 'SUCCEEDED') {
        setTransferData(result.data)
        setAppliedRegion(result.appliedRegion || null)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Transfer data error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load transfer data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadTransferData().finally(() => setIsRefreshing(false))
  }

  const totalTransfers = transferData.reduce((sum, t) => sum + parseInt(t.total || '0'), 0)
  const uniqueAgents = new Set(transferData.map(t => t.agent_name)).size
  const topDestination = transferData.length > 0 
    ? transferData.reduce((max, t) => parseInt(t.total) > parseInt(max.total) ? t : max)
    : null

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Transfer Analysis</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
                {appliedRegion && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Region: {appliedRegion.join(', ')}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Call transfer patterns and analysis {appliedRegion ? `(${appliedRegion.join(', ')} region)` : '(all regions)'}
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
            <h2 className="text-xl font-semibold mb-4">Transfer Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalTransfers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                  <User className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : uniqueAgents}
                  </div>
                  <p className="text-xs text-muted-foreground">Agents who transferred</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Destination</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600 truncate">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : topDestination ? (
                      topDestination.destination
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {topDestination ? `${topDestination.total} transfers` : 'No data'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transfer Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      `${(totalTransfers / 30).toFixed(1)}/day`
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Daily average</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transfer Details Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transfer Details</CardTitle>
                  <CardDescription>
                    Agent transfer patterns by destination - Last {dateRange === DateHelper.getToday() ? '24 hours' : '30 days'}
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
              ) : transferData.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent Name</TableHead>
                        <TableHead className="text-right">Transfer Type</TableHead>
                        <TableHead className="text-right">Destination</TableHead>
                        <TableHead className="text-right">Total Transfers</TableHead>
                        <TableHead className="text-right">Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferData.map((transfer, index) => {
                        const percentage = totalTransfers > 0 
                          ? ((parseInt(transfer.total) / totalTransfers) * 100).toFixed(1)
                          : '0'
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{transfer.agent_name}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={transfer.type === 'WARM' ? "default" : "secondary"}
                                className="font-mono"
                              >
                                {transfer.type || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{transfer.destination || 'N/A'}</TableCell>
                            <TableCell className="text-right font-mono">{transfer.total}</TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant={parseInt(transfer.total) > 5 ? "default" : parseInt(transfer.total) > 0 ? "secondary" : "outline"}
                                className="font-mono"
                              >
                                {parseInt(transfer.total) > 10 ? 'High' : parseInt(transfer.total) > 0 ? 'Normal' : 'Low'}
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
                  No transfer data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
