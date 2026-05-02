"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useSortable, SortHead } from "@/lib/sort-table"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, RefreshCw, Users, Phone, Clock, Search } from "lucide-react"
import { format } from "date-fns"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGlobalFilters } from "@/lib/global-filters-context"

interface AgentAvailData {
  agent_id: string
  agent: string
  agent_region: string
  answered: string
  outbound: string
  missed: string
  rejected: string
  failed: string
  pauses: string
  pause_time: string
  '%_pauses': string
  online_time: string
  available_time: string
  offline_time: string
  idle_time: string
  talk_time: string
  wrap_up_time: string
  hold_time: string
  aht: string
}

export default function AgentAvailabilityPage() {
  const [agentData, setAgentData] = useState<AgentAvailData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState("")
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
      // Sync refs immediately so loadData reads the new applied values
      startRef.current = startDate
      endRef.current = endDate
      agentsRef.current = selectedAgents
      queuesRef.current = selectedQueues
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
      const result = await athenaAPI.getAgentDrilldown(start, end, agent.agent_id, user?.email)
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
  <title>Agent Availability Details - ${agentName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; background: #f9fafb; color: #1f2937; }
    .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { padding: 24px; border-bottom: 1px solid #e5e7eb; }
    h1 { font-size: 22px; font-weight: 600; color: #111827; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: #6b7280; }
    .actions { display: flex; justify-content: space-between; align-items: center; padding: 14px 24px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .count { font-size: 14px; color: #6b7280; }
    .search-box { padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; width:280px; outline:none; }
    .search-box:focus { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
    .btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .btn:hover { background: #2563eb; }
    .table-container { overflow: auto; height: calc(100vh - 200px); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f9fafb; padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; white-space: nowrap; cursor: pointer; user-select: none; }
    th:hover { background: #f3f4f6; }
    th.sort-asc::after { content: ' ▲'; font-size: 9px; }
    th.sort-desc::after { content: ' ▼'; font-size: 9px; }
    td { padding: 11px 16px; font-size: 13px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    tr:hover { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-login { background: #dcfce7; color: #166534; }
    .badge-logout { background: #fee2e2; color: #991b1b; }
    .badge-state { background: #dbeafe; color: #1e40af; }
    .badge-inbound { background: #f3e8ff; color: #6b21a8; }
    .badge-outbound { background: #ffedd5; color: #9a3412; }
    .badge-status { background: #fef9c3; color: #854d0e; }
    .badge-default { background: #f3f4f6; color: #374151; }
    .mono { font-family: monospace; font-size: 11px; }
    .empty { padding: 48px; text-align: center; color: #9ca3af; }
    .play-btn { color:#3b82f6; cursor:pointer; border:none; background:none; font-size:13px; font-family:inherit; padding:0; }
    .play-btn:hover { text-decoration:underline; }
    .play-btn:disabled { color:#9ca3af; cursor:wait; }
    @media print { .btn { display: none; } body { background: white; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Agent Availability Details — ${agentName}</h1>
      <p class="subtitle">Login, logout, and state change events${dateText ? ' · ' + dateText : ''}</p>
    </div>
    <div class="actions">
      <span class="count" id="rowCount">Showing ${data.length} event${data.length !== 1 ? 's' : ''}</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" class="search-box" id="searchInput" placeholder="Search events..." oninput="filterTable()" />
        <button class="btn" onclick="exportCSV()">Export CSV</button>
      </div>
    </div>
    <div class="table-container">
      <table id="t">
        <thead style="position:sticky;top:0;z-index:1;"><tr>
          <th onclick="sortTable(0)">Event Timestamp</th>
          <th onclick="sortTable(1)">Event Type</th>
          <th onclick="sortTable(2)">Agent Status Time</th>
          <th onclick="sortTable(3)">Agent Status</th>
          <th onclick="sortTable(4)">Queue Timestamp</th>
          <th onclick="sortTable(5)">Queue</th>
          <th onclick="sortTable(6)">Contact State Start</th>
          <th onclick="sortTable(7)">Contact State</th>
          <th onclick="sortTable(8)">Channel</th>
          <th onclick="sortTable(9)">Initiation Method</th>
          <th onclick="sortTable(10)">Contact ID</th>
          <th onclick="sortTable(11)">Initial Contact ID</th>
          <th>Recording</th>
        </tr></thead>
        <tbody>
          ${data.length > 0 ? data.map(r => {
            const et = r.eventtype || ''
            const badgeClass = et === 'LOGIN' ? 'badge-login' : et === 'LOGOUT' ? 'badge-logout' : et === 'STATE_CHANGE' ? 'badge-state' : et === 'CONTACT_INBOUND' || et === 'CONTACT_TRANSFERRED' ? 'badge-inbound' : et === 'CONTACT_OUTBOUND' ? 'badge-outbound' : et === 'AGENT_STATUS_CHANGED' ? 'badge-status' : 'badge-default'
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
              <td>${r.event_timestamp || '—'}</td>
              <td><span class="badge ${badgeClass}">${et || '—'}</span></td>
              <td>${r.agent_status_timestamp || '—'}</td>
              <td>${r.agent_status || '—'}</td>
              <td>${r.queue_timestamp || '—'}</td>
              <td>${r.queue_name || '—'}</td>
              <td>${r.contact_state_start_timestamp || '—'}</td>
              <td>${r.contact_state || '—'}</td>
              <td>${r.channel || '—'}</td>
              <td>${r.initiationmethod || '—'}</td>
              <td class="mono">${r.contactid || r.contact_id || '—'}</td>
              <td class="mono">${r.initialcontactid || '—'}</td>
              <td>${recordingCell}</td>
            </tr>`
          }).join('') : '<tr><td colspan="13" class="empty">No events found.</td></tr>'}
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
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['\\uFEFF' + csv], {type:'text/csv;charset=utf-8;'})), download: 'agent-availability-details.csv' })
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
    function filterTable() {
      var term = document.getElementById('searchInput').value.toLowerCase()
      var rows = document.querySelectorAll('#t tbody tr:not(.audio-row)')
      var visible = 0
      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase()
        var show = !term || text.indexOf(term) > -1
        row.style.display = show ? '' : 'none'
        if (show) visible++
      })
      document.getElementById('rowCount').textContent = 'Showing ' + visible + ' event' + (visible !== 1 ? 's' : '')
    }
  </script>
</body></html>`
  }

  const totalAgents = agentData.length
  const totalAnswered = agentData.reduce((sum, a) => sum + parseInt(a.answered || '0'), 0)
  const totalFailed = agentData.reduce((sum, a) => sum + parseInt(a.failed || '0'), 0)
  const totalMissed = agentData.reduce((sum, a) => sum + parseInt(a.missed || '0'), 0)
  const totalRejected = agentData.reduce((sum, a) => sum + parseInt(a.rejected || '0'), 0)
  const totalPauses = agentData.reduce((sum, a) => sum + parseInt(a.pauses || '0'), 0)

  const sumCol = (key: string) =>
    filteredAgentData.reduce((sum, a) => sum + parseInt((a as any)[key] || '0'), 0).toString()

  const avgTimeCol = (key: string): string => {
    const toSecs = (t: string) => {
      if (!t || t === '—') return null
      // handles "17 days - 05:17:23" → extract HH:MM:SS part
      const match = t.match(/(\d+):(\d+):(\d+)$/)
      if (!match) return null
      const days = t.match(/(\d+)\s*day/) ? parseInt(t.match(/(\d+)\s*day/)![1]) * 86400 : 0
      return days + parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
    }
    const vals = filteredAgentData.map((a) => toSecs((a as any)[key])).filter((v): v is number => v !== null)
    if (!vals.length) return '—'
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    const d = Math.floor(avg / 86400)
    const rem = avg % 86400
    const h = Math.floor(rem / 3600).toString().padStart(2, '0')
    const m = Math.floor((rem % 3600) / 60).toString().padStart(2, '0')
    const s = (rem % 60).toString().padStart(2, '0')
    return d > 0 ? `${d} days - ${h}:${m}:${s}` : `${h}:${m}:${s}`
  }

  const sumTimeCol = (key: string): string => {
    const toSecs = (t: string) => {
      if (!t || t === '—') return null
      const match = t.match(/(\d+):(\d+):(\d+)$/)
      if (!match) return null
      const days = t.match(/(\d+)\s*day/) ? parseInt(t.match(/(\d+)\s*day/)![1]) * 86400 : 0
      return days + parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])
    }
    const vals = filteredAgentData.map((a) => toSecs((a as any)[key])).filter((v): v is number => v !== null)
    if (!vals.length) return '—'
    const total = vals.reduce((a, b) => a + b, 0)
    const d = Math.floor(total / 86400)
    const rem = total % 86400
    const h = Math.floor(rem / 3600).toString().padStart(2, '0')
    const m = Math.floor((rem % 3600) / 60).toString().padStart(2, '0')
    const s = (rem % 60).toString().padStart(2, '0')
    return d > 0 ? `${d} days - ${h}:${m}:${s}` : `${h}:${m}:${s}`
  }

  const avgNumericCol = (key: string): string => {
    const vals = filteredAgentData.map((a) => parseFloat((a as any)[key])).filter((v) => !isNaN(v))
    if (!vals.length) return '—'
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return avg % 1 === 0 ? String(avg) : avg.toFixed(2)
  }

  const filteredAgentData = useMemo(() => {
    const search = localSearch.trim().toLowerCase()
    if (!search) return agentData
    return agentData.filter((agent) => {
      const values = [
        agent.agent, agent.agent_region, agent.answered, agent.outbound, agent.failed,
        agent.missed, agent.rejected, agent.online_time, agent.available_time,
        agent.offline_time, agent.pause_time, agent['%_pauses'], agent.pauses,
        agent.talk_time, agent.hold_time, agent.wrap_up_time, agent.idle_time, agent.aht,
      ]
      return values.some((v: any) => (v || '').toString().toLowerCase().includes(search))
    })
  }, [agentData, localSearch])

  const sort = useSortable(filteredAgentData)

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
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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
                <CardTitle className="text-sm font-medium">Missed Calls</CardTitle>
                <Phone className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalMissed.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total missed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected Calls</CardTitle>
                <Phone className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalRejected.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total rejected</p>
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
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by agent name, region..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredAgentData.length > 0 ? (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="agent" label="Agent" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="agent_region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="answered" label="Answered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="outbound" label="Outbound" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="missed" label="Missed" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="rejected" label="Rejected" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="failed" label="Failed" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="pauses" label="Pauses" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="pause_time" label="Pause Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="%_pauses" label="% Pauses" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="online_time" label="Online Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="available_time" label="Available Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="offline_time" label="Offline Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="idle_time" label="Idle Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="talk_time" label="Talk Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="wrap_up_time" label="Wrap-up Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="hold_time" label="Hold Time" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="aht" label="AHT" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium cursor-pointer text-primary hover:underline" onClick={() => handleViewDrilldown(agent)}>
                            {loadingAgentId === agent.agent_id ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                            {agent.agent}
                          </TableCell>
                          <TableCell>{agent.agent_region || '—'}</TableCell>
                          <TableCell className="text-right text-green-600 font-mono">{agent.answered || '0'}</TableCell>
                          <TableCell className="text-right text-blue-600 font-mono">{agent.outbound || '0'}</TableCell>
                          <TableCell className="text-right text-orange-600 font-mono">{agent.missed || '0'}</TableCell>
                          <TableCell className="text-right text-red-800 font-mono">{agent.rejected || '0'}</TableCell>
                          <TableCell className="text-right text-red-600 font-mono">{agent.failed || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pauses || '0'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.pause_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent['%_pauses'] || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.online_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-green-600">{agent.available_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">{agent.offline_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.idle_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.talk_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.wrap_up_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.hold_time || '—'}</TableCell>
                          <TableCell className="text-right font-mono">{agent.aht || '—'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right">{sumCol('answered')}</TableCell>
                        <TableCell className="text-right">{sumCol('outbound')}</TableCell>
                        <TableCell className="text-right">{sumCol('missed')}</TableCell>
                        <TableCell className="text-right">{sumCol('rejected')}</TableCell>
                        <TableCell className="text-right">{sumCol('failed')}</TableCell>
                        <TableCell className="text-right">{sumCol('pauses')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('pause_time')}</TableCell>
                        <TableCell className="text-right">{avgNumericCol('%_pauses')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('online_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('available_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('offline_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('idle_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('talk_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('wrap_up_time')}</TableCell>
                        <TableCell className="text-right">{sumTimeCol('hold_time')}</TableCell>
                        <TableCell className="text-right">{avgTimeCol('aht')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {localSearch
                    ? `No results found for "${localSearch}"`
                    : 'No agent availability data for the selected period'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
