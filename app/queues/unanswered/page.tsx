"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
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

interface UnansweredByQueueRow {
  queue_id: string
  queue_name: string
  channel: string
  initiation_method: string
  region: string
  received: string
  unanswered: string
  abandoned: string
  "%_calls": string
}

interface UnansweredByDIDRow {
  did: string
  channel: string
  initiation_method: string
  region: string
  received: string
  unanswered: string
  abandoned: string
  "%_calls": string
}

interface DrilldownData {
  row_no: string
  did: string
  contact_id: string
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
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                    */
/* -------------------------------------------------------------------------- */

function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return
  const headers = Object.keys(data[0]).join(",")
  const rows = data.map((row) =>
    Object.values(row).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
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
      const an = parseFloat(av); const bn = parseFloat(bv)
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

function SortHead({ col, label, sortKey, sortDir, onSort, className }: {
  col: string; label: string; sortKey: string | null; sortDir: SortDir; onSort: (k: string) => void; className?: string
}) {
  return (
    <TableHead className={cn("cursor-pointer select-none whitespace-nowrap", className)} onClick={() => onSort(col)}>
      {label}
      {sortKey !== col ? <ChevronsUpDown className="ml-1 h-3 w-3 opacity-40 inline-block" />
        : sortDir === "asc" ? <ChevronUp className="ml-1 h-3 w-3 inline-block" />
        : <ChevronDown className="ml-1 h-3 w-3 inline-block" />}
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
    .btn { padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
    .btn:hover { background:#2563eb; }
    .table-container { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; }
    th { background:#f9fafb; padding:11px 16px; text-align:left; font-size:11px; font-weight:600; color:#374151; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
    td { padding:11px 16px; font-size:13px; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
    tr:hover { background:#f9fafb; }
    .mono { font-family:ui-monospace,SFMono-Regular,monospace; font-size:12px; }
    .status-abandoned { color:#dc2626; font-weight:500; }
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
          <th>Contact ID</th><th>Date</th><th>Queue</th><th>Region</th>
          <th>Customer</th><th>DID</th><th>Channel</th><th>Method</th>
          <th>Status</th><th>Event</th><th>Agent Conn.</th><th>Ring Time</th><th>Wait Time</th>
        </tr></thead>
        <tbody>
          ${data.length > 0
            ? data.map((r) => `<tr>
              <td class="mono">${r.contact_id || "—"}</td>
              <td>${r.date || "—"}</td>
              <td>${r.queue_name || "—"}</td>
              <td>${r.region || "—"}</td>
              <td class="mono">${r.customer_number || "—"}</td>
              <td class="mono">${r.did || "—"}</td>
              <td>${r.channel || "—"}</td>
              <td>${r.initiation_method || "—"}</td>
              <td class="status-abandoned">${r.interaction_status || "—"}</td>
              <td>${r.event || "—"}</td>
              <td>${r.agent_connection_attempts || "—"}</td>
              <td>${r.ring_time || "—"}</td>
              <td>${r.wait_time || "—"}</td>
            </tr>`).join("")
            : '<tr><td colspan="13" class="empty">No unanswered calls found.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  </div>
  <script>
    function exportCSV() {
      const rows = Array.from(document.querySelectorAll('#t tr'))
      const csv = rows.map(r => Array.from(r.querySelectorAll('th,td')).map(c => '"' + c.textContent.trim().replace(/"/g,'""') + '"').join(',')).join('\\n')
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: 'unanswered-drilldown.csv' })
      a.click()
    }
  </script>
</body></html>`
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export default function UnansweredCallsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedSearchTerm: searchTerm,
    appliedQueues: selectedQueues,
    appliedDids: selectedDids,
    applyVersion,
  } = useGlobalFilters()

  // Refs so fetchTab always reads the LATEST filter values (avoids stale closure)
  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const queuesRef = useRef(selectedQueues)
  const didsRef = useRef(selectedDids)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { queuesRef.current = selectedQueues }, [selectedQueues])
  useEffect(() => { didsRef.current = selectedDids }, [selectedDids])

  const [activeTab, setActiveTab] = useState("queue")

  const [queueData, setQueueData] = useState<UnansweredByQueueRow[]>([])
  const [didData, setDidData] = useState<UnansweredByDIDRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
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
    const didFilter = didsRef.current.length > 0 ? didsRef.current : undefined
    try {
      let result: any
      if (tab === "queue") result = await athenaAPI.getUnansweredByQueue(start, end, null, user?.email, queueFilter, didFilter)
      else if (tab === "did") result = await athenaAPI.getUnansweredByDID(start, end, null, user?.email, queueFilter, didFilter)
      else return

      if (result?.status === "SUCCEEDED") {
        if (tab === "queue") setQueueData(result.data)
        else if (tab === "did") setDidData(result.data)
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
      setLoaded({})
      setQueueData([]); setDidData([])
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

  const fetchDrilldown = async (filters: { queueId?: string; did?: string }, title: string, itemId: string) => {
    setLoadingItemId(itemId)
    try {
      const { start, end } = getDateRange()
      const apiFilters: any = {}
      if (filters.queueId) apiFilters.queueId = [filters.queueId]
      if (filters.did) apiFilters.did = [filters.did]
      const result = await athenaAPI.getUnansweredDrilldown(start, end, apiFilters, null, user?.email)
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

  const filteredQueues = useMemo(
    () => searchTerm ? queueData.filter((q) => (q.queue_name || q.queue_id).toLowerCase().includes(searchTerm.toLowerCase())) : queueData,
    [queueData, searchTerm]
  )
  const filteredDIDs = useMemo(
    () => searchTerm ? didData.filter((d) => d.did?.toLowerCase().includes(searchTerm.toLowerCase())) : didData,
    [didData, searchTerm]
  )

  const queueSort = useSortable(filteredQueues)
  const didSort = useSortable(filteredDIDs)

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

  const currentData = activeTab === "queue" ? queueSort.sorted : didSort.sorted

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unanswered Calls</h1>
            <p className="text-muted-foreground">Unanswered and abandoned call analysis by queue and DID</p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="queue">By Queue</TabsTrigger>
                    <TabsTrigger value="did">By DID</TabsTrigger>
                  </TabsList>
                  <Button variant="outline" size="sm" onClick={() => exportToCSV(currentData, `unanswered-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* By Queue */}
                <TabsContent value="queue">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[["queue_name","Queue"],["channel","Channel"],["initiation_method","Method"],["region","Region"],["received","Received"],["unanswered","Unanswered"],["abandoned","Abandoned"],["%_calls","% Calls"]].map(([col,label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={queueSort.sortKey} sortDir={queueSort.sortDir} onSort={queueSort.handleSort} />
                          ))}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "queue" ? <LoadingRow cols={9} />
                        : queueSort.sorted.length === 0 ? <EmptyRow cols={9} label="No queue data found." />
                        : <>
                          {queueSort.sorted.map((q) => (
                            <TableRow key={q.queue_id}>
                              <TableCell className="font-medium cursor-pointer text-primary hover:underline whitespace-nowrap" onClick={() => fetchDrilldown({ queueId: q.queue_id }, `Unanswered Calls — ${q.queue_name || q.queue_id}`, q.queue_id)}>
                                {q.queue_name || q.queue_id}
                              </TableCell>
                              <TableCell>{q.channel}</TableCell>
                              <TableCell>{q.initiation_method}</TableCell>
                              <TableCell>{q.region || "—"}</TableCell>
                              <TableCell>{q.received}</TableCell>
                              <TableCell className="text-red-600 font-mono">{q.unanswered}</TableCell>
                              <TableCell className="text-orange-600 font-mono">{q.abandoned}</TableCell>
                              <TableCell>{q["%_calls"]}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => fetchDrilldown({ queueId: q.queue_id }, `Unanswered Calls — ${q.queue_name || q.queue_id}`, q.queue_id)} disabled={loadingItemId === q.queue_id}>
                                  {loadingItemId === q.queue_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Details"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>TOTAL</TableCell>
                            <TableCell>{sumNumeric(queueSort.sorted, "received")}</TableCell>
                            <TableCell>{sumNumeric(queueSort.sorted, "unanswered")}</TableCell>
                            <TableCell>{sumNumeric(queueSort.sorted, "abandoned")}</TableCell>
                            <TableCell>{avgNumeric(queueSort.sorted, "%_calls")}</TableCell>
                            <TableCell />
                          </TableRow>
                        </>}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* By DID */}
                <TabsContent value="did">
                  <div className="rounded-md border overflow-x-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          {[["did","DID"],["channel","Channel"],["initiation_method","Method"],["region","Region"],["received","Received"],["unanswered","Unanswered"],["abandoned","Abandoned"],["%_calls","% Calls"]].map(([col,label]) => (
                            <SortHead key={col} col={col} label={label} sortKey={didSort.sortKey} sortDir={didSort.sortDir} onSort={didSort.handleSort} />
                          ))}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && activeTab === "did" ? <LoadingRow cols={9} />
                        : didSort.sorted.length === 0 ? <EmptyRow cols={9} label="No DID data found." />
                        : <>
                          {didSort.sorted.map((d, i) => (
                            <TableRow key={d.did + i}>
                              <TableCell className="font-mono cursor-pointer text-primary hover:underline" onClick={() => fetchDrilldown({ did: d.did }, `Unanswered Calls — ${d.did}`, d.did)}>
                                {d.did}
                              </TableCell>
                              <TableCell>{d.channel}</TableCell>
                              <TableCell>{d.initiation_method}</TableCell>
                              <TableCell>{d.region || "—"}</TableCell>
                              <TableCell>{d.received}</TableCell>
                              <TableCell className="text-red-600 font-mono">{d.unanswered}</TableCell>
                              <TableCell className="text-orange-600 font-mono">{d.abandoned}</TableCell>
                              <TableCell>{d["%_calls"]}</TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm" onClick={() => fetchDrilldown({ did: d.did }, `Unanswered Calls — ${d.did}`, d.did)} disabled={loadingItemId === d.did}>
                                  {loadingItemId === d.did ? <Loader2 className="h-4 w-4 animate-spin" /> : "Details"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={4}>TOTAL</TableCell>
                            <TableCell>{sumNumeric(didSort.sorted, "received")}</TableCell>
                            <TableCell>{sumNumeric(didSort.sorted, "unanswered")}</TableCell>
                            <TableCell>{sumNumeric(didSort.sorted, "abandoned")}</TableCell>
                            <TableCell>{avgNumeric(didSort.sorted, "%_calls")}</TableCell>
                            <TableCell />
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
