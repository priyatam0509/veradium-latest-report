"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Calendar, RefreshCw, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { exportToCSV } from "@/lib/csv-export"
import { useSortable, SortHead } from "@/lib/sort-table"

interface AgentData {
  agent_id: string
  agent_name: string
  region: string
  answered: string
  outbound: string
  completed_by_caller: string
  completed_by_agent: string
  transferred_out: string
  missed: string
  rejected: string
  failed: string
}

interface DrilldownData {
  row_no: string;
  did: string;
  contact_id: string;
  agent_name: string;
  date: string;
  queue_name: string;
  region: string;
  customer_number: string;
  channel: string;
  initiation_method: string;
  interaction_status: string;
  agent_connection_attempts: string;
  event: string;
  ring_time: string;
  wait_time: string;
  talk_time: string;
}

export default function AgentPerformancePage() {
  const [agentData, setAgentData] = useState<AgentData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQueue, setSelectedQueue] = useState<string>("ALL")

  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      fetchAgentData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  const fetchAgentData = async (queueFilter: string = "ALL") => {
    setIsLoading(true)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      const result = await athenaAPI.getAgentCallDisposition(
        dateRange.start,
        dateRange.end,
        user?.email,
        undefined,   // agentIds
        queueFilter === "ALL" ? undefined : [queueFilter],
        null         // region
      )
      
      if (result.status === 'SUCCEEDED') {
        setAgentData(result.data)
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("Agent data fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgentDrilldown = async (agentId: string, agentName: string) => {
    setLoadingAgentId(agentId)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      const result = await athenaAPI.getAnsweredDrilldown(
        dateRange.start,
        dateRange.end,
        { agentId: [agentId] },
        null,        // region
        user?.email  // username
      )
      
      if (result.status === 'SUCCEEDED') {
        // Open in new tab
        const title = `${agentName}'s Calls`
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(generateDrilldownHTML(result.data, title, startDate, endDate))
          newWindow.document.close()
        }
        
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("Drilldown fetch error:", error)
    } finally {
      setLoadingAgentId(null)
    }
  }

  // Generate HTML for drilldown in new tab
  const generateDrilldownHTML = (data: DrilldownData[], title: string, startDate?: Date, endDate?: Date) => {
    const dateRangeText = startDate && endDate 
      ? `From ${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}`
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 20px;
      background-color: #f9fafb;
      color: #1f2937;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .count {
      font-size: 14px;
      color: #6b7280;
    }
    .search-box { padding:8px 12px; border:1px solid #d1d5db; border-radius:6px; font-size:14px; width:280px; outline:none; }
    .search-box:focus { border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,.15); }
    .btn {
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn:hover {
      background-color: #2563eb;
    }
    .table-container {
      overflow: auto;
      height: calc(100vh - 200px);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #f9fafb;
      padding: 12px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }
    tr:hover {
      background-color: #f9fafb;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
    }
    .empty {
      padding: 48px;
      text-align: center;
      color: #9ca3af;
    }
    @media print {
      body {
        background: white;
      }
      .btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p class="subtitle">Contact-level details${dateRangeText ? ` - ${dateRangeText}` : ''}</p>
    </div>
    
    <div class="actions">
      <div class="count" id="rowCount">Showing ${data.length} call${data.length !== 1 ? 's' : ''}</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" class="search-box" id="searchInput" placeholder="Search contacts..." oninput="filterTable()" />
        <button class="btn" onclick="exportToCSV()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export CSV
        </button>
      </div>
    </div>
    
    <div class="table-container">
      <table id="dataTable">
        <thead style="position:sticky;top:0;z-index:1;">
          <tr>
            <th>DID</th>
            <th>Contact ID</th>
            <th>Agent Name</th>
            <th>Date</th>
            <th>Queue</th>
            <th>Region</th>
            <th>Customer</th>
            <th>Channel</th>
            <th>Initiation Method</th>
            <th>Status</th>
            <th>Agent Conn. Attempts</th>
            <th>Event</th>
            <th>Ring Time</th>
            <th>Wait Time</th>
            <th>Talk Time</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.map(contact => `
            <tr>
              <td class="font-mono">${contact.did || '-'}</td>
              <td class="font-mono" style="font-size: 12px;">${contact.contact_id || '-'}</td>
              <td>${contact.agent_name || '-'}</td>
              <td>${contact.date || '-'}</td>
              <td>${contact.queue_name || '-'}</td>
              <td>${contact.region || '-'}</td>
              <td class="font-mono">${contact.customer_number || '-'}</td>
              <td>${contact.channel || '-'}</td>
              <td>${contact.initiation_method || '-'}</td>
              <td>${contact.interaction_status || '-'}</td>
              <td>${contact.agent_connection_attempts || '-'}</td>
              <td>${contact.event || '-'}</td>
              <td>${contact.ring_time || '-'}</td>
              <td>${contact.wait_time || '-'}</td>
              <td>${contact.talk_time || '-'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="15" class="empty">No calls found.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    function exportToCSV() {
      const table = document.getElementById('dataTable');
      const rows = Array.from(table.querySelectorAll('tr'));

      const csv = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
          const v = cell.textContent.trim();
          if (v === '—' || v === '') return '""';
          if (/^\\d{4}-\\d{2}-\\d{2}/.test(v) || v.startsWith('+')) return '="' + v.replace(/"/g, '""') + '"';
          return '"' + v.replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\\n');

      const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-calls-${new Date().toISOString().slice(0, 10)}.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
    function filterTable() {
      var term = document.getElementById('searchInput').value.toLowerCase()
      var rows = document.querySelectorAll('#dataTable tbody tr')
      var visible = 0
      rows.forEach(function(row) {
        var text = row.textContent.toLowerCase()
        var show = !term || text.indexOf(term) > -1
        row.style.display = show ? '' : 'none'
        if (show) visible++
      })
      document.getElementById('rowCount').textContent = 'Showing ' + visible + ' call' + (visible !== 1 ? 's' : '')
    }
  </script>
</body>
</html>
    `;
  }

  const handleViewAgentDetails = (agent: AgentData) => {
    fetchAgentDrilldown(agent.agent_id, agent.agent_name)
  }

  const handleApplyFilter = () => {
    fetchAgentData(selectedQueue)
  }

  const handleResetFilter = () => {
    setStartDate(subDays(new Date(), 30))
    setEndDate(new Date())
    setSelectedQueue("ALL")
    setTimeout(() => fetchAgentData("ALL"), 0)
  }

  const handleQueueFilterChange = (value: string) => {
    setSelectedQueue(value)
    fetchAgentData(value)
  }


  const filteredAgents = agentData.filter((agent) =>
    agent.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.agent_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sort = useSortable(filteredAgents)

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agent Performance Matrix</h1>
              <p className="text-muted-foreground">View and analyze agent metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchAgentData(selectedQueue)} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => exportToCSV(filteredAgents, 'agent-performance.csv')} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Date Range Filter</CardTitle>
              <CardDescription>Select a date range to filter agent performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={startDate} onSelect={(date) => { setStartDate(date); setIsStartDateOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={endDate} onSelect={(date) => { setEndDate(date); setIsEndDateOpen(false) }} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* <div className="space-y-2">
                  <label className="text-sm font-medium">Queue Filter</label>
                  <Select value={selectedQueue} onValueChange={handleQueueFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select queue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Queues</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <div className="flex gap-2">
                    <Button onClick={handleApplyFilter} className="flex-1" disabled={isLoading}>
                      Apply Filter
                    </Button>
                    <Button onClick={handleResetFilter} variant="outline" disabled={isLoading}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Table</CardTitle>
              <CardDescription>
                {isLoading ? "Loading agent data..." : `Showing ${filteredAgents.length} agent${filteredAgents.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by agent name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((agent, index) => (
                        <TableRow key={index}>
                          <TableCell
                            className="font-medium cursor-pointer text-primary hover:underline"
                            onClick={() => handleViewAgentDetails(agent)}
                          >
                            {loadingAgentId === agent.agent_id ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                            {agent.agent_name}
                          </TableCell>
                          <TableCell className="text-right">{agent.region || '—'}</TableCell>
                          <TableCell className="text-right text-green-600">{agent.answered}</TableCell>
                          <TableCell className="text-right text-blue-600">{agent.outbound}</TableCell>
                          <TableCell className="text-right">{agent.completed_by_caller}</TableCell>
                          <TableCell className="text-right">{agent.completed_by_agent}</TableCell>
                          <TableCell className="text-right">{agent.transferred_out}</TableCell>
                          <TableCell className="text-right text-orange-600">{agent.missed}</TableCell>
                          <TableCell className="text-right text-red-800">{agent.rejected}</TableCell>
                          <TableCell className="text-right text-red-600">{agent.failed}</TableCell>
                        </TableRow>
                      ))}
                      {filteredAgents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground">
                            No agent data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}