"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { Input } from "@/components/ui/input"
import { exportToCSV } from "@/lib/csv-export"

/* -------------------------------------------------------------------------- */
/*                               Data interfaces                               */
/* -------------------------------------------------------------------------- */

interface AnsweredByQueueRow {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  region: string
  answered: string
  count: string
  "%_calls": string
  received: string
  completed: string
  transferred: string
  talk_time: string
  "%_talk_time": string
  avg_talk: string
  ring_time: string
  wait_time: string
  avg_wait: string
  max_wait_time: string
  [key: string]: string
}

interface AnsweredByDIDRow {
  did: string
  channel: string
  initiation_method: string
  region: string
  received: string
  completed: string
  transferred: string
  "%_calls": string
  talk_time: string
  "%_talk_time": string
  avg_talk: string
  ring_time: string
  wait_time: string
  avg_wait: string
  max_wait_time: string
  // legacy fallbacks
  answered: string
  count: string
  [key: string]: string
}

interface AnsweredByAgentRow {
  agent_id: string
  agent_name: string
  region: string
  channel: string
  initiation_method: string
  received: string
  completed: string
  transferred: string
  "%_calls": string
  talk_time: string
  "%_talk_time": string
  avg_talk: string
  ring_time: string
  wait_time: string
  avg_wait: string
  max_wait_time: string
  [key: string]: string
}

interface DrilldownData {
  row_no: string
  did: string
  contact_id: string
  agent_name: string
  date: string
  queue_name: string
  region: string
  customer_number: string
  channel: string
  initiation_method: string
  interaction_status: string
  agent_connection_attempts: string
  event: string
  ring_time: string
  wait_time: string
  talk_time: string
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                    */
/* -------------------------------------------------------------------------- */


type SortDir = "asc" | "desc" | null

function useSortable<T extends Record<string, any>>(data: T[]) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      const an = parseFloat(av)
      const bn = parseFloat(bv)
      const numA = isNaN(an) ? av : an
      const numB = isNaN(bn) ? bv : bn
      if (numA < numB) return sortDir === "asc" ? -1 : 1
      if (numA > numB) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc") }
    else if (sortDir === "asc") setSortDir("desc")
    else { setSortKey(null); setSortDir(null) }
  }

  return { sorted, handleSort, sortKey, sortDir }
}

function SortHead({
  col, label, sortKey, sortDir, onSort, className,
}: {
  col: string; label: string; sortKey: string | null; sortDir: SortDir; onSort: (k: string) => void; className?: string
}) {
  return (
    <TableHead className={cn("cursor-pointer select-none whitespace-nowrap", className)} onClick={() => onSort(col)}>
      {label}
      {sortKey !== col ? (
        <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 inline-block" />
      ) : sortDir === "asc" ? (
        <ChevronUp className="ml-1 h-3 w-3 inline-block" />
      ) : (
        <ChevronDown className="ml-1 h-3 w-3 inline-block" />
      )}
    </TableHead>
  )
}

function sumNumeric(data: Record<string, any>[], key: string): string {
  const total = data.reduce((acc, row) => { const v = parseFloat(row[key]); return acc + (isNaN(v) ? 0 : v) }, 0)
  return total === 0 ? "0" : total % 1 === 0 ? String(total) : total.toFixed(2)
}

function avgNumeric(data: Record<string, any>[], key: string): string {
  const vals = data.map((r) => parseFloat(r[key])).filter((v) => !isNaN(v))
  if (!vals.length) return "—"
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg % 1 === 0 ? String(avg) : avg.toFixed(2)
}

