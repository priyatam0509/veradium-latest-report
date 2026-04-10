"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Loader2, TrendingUp, Phone, User, RefreshCw } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { useSortable, SortHead } from "@/lib/sort-table"

interface TransferData {
  agent_id: string
  agent_name: string
  region: string
  type: string
  destination: string
  total: string
}

export default function TransferAnalysis() {
  const [transferData, setTransferData] = useState<TransferData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user, isLoading: authLoading } = useAuth()

  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedQueues: selectedQueues,
    appliedAgents: selectedAgents,
    appliedDids: selectedDids,
    applyVersion,
  } = useGlobalFilters()

  // Refs to avoid stale closures
  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const queuesRef = useRef(selectedQueues)
  const agentsRef = useRef(selectedAgents)
  const didsRef = useRef(selectedDids)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { queuesRef.current = selectedQueues }, [selectedQueues])
  useEffect(() => { agentsRef.current = selectedAgents }, [selectedAgents])
  useEffect(() => { didsRef.current = selectedDids }, [selectedDids])

  useEffect(() => {
    if (!authLoading) {
      loadTransferData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) {
      // Sync refs immediately so loadTransferData reads the new applied values
      startRef.current = startDate
      endRef.current = endDate
      queuesRef.current = selectedQueues
      agentsRef.current = selectedAgents
      didsRef.current = selectedDids
      loadTransferData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  const loadTransferData = async () => {
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const didFilter = didsRef.current.length > 0 ? didsRef.current : undefined
      const result = await athenaAPI.getAnsweredTransfers(
        start,
        end,
        undefined,
        user?.email,
        agentFilter,
        queueFilter,
        didFilter,
      )
      
      if (result.status === 'SUCCEEDED') {
        setTransferData(result.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Transfer data error:", error)
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

  const sort = useSortable(transferData)
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
              <h1 className="text-3xl font-bold tracking-tight">Transfer Analysis</h1>
              <p className="text-muted-foreground mt-1">
                Call transfer patterns and analysis
              </p>
            </div>
            
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
                    <p className="text-xs text-muted-foreground">Last updated</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPI Cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Transfer Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                  <Phone className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalTransfers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Selected period</p>
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
            </div>
          </div>

          {/* Transfer Details Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transfer Details</CardTitle>
                  <CardDescription>
                    Agent transfer patterns by destination
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
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="agent_name" label="Agent Name" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="type" label="Transfer Type" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="destination" label="Destination" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="total" label="Total Transfers" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="total" label="Volume" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((transfer, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{transfer.agent_name}</TableCell>
                          <TableCell>{transfer.region || '—'}</TableCell>
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
                              variant={parseInt(transfer.total) > 10 ? "default" : parseInt(transfer.total) > 0 ? "secondary" : "outline"}
                              className="font-mono"
                            >
                              {parseInt(transfer.total) > 10 ? 'High' : parseInt(transfer.total) > 0 ? 'Normal' : 'Low'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
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
