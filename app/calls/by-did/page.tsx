"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Activity, PhoneOff, Hash, PhoneMissed } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"

interface UnansweredByDIDRow {
  did: string
  channel: string
  initiation_method: string
  region: string
  received: string
  unanswered: string
  abandoned: string
  '%_calls': string
}

export default function UnansweredByDIDPage() {
  const [data, setData] = useState<UnansweredByDIDRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState(DateHelper.getLastNDays(30))
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) loadData()
  }, [authLoading, user?.email, dateRange])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const result = await athenaAPI.getUnansweredByDID(
        dateRange.start,
        dateRange.end,
        null,
        user?.email
      )
      if (result.status === 'SUCCEEDED') {
        setData(result.data)
      }
      setLastRefresh(new Date())
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load unanswered by DID",
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

  const totalDIDs = data.length
  const totalReceived = data.reduce((sum, r) => sum + parseInt(r.received || '0'), 0)
  const totalUnanswered = data.reduce((sum, r) => sum + parseInt(r.unanswered || '0'), 0)
  const totalAbandoned = data.reduce((sum, r) => sum + parseInt(r.abandoned || '0'), 0)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Unanswered by DID</h1>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                Unanswered and abandoned call metrics per inbound phone number (DID)
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
                <CardTitle className="text-sm font-medium">Active DIDs</CardTitle>
                <Hash className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalDIDs}
                </div>
                <p className="text-xs text-muted-foreground">Inbound numbers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <PhoneMissed className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalReceived.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Calls received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unanswered</CardTitle>
                <PhoneOff className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalUnanswered.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Not answered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Abandoned</CardTitle>
                <PhoneOff className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAbandoned.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Caller hung up</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>DID Breakdown</CardTitle>
                  <CardDescription>Unanswered call metrics per inbound phone number</CardDescription>
                </div>
                {isRefreshing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : data.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DID</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Initiation</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Unanswered</TableHead>
                        <TableHead className="text-right">Abandoned</TableHead>
                        <TableHead className="text-right">% of Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{row.did}</TableCell>
                          <TableCell>{row.region || '—'}</TableCell>
                          <TableCell>{row.channel || '—'}</TableCell>
                          <TableCell>{row.initiation_method || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{row.received || '0'}</TableCell>
                          <TableCell className="text-right text-red-600 font-mono">{row.unanswered || '0'}</TableCell>
                          <TableCell className="text-right text-orange-600 font-mono">{row.abandoned || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{row['%_calls'] || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