function avgTime(data: Record<string, any>[], key: string): string {
  const toSecs = (t: string) => {
    if (!t || t === "—") return null
    const parts = t.replace(/[^\d:]/g, '').split(":").map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return null
  }
  const vals = data.map((r) => toSecs(r[key])).filter((v): v is number => v !== null)
  if (!vals.length) return "—"
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  const h = Math.floor(avg / 3600).toString().padStart(2, '0')
  const m = Math.floor((avg % 3600) / 60).toString().padStart(2, '0')
  const s = (avg % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function generateDrilldownHTML(data: DrilldownData[], title: string, startDate?: Date, endDate?: Date) {
  const dateRangeText = startDate && endDate
    ? `From ${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}`
    : ""
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:20px; background:#f9fafb; color:#1f2937; }
    .container { max-width:1400px; margin:0 auto; background:white; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.1); overflow:hidden; }
    .header { padding:24px; border-bottom:1px solid #e5e7eb; }
    h1 { font-size:22px; font-weight:600; color:#111827; margin-bottom:6px; }
    .subtitle { font-size:14px; color:#6b7280; }
    .actions { display:flex; justify-content:space-between; align-items:center; padding:14px 24px; background:#f9fafb; border-bottom:1px solid #e5e7eb; }
    .count { font-size:14px; color:#6b7280; }
    .search-box { padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; width:280px; outline:none; }
    .search-box:focus { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
    .btn { padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
    .btn:hover { background:#2563eb; }
    .table-container { overflow:auto; height:calc(100vh - 200px); }
    table { width:100%; border-collapse:collapse; }
    th { background:#f9fafb; padding:11px 16px; text-align:left; font-size:11px; font-weight:600; color:#374151; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
    td { padding:11px 16px; font-size:13px; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
    tr:hover { background:#f9fafb; }
    .mono { font-family:ui-monospace,SFMono-Regular,monospace; font-size:12px; }
    .empty { padding:48px; text-align:center; color:#9ca3af; }
    @media print { .btn { display:none; } body { background:white; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p class="subtitle">Contact-level details${dateRangeText ? " — " + dateRangeText : ""}</p>
    </div>
    <div class="actions">
      <span class="count" id="rowCount">Showing ${data.length} contact${data.length !== 1 ? "s" : ""}</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" class="search-box" id="searchInput" placeholder="Search contacts..." oninput="filterTable()" />
        <button class="btn" onclick="exportCSV()">Export CSV</button>
      </div>
    </div>
    <div class="table-container">
      <table id="t">
        <thead style="position:sticky;top:0;z-index:1;"><tr>
          <th>DID</th><th>Contact ID</th><th>Agent</th><th>Date</th><th>Queue</th>
          <th>Region</th><th>Customer</th><th>Channel</th><th>Method</th><th>Status</th>
          <th>Agent Conn.</th><th>Event</th><th>Ring Time</th><th>Wait Time</th><th>Talk Time</th>
        </tr></thead>
        <tbody>
          ${data.length > 0
            ? data.map((r) => `<tr>
              <td class="mono">${r.did || "—"}</td>
              <td class="mono">${r.contact_id || "—"}</td>
              <td>${r.agent_name || "—"}</td>
              <td>${r.date || "—"}</td>
              <td>${r.queue_name || "—"}</td>
              <td>${r.region || "—"}</td>
              <td class="mono">${r.customer_number || "—"}</td>
              <td>${r.channel || "—"}</td>
              <td>${r.initiation_method || "—"}</td>
              <td>${r.interaction_status || "—"}</td>
              <td>${r.agent_connection_attempts || "—"}</td>
              <td>${r.event || "—"}</td>
              <td>${r.ring_time || "—"}</td>
              <td>${r.wait_time || "—"}</td>
              <td>${r.talk_time || "—"}</td>
            </tr>`).join("")
            : '<tr><td colspan="15" class="empty">No contacts found.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  </div>
  <script>
    function exportCSV() {
      const rows = Array.from(document.querySelectorAll('#t tr'))
      const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => '"' + c.textContent.trim().replace(/"/g,'""') + '"').join(',')).join('\\n')
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: 'answered-drilldown.csv' })
      a.click()
    }
    function filterTable() {
      var term = document.getElementById('searchInput').value.toLowerCase()
      var rows = document.querySelectorAll('#t tbody tr')
      var visible = 0
      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase()
        var show = !term || text.indexOf(term) > -1
        row.style.display = show ? '' : 'none'
        if (show) visible++
      })
      document.getElementById('rowCount').textContent = 'Showing ' + visible + ' contact' + (visible !== 1 ? 's' : '')
    }
  </script>
</body></html>`
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export default function AnsweredCallsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedSearchTerm: searchTerm,
    appliedQueues: selectedQueues,
    appliedAgents: selectedAgents,
    appliedDids: selectedDids,
    applyVersion,
  } = useGlobalFilters()

  // Refs so fetchTab always reads the LATEST filter values (avoids stale closure)
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

  const [activeTab, setActiveTab] = useState("queue")

  const [queueData, setQueueData] = useState<AnsweredByQueueRow[]>([])
  const [didData, setDidData] = useState<AnsweredByDIDRow[]>([])
  const [agentData, setAgentData] = useState<AnsweredByAgentRow[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [localSearch, setLocalSearch] = useState("")
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})

  const getDateRange = () => ({
    start: DateHelper.formatDateFromDate(startRef.current),
    end: DateHelper.formatDateFromDate(endRef.current, true),
  })

  const fetchTab = async (tab: string, force = false) => {
    if (loaded[tab] && !force) return
    setIsLoading(true)
    const { start, end } = getDateRange()
    // Always read from ref — guaranteed to be the latest applied filter values
    const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
    const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
    const didFilter = didsRef.current.length > 0 ? didsRef.current : undefined
    try {
      let result: any
      if (tab === "queue") result = await athenaAPI.getAnsweredByQueue(start, end, undefined, user?.email, queueFilter, agentFilter, didFilter)
      else if (tab === "did") result = await athenaAPI.getAnsweredByDID(start, end, undefined, user?.email, queueFilter, agentFilter, didFilter)
      else if (tab === "agent") result = await athenaAPI.getAnsweredByAgent(start, end, queueFilter, undefined, user?.email, agentFilter, didFilter)
      else return

      if (result?.status === "SUCCEEDED") {
        console.log(`[Answered ${tab}] columns:`, result.columns, "first row:", result.data?.[0])
        if (tab === "queue") setQueueData(result.data)
        else if (tab === "did") setDidData(result.data)
        else if (tab === "agent") setAgentData(result.data)
        setLoaded((prev) => ({ ...prev, [tab]: true }))
      }
    } catch (err) {
      console.error(`Fetch ${tab} error:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      // Sync refs immediately so fetchTab reads the new applied values
      startRef.current = startDate
      endRef.current = endDate
      queuesRef.current = selectedQueues
      agentsRef.current = selectedAgents
      didsRef.current = selectedDids
      setLoaded({})
      setQueueData([]); setDidData([]); setAgentData([])
      fetchTab(activeTab, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  useEffect(() => {
    if (!authLoading) fetchTab("queue")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) fetchTab(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchDrilldown = async (filters: { agentId?: string; queueId?: string; did?: string }, title: string, itemId: string) => {
    setLoadingItemId(itemId)
    try {
      const { start, end } = getDateRange()
      const apiFilters: any = {}
      if (filters.agentId) apiFilters.agentId = [filters.agentId]
      if (filters.queueId) apiFilters.queueId = [filters.queueId]
      if (filters.did) apiFilters.did = [filters.did]
      const result = await athenaAPI.getAnsweredDrilldown(start, end, apiFilters, null, user?.email)
      if (result?.status === "SUCCEEDED") {
        const win = window.open("", "_blank")
        if (win) {
          win.document.write(generateDrilldownHTML(result.data, title, startDate, endDate))
          win.document.close()
        }
      }
    } catch (err) {
      console.error("Drilldown error:", err)
    } finally {
      setLoadingItemId(null)
    }
  }

  // ── filtered + sorted data ───────────────────────────────────────────────────
  const search = localSearch || searchTerm || ""
  const filteredQueues = useMemo(
    () => search ? queueData.filter((q) => (q.queue_name || q.queue_id).toLowerCase().includes(search.toLowerCase())) : queueData,
    [queueData, search]
  )
  const filteredDIDs = useMemo(
    () => search ? didData.filter((d) => d.did?.toLowerCase().includes(search.toLowerCase())) : didData,
    [didData, search]
  )
  const filteredAgents = useMemo(
    () => search ? agentData.filter((a) => a.agent_name?.toLowerCase().includes(search.toLowerCase())) : agentData,
    [agentData, search]
  )

  const queueSort = useSortable(filteredQueues)
  const didSort = useSortable(filteredDIDs)
  const agentSort = useSortable(filteredAgents)

  const LoadingRow = ({ cols }: { cols: number }) => (
    <TableRow><TableCell colSpan={cols} className="h-32 text-center">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />Loading data...
      </div>
    </TableCell></TableRow>
  )

  const EmptyRow = ({ cols, label }: { cols: number; label: string }) => (
    <TableRow><TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">{label}</TableCell></TableRow>
  )

  const currentData = activeTab === "queue" ? queueSort.sorted : activeTab === "did" ? didSort.sorted : agentSort.sorted

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Answered Calls</h1>
            <p className="text-muted-foreground">Answered call analysis by queue, DID, and agent</p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="queue">By Queue</TabsTrigger>
                    <TabsTrigger value="did">By DID</TabsTrigger>
                    <TabsTrigger value="agent">By Agent</TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(currentData, `answered-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by queue, DID, agent..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="pl-8 max-w-sm"
                    />
                  </div>
                </div>

                {/* By Queue */}
                <TabsContent value="queue">
                  <div className="scrollable-table">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["queue_name","Queue"],["channel","Channel"],["initiation_method","Method"],["region","Region"],
                            ["received","Received"],["completed","Completed"],["transferred","Transferred"],["%_calls","% Calls"],
                            ["talk_time","Talk Time"],["%_talk_time","% Talk Time"],["avg_talk","Avg Talk"],
                            ["ring_time","Ring Time"],["wait_time","Wait Time"],["avg_wait","Avg Wait"],["max_wait_time","Max Wait"],
                          ].map(([col,label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={queueSort.sortKey} sortDir={queueSort.sortDir} onSort={queueSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "queue" ? <LoadingRow cols={15} />
                        : queueSort.sorted.length === 0 ? <EmptyRow cols={15} label="No queue data found." />
                        : <>
                          {queueSort.sorted.map((q) => (
                            <TableRow key={q.queue_id}>
                              <TableCell className="font-medium cursor-pointer text-primary hover:underline whitespace-nowrap" onClick={() => fetchDrilldown({ queueId: q.queue_id }, `Answered Calls — ${q.queue_name || q.queue_id}`, q.queue_id)}>
                                {loadingItemId === q.queue_id ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                                {q.queue_name || q.queue_id}
                              </TableCell>
                              <TableCell>{q.channel}</TableCell>
                              <TableCell>{q.initiation_method}</TableCell>
                              <TableCell>{q.region || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.received || q.answered || q.count || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.completed || q.answered || q.count || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.transferred || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q["%_calls"] || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.talk_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q["%_talk_time"] || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.avg_talk || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.ring_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.wait_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.avg_wait || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{q.max_wait_time || "—"}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>TOTAL</TableCell>
                            <TableCell className="text-right">{sumNumeric(queueSort.sorted, "received") !== "0" ? sumNumeric(queueSort.sorted, "received") : sumNumeric(queueSort.sorted, "answered") !== "0" ? sumNumeric(queueSort.sorted, "answered") : sumNumeric(queueSort.sorted, "count")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(queueSort.sorted, "completed") !== "0" ? sumNumeric(queueSort.sorted, "completed") : sumNumeric(queueSort.sorted, "answered") !== "0" ? sumNumeric(queueSort.sorted, "answered") : sumNumeric(queueSort.sorted, "count")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(queueSort.sorted, "transferred")}</TableCell>
                            <TableCell className="text-right">{avgNumeric(queueSort.sorted, "%_calls")}</TableCell>
                            <TableCell colSpan={7} />
                          </TableRow>
                        </>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* By DID */}
                <TabsContent value="did">
                  <div className="scrollable-table">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["did","DID"],["channel","Channel"],["initiation_method","Method"],["region","Region"],
                            ["received","Received"],["completed","Completed"],["transferred","Transferred"],["%_calls","% Calls"],
                            ["talk_time","Talk Time"],["%_talk_time","% Talk Time"],["avg_talk","Avg Talk"],
                            ["ring_time","Ring Time"],["wait_time","Wait Time"],["avg_wait","Avg Wait"],["max_wait_time","Max Wait"],
                          ].map(([col,label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={didSort.sortKey} sortDir={didSort.sortDir} onSort={didSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "did" ? <LoadingRow cols={15} />
                        : didSort.sorted.length === 0 ? <EmptyRow cols={15} label="No DID data found." />
                        : <>
                          {didSort.sorted.map((d, i) => (
                            <TableRow key={d.did + i}>
                              <TableCell className="font-mono cursor-pointer text-primary hover:underline whitespace-nowrap" onClick={() => fetchDrilldown({ did: d.did }, `Answered Calls — ${d.did}`, d.did)}>
                                {loadingItemId === d.did ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                                {d.did}
                              </TableCell>
                              <TableCell>{d.channel}</TableCell>
                              <TableCell>{d.initiation_method}</TableCell>
                              <TableCell>{d.region || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.received || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.completed || d.answered || d.count || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.transferred || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d["%_calls"] || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.talk_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d["%_talk_time"] || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.avg_talk || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.ring_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.wait_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.avg_wait || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{d.max_wait_time || "—"}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>TOTAL</TableCell>
                            <TableCell className="text-right">{sumNumeric(didSort.sorted, "received")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(didSort.sorted, "completed") !== "0" ? sumNumeric(didSort.sorted, "completed") : sumNumeric(didSort.sorted, "answered") !== "0" ? sumNumeric(didSort.sorted, "answered") : sumNumeric(didSort.sorted, "count")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(didSort.sorted, "transferred")}</TableCell>
                            <TableCell className="text-right">{avgNumeric(didSort.sorted, "%_calls")}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">{avgTime(didSort.sorted, "avg_talk")}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">{avgTime(didSort.sorted, "avg_wait")}</TableCell>
                            <TableCell className="text-right">{avgTime(didSort.sorted, "max_wait_time")}</TableCell>
                          </TableRow>
                        </>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* By Agent */}
                <TabsContent value="agent">
                  <div className="scrollable-table">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["agent_name","Agent"],["region","Region"],["channel","Channel"],["initiation_method","Method"],
                            ["received","Received"],["completed","Completed"],["transferred","Transferred"],["%_calls","% Calls"],
                            ["talk_time","Talk Time"],["%_talk_time","% Talk Time"],["avg_talk","Avg Talk"],
                            ["ring_time","Ring Time"],["wait_time","Wait Time"],["avg_wait","Avg Wait"],["max_wait_time","Max Wait"],
                          ].map(([col,label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={agentSort.sortKey} sortDir={agentSort.sortDir} onSort={agentSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "agent" ? <LoadingRow cols={15} />
                        : agentSort.sorted.length === 0 ? <EmptyRow cols={15} label="No agent data found." />
                        : <>
                          {agentSort.sorted.map((a, i) => (
                            <TableRow key={a.agent_id + i}>
                              <TableCell className="font-medium cursor-pointer text-primary hover:underline whitespace-nowrap" onClick={() => fetchDrilldown({ agentId: a.agent_id }, `Answered Calls — ${a.agent_name}`, a.agent_id)}>
                                {loadingItemId === a.agent_id ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                                {a.agent_name}
                              </TableCell>
                              <TableCell>{a.region || "—"}</TableCell>
                              <TableCell>{a.channel}</TableCell>
                              <TableCell>{a.initiation_method}</TableCell>
                              <TableCell className="text-right font-mono">{a.received}</TableCell>
                              <TableCell className="text-right font-mono">{a.completed}</TableCell>
                              <TableCell className="text-right font-mono">{a.transferred}</TableCell>
                              <TableCell className="text-right font-mono">{a["%_calls"]}</TableCell>
                              <TableCell className="text-right font-mono">{a.talk_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a["%_talk_time"] || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a.avg_talk || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a.ring_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a.wait_time || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a.avg_wait || "—"}</TableCell>
                              <TableCell className="text-right font-mono">{a.max_wait_time || "—"}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>TOTAL</TableCell>
                            <TableCell className="text-right">{sumNumeric(agentSort.sorted, "received")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(agentSort.sorted, "completed")}</TableCell>
                            <TableCell className="text-right">{sumNumeric(agentSort.sorted, "transferred")}</TableCell>
                            <TableCell className="text-right">{avgNumeric(agentSort.sorted, "%_calls")}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">{avgTime(agentSort.sorted, "avg_talk")}</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">{avgTime(agentSort.sorted, "avg_wait")}</TableCell>
                            <TableCell className="text-right">{avgTime(agentSort.sorted, "max_wait_time")}</TableCell>
                          </TableRow>
                        </>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
