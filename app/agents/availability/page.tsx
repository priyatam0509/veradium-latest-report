"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, RefreshCw, Users, Phone, Clock } from "lucide-react"
import { format } from "date-fns"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { useGlobalFilters } from "@/lib/global-filters-context"

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
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null)
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
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const result = await athenaAPI.getAgentAvailability(
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
      console.error("Failed to load agent availability:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData().finally(() => setIsRefreshing(false))
  }

  const handleViewDrilldown = async (agent: AgentAvailData) => {
    setLoadingAgentId(agent.agent_id)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const result = await athenaAPI.getAgentDrilldown(start, end, agent.agent_id)
      if (result.status === 'SUCCEEDED') {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(generateDrilldownHTML(result.data, agent.agent))
          newWindow.document.close()
        }
      }
    } catch (error) {
      console.error("Failed to load agent drilldown:", error)
    } finally {
      setLoadingAgentId(null)
    }
  }

  const generateDrilldownHTML = (data: any[], agentName: string) => {
    const dateText = startDate && endDate
      ? `${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}`
      : ''
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agent State Log - ${agentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f9fafb; color: #1f2937; }
    .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
    h1 { font-size: 22px; font-weight: 600; color: #111827; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .actions { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .count { font-size: 14px; color: #6b7280; }
    .btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #2563eb; }
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    tr:hover { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-login { background: #dcfce7; color: #166534; }
    .badge-logout { background: #fee2e2; color: #991b1b; }
    .badge-state { background: #dbeafe; color: #1e40af; }
    .badge-default { background: #f3f4f6; color: #374151; }
    .empty { padding: 48px; text-align: center; color: #9ca3af; }
    @media print { .btn { display: none; } body { background: white; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agent State Log — ${agentName}</h1>
      <p class="subtitle">Login, logout, and state change events${dateText ? ' · ' + dateText : ''}</p>
    </div>
    <div class="actions">
      <span class="count">Showing ${data.length} event${data.length !== 1 ? 's' : ''}</span>
      <button class="btn" onclick="exportCSV()">Export CSV</button>
    </div>
    <div class="table-container">
      <table id="t">
        <thead><tr>
          <th>Status Timestamp</th>
          <th>Event Type</th>
          <th>Status</th>
          <th>Current State</th>
          <th>Current State Time</th>
          <th>Previous State</th>
          <th>Previous State Time</th>
          <th>Queues</th>
          <th>Contact ID</th>
        </tr></thead>
        <tbody>
          ${data.length > 0 ? data.map(r => {
            const badgeClass = r.event_type === 'LOGIN' ? 'badge-login' : r.event_type === 'LOGOUT' ? 'badge-logout' : r.event_type === 'STATE_CHANGE' ? 'badge-state' : 'badge-default'
            return `<tr>
              <td>${r.status_timestamp || '—'}</td>
              <td><span class="badge ${badgeClass}">${r.event_type || '—'}</span></td>
              <td>${r.status_name || '—'}</td>
              <td>${r.current_state || '—'}</td>
              <td>${r.current_state_timestamp || '—'}</td>
              <td>${r.previous_state || '—'}</td>
              <td>${r.previous_state_timestamp || '—'}</td>
              <td>${r.queues || '—'}</td>
              <td style="font-family:monospace;font-size:11px">${r.contact_id || '—'}</td>
            </tr>`
          }).join('') : '<tr><td colspan="9" class="empty">No events found.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>
  <script>
    function exportCSV() {
      const rows = Array.from(document.querySelectorAll('#t tr'))
      const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => '"' + c.textContent.trim().replace(/"/g,'""') + '"').join(',')).join('\\n')
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], {type:'text/csv'})), download: 'agent-state-log.csv' })
      a.click()
    }
  </script>
</body></html>`
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
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDrilldown(agent)}
                              disabled={loadingAgentId === agent.agent_id}
                            >
                              {loadingAgentId === agent.agent_id ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                              ) : 'View Details'}
                            </Button>
                          </TableCell>
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
