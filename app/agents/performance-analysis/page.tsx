"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useSortable, SortHead } from "@/lib/sort-table"
import { exportToCSV } from "@/lib/export-csv"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Phone, User, CheckCircle, Search, Download } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useGlobalFilters } from "@/lib/global-filters-context"

interface AgentCallDisposition {
  user_id: string
  agent_name: string
  username: string
  region: string
  answered: string
  outbound: string
  completed_by_caller: string
  completed_by_agent: string
  transferred_out: string
  missed: string
  rejected: string
  failed: string
  completion_rate?: number
}

export default function AgentPerformanceAnalysis() {
  const [agentData, setAgentData] = useState<AgentCallDisposition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingDrilldownId, setLoadingDrilldownId] = useState<string | null>(null)
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
      // Sync refs immediately so loadAgentPerformanceData reads the new applied values
      startRef.current = startDate
      endRef.current = endDate
      agentsRef.current = selectedAgents
      queuesRef.current = selectedQueues
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

  const handleViewDrilldown = async (agent: AgentCallDisposition) => {
    setLoadingDrilldownId(agent.user_id)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const result = await athenaAPI.getAgentPerformanceDrilldown(start, end, agent.user_id, queueFilter, user?.email)
      if (result?.status === 'SUCCEEDED') {
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(generatePerformanceDrilldownHTML(result.data, agent.agent_name))
          newWindow.document.close()
        }
      }
    } catch (error) {
      console.error("Agent performance drilldown error:", error)
    } finally {
      setLoadingDrilldownId(null)
    }
  }

  const generatePerformanceDrilldownHTML = (data: any[], agentName: string) => {
    const dateText = startDate && endDate
      ? `${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}`
      : ''
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Agent Performance Details - ${agentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f9fafb; color: #1f2937; }
    .container { max-width: 1600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
    h1 { font-size: 22px; font-weight: 600; color: #111827; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .actions { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .count { font-size: 14px; color: #6b7280; }
    .btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #2563eb; }
    .table-container { overflow: auto; height: calc(100vh - 200px); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; white-space: nowrap; cursor: pointer; user-select: none; }
    th:hover { background: #f3f4f6; }
    th.sort-asc::after { content: ' ▲'; font-size: 9px; }
    th.sort-desc::after { content: ' ▼'; font-size: 9px; }
    td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    tr:hover { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-completed { background: #dcfce7; color: #166534; }
    .badge-transferred { background: #dbeafe; color: #1e40af; }
    .badge-failed { background: #fee2e2; color: #991b1b; }
    .badge-default { background: #f3f4f6; color: #374151; }
    .mono { font-family: monospace; font-size: 11px; }
    .empty { padding: 48px; text-align: center; color: #9ca3af; }
    .play-btn { color:#3b82f6; cursor:pointer; border:none; background:none; font-size:12px; font-family:inherit; padding:0; }
    .play-btn:hover { text-decoration:underline; }
    .play-btn:disabled { color:#9ca3af; cursor:wait; }
    @media print { .btn { display: none; } body { background: white; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agent Performance Details — ${agentName}</h1>
      <p class="subtitle">Call-level performance drilldown${dateText ? ' · ' + dateText : ''}</p>
    </div>
    <div class="actions">
      <span class="count">Showing ${data.length} record${data.length !== 1 ? 's' : ''}</span>
      <button class="btn" onclick="exportCSV()">Export CSV</button>
    </div>
    <div class="table-container">
      <table id="t">
        <thead style="position:sticky;top:0;z-index:1;"><tr>
          <th onclick="sortTable(0)">Contact ID</th>
          <th onclick="sortTable(1)">Disconnect Timestamp</th>
          <th onclick="sortTable(2)">Queue</th>
          <th onclick="sortTable(3)">Agent</th>
          <th onclick="sortTable(4)">Customer Number</th>
          <th onclick="sortTable(5)">Channel</th>
          <th onclick="sortTable(6)">Initiation Method</th>
          <th onclick="sortTable(7)">Status</th>
          <th onclick="sortTable(8)">Agent Attempts</th>
          <th onclick="sortTable(9)">Disconnect Reason</th>
          <th onclick="sortTable(10)">Ring Time</th>
          <th onclick="sortTable(11)">Wait Time</th>
          <th onclick="sortTable(12)">Talk Time</th>
          <th onclick="sortTable(13)">DID</th>
          <th onclick="sortTable(14)">Region</th>
          <th>Recording</th>
        </tr></thead>
        <tbody>
          ${data.length > 0 ? data.map(r => {
            const statusLower = (r.interaction_status || '').toLowerCase()
            const badgeClass = statusLower === 'completed' ? 'badge-completed' : statusLower === 'transferred' ? 'badge-transferred' : statusLower.includes('fail') ? 'badge-failed' : 'badge-default'
            let recordingCell = '—'
            if (r.recording) {
              try {
                const rec = JSON.parse(r.recording)
                if (rec.location) {
                  const slashIdx = rec.location.indexOf('/')
                  if (slashIdx > 0) {
                    const key = encodeURIComponent(rec.location.substring(slashIdx + 1))
                    recordingCell = '<button class="play-btn" data-key="' + key + '" onclick="playRec(this)">&#9654; Play</button>'
                  }
                }
              } catch(e) { recordingCell = r.recording }
            }
            return `<tr>
              <td class="mono">${r.contact_id || '—'}</td>
              <td>${r.disconnect_timestamp || '—'}</td>
              <td>${r.queue_name || '—'}</td>
              <td>${r.agent_name || '—'}</td>
              <td class="mono">${r.customer_number || '—'}</td>
              <td>${r.channel || '—'}</td>
              <td>${r.initiation_method || '—'}</td>
              <td><span class="badge ${badgeClass}">${r.interaction_status || '—'}</span></td>
              <td class="mono" style="text-align:center">${r.agent_connection_attempts || '—'}</td>
              <td>${r.disconnect_reason || '—'}</td>
              <td class="mono">${r.ring_time || '—'}</td>
              <td class="mono">${r.wait_time || '—'}</td>
              <td class="mono">${r.talk_time || '—'}</td>
              <td class="mono">${r.did || '—'}</td>
              <td>${r.region || '—'}</td>
              <td>${recordingCell}</td>
            </tr>`
          }).join('') : '<tr><td colspan="16" class="empty">No records found.</td></tr>'}
        </tbody>
      </table>
    </div>
  </div>
  <script>
    var _sortCol = -1, _sortAsc = true;
    function sortTable(col) {
      var tbody = document.querySelector('#t tbody');
      var rows = Array.from(tbody.querySelectorAll('tr:not(.audio-row)'));
      if (_sortCol === col) { _sortAsc = !_sortAsc; } else { _sortCol = col; _sortAsc = true; }
      rows.sort(function(a, b) {
        var av = a.cells[col] ? a.cells[col].textContent.trim() : '';
        var bv = b.cells[col] ? b.cells[col].textContent.trim() : '';
        var an = parseFloat(av), bn = parseFloat(bv);
        var cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : av.localeCompare(bv);
        return _sortAsc ? cmp : -cmp;
      });
      rows.forEach(function(r) { tbody.appendChild(r); });
      document.querySelectorAll('#t thead th').forEach(function(th, i) {
        th.classList.remove('sort-asc','sort-desc');
        if (i === col) th.classList.add(_sortAsc ? 'sort-asc' : 'sort-desc');
      });
    }
    function exportCSV() {
      const rows = Array.from(document.querySelectorAll('#t tr'))
      const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => {
        const v = c.textContent.trim();
        if (v === '—' || v === '') return '""';
        if (/^\\d{4}-\\d{2}-\\d{2}/.test(v) || v.startsWith('+')) return '="' + v.replace(/"/g,'""') + '"';
        return '"' + v.replace(/"/g,'""') + '"';
      }).join(',')).join('\\n')
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['\\uFEFF' + csv], {type:'text/csv;charset=utf-8;'})), download: 'agent-performance-details.csv' })
      a.click()
    }
    function playRec(btn) {
      const key = decodeURIComponent(btn.dataset.key)
      const tr = btn.closest('tr')
      var allAudio = document.querySelectorAll('.audio-row')
      var wasSelf = false
      allAudio.forEach(function(row) {
        var audio = row.querySelector('audio')
        if (audio) { audio.pause(); audio.src = '' }
        var prevBtn = row.previousElementSibling ? row.previousElementSibling.querySelector('.play-btn') : null
        if (prevBtn) prevBtn.innerHTML = '&#9654; Play'
        if (row.previousElementSibling === tr) wasSelf = true
        row.remove()
      })
      if (wasSelf) return
      var cell = document.createElement('tr')
      cell.className = 'audio-row'
      cell.innerHTML = '<td colspan="999" style="padding:8px;background:#f8f9fa;"><audio controls autoplay style="width:100%"><source src="/api/recording?key=' + encodeURIComponent(key) + '" type="audio/wav">Your browser does not support audio.</audio></td>'
      tr.after(cell)
      btn.innerHTML = '&#9724; Stop'
    }
  </script>
</body></html>`
  }

  // Filtered by local search term only (global agent filter already applied at API level)
  const displayedAgents = useMemo(() => {
    const filtered = !searchTerm
      ? agentData
      : agentData.filter((a) => a.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    return filtered.map((a) => {
      const completed = parseInt(a.completed_by_caller || '0') + parseInt(a.completed_by_agent || '0')
      const denom = completed + parseInt(a.missed || '0') + parseInt(a.rejected || '0') + parseInt(a.failed || '0')
      return { ...a, completion_rate: denom > 0 ? (completed / denom) * 100 : 0 }
    })
  }, [agentData, searchTerm])

  const totalAgents = displayedAgents.length
  const totalCompleted = displayedAgents.reduce((sum, a) => sum + parseInt(a.completed_by_caller || '0') + parseInt(a.completed_by_agent || '0'), 0)
  const ratedAgents = displayedAgents.filter((a) => (a.completion_rate ?? 0) > 0)
  const avgCompletionRate = ratedAgents.length > 0
    ? (ratedAgents.reduce((sum, a) => sum + (a.completion_rate ?? 0), 0) / ratedAgents.length).toFixed(1)
    : '0'
  const agentCompleted = (a: AgentCallDisposition) => parseInt(a.completed_by_caller || '0') + parseInt(a.completed_by_agent || '0')
  const topAgent = displayedAgents.length > 0
    ? displayedAgents.reduce((max, a) => agentCompleted(a) > agentCompleted(max) ? a : max)
    : null

  const sort = useSortable(displayedAgents)

  const handleExport = () => {
    const headers = ['Agent Name', 'Region', 'Answered', 'Outbound', 'Completed by Caller', 'Completed by Agent', 'Transferred Out', 'Missed', 'Rejected', 'Failed', 'Completion Rate']
    const rows = sort.sorted.map((agent) => [
      agent.agent_name,
      agent.region || '',
      agent.answered || '0',
      agent.outbound || '0',
      agent.completed_by_caller || '0',
      agent.completed_by_agent || '0',
      agent.transferred_out || '0',
      agent.missed || '0',
      agent.rejected || '0',
      agent.failed || '0',
      `${(agent.completion_rate ?? 0).toFixed(1)}%`,
    ])
    exportToCSV('agent-performance', headers, rows)
  }

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
                  <p className="text-xs text-muted-foreground">{ratedAgents.length} active agents</p>
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
                    {topAgent ? `${agentCompleted(topAgent)} completed` : 'No data'}
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
                  <Button variant="outline" size="sm" onClick={handleExport} disabled={isLoading || sort.sorted.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : displayedAgents.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="agent_name" label="Agent Name" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="answered" label="Answered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="outbound" label="Outbound" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="completed_by_caller" label="Completed by Caller" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="completed_by_agent" label="Completed by Agent" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="transferred_out" label="Transferred Out" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="missed" label="Missed" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="rejected" label="Rejected" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="failed" label="Failed" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="completion_rate" label="Completion Rate" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((agent, index) => {
                        return (
                          <TableRow key={index}>
                            <TableCell
                              className="font-medium cursor-pointer text-primary hover:underline"
                              onClick={() => handleViewDrilldown(agent)}
                            >
                              {loadingDrilldownId === agent.user_id ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                              {agent.agent_name}
                            </TableCell>
                            <TableCell className="text-right">{agent.region || '—'}</TableCell>
                            <TableCell className="text-right font-mono text-green-600">{agent.answered || '0'}</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">{agent.outbound || '0'}</TableCell>
                            <TableCell className="text-right font-mono">{agent.completed_by_caller || '0'}</TableCell>
                            <TableCell className="text-right font-mono">{agent.completed_by_agent || '0'}</TableCell>
                            <TableCell className="text-right font-mono">{agent.transferred_out || '0'}</TableCell>
                            <TableCell className="text-right font-mono text-orange-600">{agent.missed || '0'}</TableCell>
                            <TableCell className="text-right font-mono text-red-800">{agent.rejected || '0'}</TableCell>
                            <TableCell className="text-right font-mono text-red-600">{agent.failed || '0'}</TableCell>
                            <TableCell className="text-right font-mono text-purple-600">{(agent.completion_rate ?? 0).toFixed(1)}%</TableCell>
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
