"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { useGlobalFilters } from "@/lib/global-filters-context"

/* -------------------------------------------------------------------------- */
/*                               Data interfaces                               */
/* -------------------------------------------------------------------------- */

interface QueueData {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
}

interface DIDData {
  did: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
}

interface HourData {
  interval_date: string
  interval_hour: string
  channel: string
  initiation_method: string
  region: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
}

interface DayData {
  interval_date: string
  channel: string
  initiation_method: string
  region: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
  [key: string]: string
}

interface MonthData {
  month: string
  channel: string
  initiation_method: string
  region: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  "%_answered": string
  "%_unanswered": string
  sla: string
  [key: string]: string
}

interface AgentAnsweredData {
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
}

interface StateData {
  state: string
  region: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait: string
  avg_talk: string
  "%_answered": string
  "%_unanswered": string
  sla: string
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

function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0]).join(",")
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  )
  const csv = [headers, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

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
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("asc")
    } else if (sortDir === "asc") {
      setSortDir("desc")
    } else if (sortDir === "desc") {
      setSortKey(null)
      setSortDir(null)
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 inline-block" />
    if (sortDir === "asc") return <ChevronUp className="ml-1 h-3 w-3 inline-block" />
    return <ChevronDown className="ml-1 h-3 w-3 inline-block" />
  }

  return { sorted, handleSort, SortIcon, sortKey, sortDir }
}

function sumNumeric(data: Record<string, any>[], key: string): string {
  const total = data.reduce((acc, row) => {
    const v = parseFloat(row[key])
    return acc + (isNaN(v) ? 0 : v)
  }, 0)
  return total === 0 ? "0" : total % 1 === 0 ? String(total) : total.toFixed(2)
}

function avgNumeric(data: Record<string, any>[], key: string): string {
  const vals = data.map((r) => parseFloat(r[key])).filter((v) => !isNaN(v))
  if (!vals.length) return "—"
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return avg % 1 === 0 ? String(avg) : avg.toFixed(2)
}

/* -------------------------------------------------------------------------- */
/*                        Sortable table head cell                             */
/* -------------------------------------------------------------------------- */

function SortHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  col: string
  label: string
  sortKey: string | null
  sortDir: SortDir
  onSort: (k: string) => void
  className?: string
}) {
  return (
    <TableHead
      className={cn("cursor-pointer select-none whitespace-nowrap", className)}
      onClick={() => onSort(col)}
    >
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

/* -------------------------------------------------------------------------- */
/*                                 Drilldown                                   */
/* -------------------------------------------------------------------------- */

function generateDrilldownHTML(data: DrilldownData[], title: string, startDate?: Date, endDate?: Date) {
  const dateRangeText =
    startDate && endDate
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
    .btn { padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
    .btn:hover { background:#2563eb; }
    .table-container { overflow-x:auto; }
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
      <span class="count">Showing ${data.length} contact${data.length !== 1 ? "s" : ""}</span>
      <button class="btn" onclick="exportCSV()">Export CSV</button>
    </div>
    <div class="table-container">
      <table id="t">
        <thead><tr>
          <th>DID</th><th>Contact ID</th><th>Agent</th><th>Date</th><th>Queue</th>
          <th>Region</th><th>Customer</th><th>Channel</th><th>Method</th><th>Status</th>
          <th>Agent Conn.</th><th>Event</th><th>Ring Time</th><th>Wait Time</th><th>Talk Time</th>
        </tr></thead>
        <tbody>
          ${
            data.length > 0
              ? data
                  .map(
                    (r) => `<tr>
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
            </tr>`
                  )
                  .join("")
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
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: 'distribution-drilldown.csv' })
      a.click()
    }
  </script>
</body></html>`
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export default function QueueDistributionPage() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedSearchTerm: searchTerm,
    appliedQueues: selectedQueues,
    applyVersion,
    setAvailableQueues,
  } = useGlobalFilters()

  // ── tab ─────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("queue")

  // ── data ────────────────────────────────────────────────────────────────────
  const [queueData, setQueueData] = useState<QueueData[]>([])
  const [didData, setDidData] = useState<DIDData[]>([])
  const [hourData, setHourData] = useState<HourData[]>([])
  const [dayData, setDayData] = useState<DayData[]>([])
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [agentData, setAgentData] = useState<AgentAnsweredData[]>([])
  const [stateData, setStateData] = useState<StateData[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

  // ── per-tab loading flags (avoid re-fetching already loaded) ─────────────────
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})

  const dateRange = () => ({
    start: DateHelper.formatDateFromDate(startDate),
    end: DateHelper.formatDateFromDate(endDate, true),
  })

  // ── fetch helpers ────────────────────────────────────────────────────────────
  const fetchTab = async (tab: string, force = false) => {
    if (loaded[tab] && !force) return
    setIsLoading(true)
    const { start, end } = dateRange()
    try {
      let result: any
      if (tab === "queue") result = await athenaAPI.getDistributionByQueue(start, end, null, user?.email)
      else if (tab === "did") result = await athenaAPI.getDistributionByDID(start, end, null, user?.email)
      else if (tab === "hour") result = await athenaAPI.getDistributionByHour(start, end, null, user?.email)
      else if (tab === "day") result = await athenaAPI.getDistributionByDay(start, end, null, user?.email)
      else if (tab === "month") result = await athenaAPI.getDistributionByMonth(start, end, null, user?.email)
      else if (tab === "agent") result = await athenaAPI.getAnsweredByAgent(start, end, undefined, null, user?.email)
      else if (tab === "state") result = await athenaAPI.getDistributionByState(start, end, null, user?.email)
      else return

      if (result?.status === "SUCCEEDED") {
        if (tab === "queue") setQueueData(result.data)
        else if (tab === "did") setDidData(result.data)
        else if (tab === "hour") setHourData(result.data)
        else if (tab === "day") setDayData(result.data)
        else if (tab === "month") setMonthData(result.data)
        else if (tab === "agent") setAgentData(result.data)
        else if (tab === "state") setStateData(result.data)
        setLoaded((prev) => ({ ...prev, [tab]: true }))
      }
    } catch (err) {
      console.error(`Fetch ${tab} error:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  // Re-fetch all data when Apply is clicked (applyVersion increments)
  useEffect(() => {
    if (!authLoading) {
      setLoaded({})
      setQueueData([])
      setDidData([])
      setHourData([])
      setDayData([])
      setMonthData([])
      setAgentData([])
      setStateData([])
      setTimeout(() => fetchTab(activeTab, true), 0)
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

  // ── drilldown ────────────────────────────────────────────────────────────────
  const fetchDrilldown = async (queueId?: string, did?: string, title?: string, itemId?: string) => {
    setLoadingItemId(itemId || null)
    try {
      const { start, end } = dateRange()
      const filters: any = {}
      if (queueId) filters.queueId = [queueId]
      if (did) filters.did = [did]
      const result = await athenaAPI.getDistributionDrilldown(start, end, filters, null, user?.email)
      if (result?.status === "SUCCEEDED") {
        const win = window.open("", "_blank")
        if (win) {
          win.document.write(generateDrilldownHTML(result.data, title || "Contact Details", startDate, endDate))
          win.document.close()
        }
      }
    } catch (err) {
      console.error("Drilldown error:", err)
    } finally {
      setLoadingItemId(null)
    }
  }

  // ── filtering ────────────────────────────────────────────────────────────────
  const allQueueNames = useMemo(() => {
    const names = Array.from(new Set(queueData.map((q) => q.queue_name || q.queue_id))).sort()
    setAvailableQueues(names)
    return names
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueData])

  const filteredQueues = useMemo(() => {
    let rows = queueData
    if (selectedQueues.length > 0) rows = rows.filter((q) => selectedQueues.includes(q.queue_name || q.queue_id))
    if (searchTerm) rows = rows.filter((q) => (q.queue_name || q.queue_id).toLowerCase().includes(searchTerm.toLowerCase()))
    return rows
  }, [queueData, selectedQueues, searchTerm])

  const filteredDIDs = useMemo(
    () => (searchTerm ? didData.filter((d) => d.did?.toLowerCase().includes(searchTerm.toLowerCase())) : didData),
    [didData, searchTerm]
  )

  const filteredHours = useMemo(
    () =>
      searchTerm
        ? hourData.filter(
            (h) =>
              h.interval_date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              h.interval_hour?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : hourData,
    [hourData, searchTerm]
  )

  const filteredDays = useMemo(
    () => (searchTerm ? dayData.filter((d) => d.interval_date?.toLowerCase().includes(searchTerm.toLowerCase())) : dayData),
    [dayData, searchTerm]
  )

  const filteredMonths = useMemo(
    () => (searchTerm ? monthData.filter((m) => (m.month || m.interval_month || "").toLowerCase().includes(searchTerm.toLowerCase())) : monthData),
    [monthData, searchTerm]
  )

  const filteredAgents = useMemo(
    () =>
      searchTerm
        ? agentData.filter((a) => a.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : agentData,
    [agentData, searchTerm]
  )

  const filteredStates = useMemo(
    () =>
      searchTerm
        ? stateData.filter((s) => s.state?.toLowerCase().includes(searchTerm.toLowerCase()))
        : stateData,
    [stateData, searchTerm]
  )

  // ── sortable hooks per tab ────────────────────────────────────────────────────
  const queueSort = useSortable(filteredQueues)
  const didSort = useSortable(filteredDIDs)
  const hourSort = useSortable(filteredHours)
  const daySort = useSortable(filteredDays)
  const monthSort = useSortable(filteredMonths)
  const agentSort = useSortable(filteredAgents)
  const stateSort = useSortable(filteredStates)

  // ── common numeric totals ─────────────────────────────────────────────────────
  const numericCols = ["received", "answered", "unanswered", "abandoned", "transferred"]

  const LoadingRow = ({ cols }: { cols: number }) => (
    <TableRow>
      <TableCell colSpan={cols} className="h-32 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading data...
        </div>
      </TableCell>
    </TableRow>
  )

  const EmptyRow = ({ cols, label }: { cols: number; label: string }) => (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )

  /* -------------------------------------------------------------------------- */
  /*                                  Render                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queue Distribution</h1>
            <p className="text-muted-foreground">Call distribution by queue, DID, agent, hour, day, and month</p>
          </div>


          {/* ── Tabs ────────────────────────────────────────────────────────── */}
          <Card>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    <TabsTrigger value="queue">By Queue</TabsTrigger>
                    <TabsTrigger value="did">By DID</TabsTrigger>
                    <TabsTrigger value="agent">By Agent</TabsTrigger>
                    <TabsTrigger value="hour">By Hour</TabsTrigger>
                    <TabsTrigger value="day">By Day</TabsTrigger>
                    <TabsTrigger value="month">By Month</TabsTrigger>
                    <TabsTrigger value="state" disabled>By State</TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data =
                        activeTab === "queue" ? queueSort.sorted
                        : activeTab === "did" ? didSort.sorted
                        : activeTab === "hour" ? hourSort.sorted
                        : activeTab === "day" ? daySort.sorted
                        : activeTab === "month" ? monthSort.sorted
                        : agentSort.sorted
                      exportToCSV(data, `distribution-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`)
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* ── BY QUEUE ─────────────────────────────────────────── */}
                <TabsContent value="queue">
                  {/* Task 4: viewport-height table */}
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["queue_name","Queue Name"],["channel","Channel"],["initiation_method","Method"],
                            ["received","Received"],["answered","Answered"],["unanswered","Unanswered"],
                            ["abandoned","Abandoned"],["transferred","Transferred"],["avg_wait","Avg Wait"],
                            ["avg_talk","Avg Talk"],["max_callers","Max Callers"],["%_answered","% Ans"],
                            ["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={queueSort.sortKey} sortDir={queueSort.sortDir} onSort={queueSort.handleSort} />
                          ))}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "queue" ? (
                          <LoadingRow cols={15} />
                        ) : queueSort.sorted.length === 0 ? (
                          <EmptyRow cols={15} label="No queues found." />
                        ) : (
                          <>
                            {queueSort.sorted.map((q) => (
                              <TableRow key={q.queue_id}>
                                <TableCell className="font-medium cursor-pointer text-primary hover:underline whitespace-nowrap" onClick={() => fetchDrilldown(q.queue_id, undefined, `Contact Details — ${q.queue_name || q.queue_id}`, q.queue_id)}>
                                  {q.queue_name || q.queue_id}
                                </TableCell>
                                <TableCell>{q.channel}</TableCell>
                                <TableCell>{q.initiation_method}</TableCell>
                                <TableCell>{q.received}</TableCell>
                                <TableCell>{q.answered}</TableCell>
                                <TableCell>{q.unanswered}</TableCell>
                                <TableCell>{q.abandoned}</TableCell>
                                <TableCell>{q.transferred}</TableCell>
                                <TableCell>{q.avg_wait || "—"}</TableCell>
                                <TableCell>{q.avg_talk || "—"}</TableCell>
                                <TableCell>{q.max_callers}</TableCell>
                                <TableCell>{q["%_answered"]}</TableCell>
                                <TableCell>{q["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{q.sla}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm" onClick={() => fetchDrilldown(q.queue_id, undefined, `Contact Details — ${q.queue_name || q.queue_id}`, q.queue_id)} disabled={loadingItemId === q.queue_id}>
                                    {loadingItemId === q.queue_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Details"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Task 8: totals row */}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>TOTAL</TableCell>
                              <TableCell>—</TableCell>
                              <TableCell>—</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(queueSort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(queueSort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(queueSort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{sumNumeric(queueSort.sorted, "max_callers")}</TableCell>
                              <TableCell>{avgNumeric(queueSort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(queueSort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(queueSort.sorted, "sla")}</TableCell>
                              <TableCell />
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY DID ───────────────────────────────────────────── */}
                <TabsContent value="did">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["did","Phone (DID)"],["channel","Channel"],["initiation_method","Method"],
                            ["received","Received"],["answered","Answered"],["unanswered","Unanswered"],
                            ["abandoned","Abandoned"],["transferred","Transferred"],["avg_wait","Avg Wait"],
                            ["avg_talk","Avg Talk"],["max_callers","Max Callers"],["%_answered","% Ans"],
                            ["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={didSort.sortKey} sortDir={didSort.sortDir} onSort={didSort.handleSort} />
                          ))}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "did" ? (
                          <LoadingRow cols={15} />
                        ) : didSort.sorted.length === 0 ? (
                          <EmptyRow cols={15} label="No DIDs found." />
                        ) : (
                          <>
                            {didSort.sorted.map((d, i) => (
                              <TableRow key={d.did + i}>
                                <TableCell className="font-mono cursor-pointer text-primary hover:underline" onClick={() => fetchDrilldown(undefined, d.did, `Contact Details — ${d.did}`, d.did)}>
                                  {d.did}
                                </TableCell>
                                <TableCell>{d.channel}</TableCell>
                                <TableCell>{d.initiation_method}</TableCell>
                                <TableCell>{d.received}</TableCell>
                                <TableCell>{d.answered}</TableCell>
                                <TableCell>{d.unanswered}</TableCell>
                                <TableCell>{d.abandoned}</TableCell>
                                <TableCell>{d.transferred}</TableCell>
                                <TableCell>{d.avg_wait || "—"}</TableCell>
                                <TableCell>{d.avg_talk || "—"}</TableCell>
                                <TableCell>{d.max_callers || "—"}</TableCell>
                                <TableCell>{d["%_answered"]}</TableCell>
                                <TableCell>{d["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{d.sla}</TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm" onClick={() => fetchDrilldown(undefined, d.did, `Contact Details — ${d.did}`, d.did)} disabled={loadingItemId === d.did}>
                                    {loadingItemId === d.did ? <Loader2 className="h-4 w-4 animate-spin" /> : "Details"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>TOTAL</TableCell>
                              <TableCell>—</TableCell>
                              <TableCell>—</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(didSort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(didSort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(didSort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{sumNumeric(didSort.sorted, "max_callers")}</TableCell>
                              <TableCell>{avgNumeric(didSort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(didSort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(didSort.sorted, "sla")}</TableCell>
                              <TableCell />
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY AGENT ─────────────────────────────────────────── */}
                <TabsContent value="agent">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["agent_name","Agent Name"],["region","Region"],["channel","Channel"],
                            ["initiation_method","Method"],["received","Received"],["completed","Completed"],
                            ["transferred","Transferred"],["%_calls","% Calls"],["talk_time","Talk Time"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={agentSort.sortKey} sortDir={agentSort.sortDir} onSort={agentSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "agent" ? (
                          <LoadingRow cols={9} />
                        ) : agentSort.sorted.length === 0 ? (
                          <EmptyRow cols={9} label="No agent data found." />
                        ) : (
                          <>
                            {agentSort.sorted.map((a, i) => (
                              <TableRow key={a.agent_id + i}>
                                <TableCell className="font-medium">{a.agent_name}</TableCell>
                                <TableCell>{a.region || "—"}</TableCell>
                                <TableCell>{a.channel}</TableCell>
                                <TableCell>{a.initiation_method}</TableCell>
                                <TableCell>{a.received}</TableCell>
                                <TableCell>{a.completed}</TableCell>
                                <TableCell>{a.transferred}</TableCell>
                                <TableCell>{a["%_calls"]}</TableCell>
                                <TableCell>{a.talk_time}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell>TOTAL</TableCell>
                              <TableCell>—</TableCell><TableCell>—</TableCell><TableCell>—</TableCell>
                              <TableCell>{sumNumeric(agentSort.sorted, "received")}</TableCell>
                              <TableCell>{sumNumeric(agentSort.sorted, "completed")}</TableCell>
                              <TableCell>{sumNumeric(agentSort.sorted, "transferred")}</TableCell>
                              <TableCell>{avgNumeric(agentSort.sorted, "%_calls")}</TableCell>
                              <TableCell>—</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY HOUR ──────────────────────────────────────────── */}
                <TabsContent value="hour">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["interval_date","Date"],["interval_hour","Hour"],["channel","Channel"],
                            ["initiation_method","Method"],["region","Region"],["received","Received"],
                            ["answered","Answered"],["unanswered","Unanswered"],["abandoned","Abandoned"],
                            ["transferred","Transferred"],["avg_wait","Avg Wait"],["avg_talk","Avg Talk"],
                            ["max_callers","Max Callers"],["%_answered","% Ans"],["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={hourSort.sortKey} sortDir={hourSort.sortDir} onSort={hourSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "hour" ? (
                          <LoadingRow cols={16} />
                        ) : hourSort.sorted.length === 0 ? (
                          <EmptyRow cols={16} label="No hourly data found." />
                        ) : (
                          <>
                            {hourSort.sorted.map((h, i) => (
                              <TableRow key={h.interval_date + h.interval_hour + i}>
                                <TableCell className="whitespace-nowrap">{h.interval_date || "—"}</TableCell>
                                <TableCell className="whitespace-nowrap font-medium">{h.interval_hour}</TableCell>
                                <TableCell>{h.channel}</TableCell>
                                <TableCell>{h.initiation_method}</TableCell>
                                <TableCell>{h.region || "—"}</TableCell>
                                <TableCell>{h.received}</TableCell>
                                <TableCell>{h.answered}</TableCell>
                                <TableCell>{h.unanswered}</TableCell>
                                <TableCell>{h.abandoned}</TableCell>
                                <TableCell>{h.transferred}</TableCell>
                                <TableCell>{h.avg_wait || "—"}</TableCell>
                                <TableCell>{h.avg_talk || "—"}</TableCell>
                                <TableCell>{h.max_callers || "—"}</TableCell>
                                <TableCell>{h["%_answered"]}</TableCell>
                                <TableCell>{h["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{h.sla}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={5}>TOTAL</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(hourSort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(hourSort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(hourSort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{sumNumeric(hourSort.sorted, "max_callers")}</TableCell>
                              <TableCell>{avgNumeric(hourSort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(hourSort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(hourSort.sorted, "sla")}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY DAY ───────────────────────────────────────────── */}
                <TabsContent value="day">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["interval_date","Date"],["channel","Channel"],["initiation_method","Method"],
                            ["region","Region"],["received","Received"],["answered","Answered"],
                            ["unanswered","Unanswered"],["abandoned","Abandoned"],["transferred","Transferred"],
                            ["avg_wait","Avg Wait"],["avg_talk","Avg Talk"],["max_callers","Max Callers"],
                            ["%_answered","% Ans"],["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={daySort.sortKey} sortDir={daySort.sortDir} onSort={daySort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "day" ? (
                          <LoadingRow cols={15} />
                        ) : daySort.sorted.length === 0 ? (
                          <EmptyRow cols={15} label="No daily data found." />
                        ) : (
                          <>
                            {daySort.sorted.map((d, i) => (
                              <TableRow key={(d.interval_date || "") + i}>
                                <TableCell className="whitespace-nowrap font-medium">{d.interval_date || "—"}</TableCell>
                                <TableCell>{d.channel}</TableCell>
                                <TableCell>{d.initiation_method}</TableCell>
                                <TableCell>{d.region || "—"}</TableCell>
                                <TableCell>{d.received}</TableCell>
                                <TableCell>{d.answered}</TableCell>
                                <TableCell>{d.unanswered}</TableCell>
                                <TableCell>{d.abandoned}</TableCell>
                                <TableCell>{d.transferred}</TableCell>
                                <TableCell>{d.avg_wait || "—"}</TableCell>
                                <TableCell>{d.avg_talk || "—"}</TableCell>
                                <TableCell>{d.max_callers || "—"}</TableCell>
                                <TableCell>{d["%_answered"]}</TableCell>
                                <TableCell>{d["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{d.sla}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={4}>TOTAL</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(daySort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(daySort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(daySort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{sumNumeric(daySort.sorted, "max_callers")}</TableCell>
                              <TableCell>{avgNumeric(daySort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(daySort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(daySort.sorted, "sla")}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY MONTH ─────────────────────────────────────────── */}
                <TabsContent value="month">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["month","Month"],["channel","Channel"],["initiation_method","Method"],
                            ["region","Region"],["received","Received"],["answered","Answered"],
                            ["unanswered","Unanswered"],["abandoned","Abandoned"],["transferred","Transferred"],
                            ["avg_wait","Avg Wait"],["avg_talk","Avg Talk"],["%_answered","% Ans"],
                            ["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={monthSort.sortKey} sortDir={monthSort.sortDir} onSort={monthSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "month" ? (
                          <LoadingRow cols={14} />
                        ) : monthSort.sorted.length === 0 ? (
                          <EmptyRow cols={14} label="No monthly data found." />
                        ) : (
                          <>
                            {monthSort.sorted.map((m, i) => (
                              <TableRow key={(m.month || m.interval_month || "") + i}>
                                <TableCell className="whitespace-nowrap font-medium">{m.month || m.interval_month || "—"}</TableCell>
                                <TableCell>{m.channel}</TableCell>
                                <TableCell>{m.initiation_method}</TableCell>
                                <TableCell>{m.region || "—"}</TableCell>
                                <TableCell>{m.received}</TableCell>
                                <TableCell>{m.answered}</TableCell>
                                <TableCell>{m.unanswered}</TableCell>
                                <TableCell>{m.abandoned}</TableCell>
                                <TableCell>{m.transferred}</TableCell>
                                <TableCell>{m.avg_wait || "—"}</TableCell>
                                <TableCell>{m.avg_talk || "—"}</TableCell>
                                <TableCell>{m["%_answered"]}</TableCell>
                                <TableCell>{m["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{m.sla}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={4}>TOTAL</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(monthSort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(monthSort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(monthSort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{avgNumeric(monthSort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(monthSort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(monthSort.sorted, "sla")}</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* ── BY STATE ─────────────────────────────────────────── */}
                <TabsContent value="state">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[
                            ["state","State"],["region","Region"],["channel","Channel"],["initiation_method","Method"],
                            ["received","Received"],["answered","Answered"],["unanswered","Unanswered"],
                            ["abandoned","Abandoned"],["transferred","Transferred"],["avg_wait","Avg Wait"],
                            ["avg_talk","Avg Talk"],["%_answered","% Ans"],["%_unanswered","% Unans"],["sla","SLA"],
                          ].map(([col, label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={stateSort.sortKey} sortDir={stateSort.sortDir} onSort={stateSort.handleSort} />
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "state" ? (
                          <LoadingRow cols={14} />
                        ) : stateSort.sorted.length === 0 ? (
                          <EmptyRow cols={14} label="No state data found." />
                        ) : (
                          <>
                            {stateSort.sorted.map((s, i) => (
                              <TableRow key={(s.state || "") + i}>
                                <TableCell className="whitespace-nowrap font-medium capitalize">{s.state || "—"}</TableCell>
                                <TableCell>{s.region || "—"}</TableCell>
                                <TableCell>{s.channel}</TableCell>
                                <TableCell>{s.initiation_method}</TableCell>
                                <TableCell>{s.received}</TableCell>
                                <TableCell>{s.answered}</TableCell>
                                <TableCell>{s.unanswered}</TableCell>
                                <TableCell>{s.abandoned}</TableCell>
                                <TableCell>{s.transferred}</TableCell>
                                <TableCell>{s.avg_wait || "—"}</TableCell>
                                <TableCell>{s.avg_talk || "—"}</TableCell>
                                <TableCell>{s["%_answered"]}</TableCell>
                                <TableCell>{s["%_unanswered"]}</TableCell>
                                <TableCell className="font-medium">{s.sla}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-semibold">
                              <TableCell colSpan={4}>TOTAL</TableCell>
                              {numericCols.map((c) => <TableCell key={c}>{sumNumeric(stateSort.sorted, c)}</TableCell>)}
                              <TableCell>{avgNumeric(stateSort.sorted, "avg_wait")}</TableCell>
                              <TableCell>{avgNumeric(stateSort.sorted, "avg_talk")}</TableCell>
                              <TableCell>{avgNumeric(stateSort.sorted, "%_answered")}</TableCell>
                              <TableCell>{avgNumeric(stateSort.sorted, "%_unanswered")}</TableCell>
                              <TableCell>{avgNumeric(stateSort.sorted, "sla")}</TableCell>
                            </TableRow>
                          </>
                        )}
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
