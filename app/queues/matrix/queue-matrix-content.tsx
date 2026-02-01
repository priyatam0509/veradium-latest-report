"use client"
// Utility function to export data as CSV
function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Calendar, RefreshCw, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"

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
  did: string;
  channel: string;
  initiation_method: string;
  received: string;
  answered: string;
  unanswered: string;
  abandoned: string;
  transferred: string;
  avg_wait: string;
  avg_talk: string;
  max_callers: string;
  "%_answered": string;
  "%_unanswered": string;
  sla: string;
}

interface HourData {
  interval_hour: string
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

interface DrilldownData {
  did: string;
  contact_id: string;
  agent_name: string;
  date: string;
  queue_name: string;
  customer_number: string;
  channel: string;
  initiation_method: string;
  interation_status: string;
  agent_connection_attempts: string;
  event: string;
  ring_time: string;
  wait_time: string;
  talk_time: string;
}

export default function QueueMatrixContent() {
  const [queueData, setQueueData] = useState<QueueData[]>([])
  const [didData, setDidData] = useState<DIDData[]>([])
  const [hourData, setHourData] = useState<HourData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("queue")
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const { toast } = useToast()

  // Date filter state
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  // Load queue summary data
  const fetchQueueData = async () => {
    console.log("🔵 fetchQueueData called")
    setIsLoading(true)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      console.log("📅 Date range:", dateRange)
      console.log("🌐 Calling API: distribution_distbyqueue")

      const result = await athenaAPI.getDistributionByQueue(dateRange.start, dateRange.end)
      
      console.log("📦 API Result:", {
        status: result.status,
        rowCount: result.rowCount,
        dataLength: result.data?.length,
        columns: result.columns,
        sampleData: result.data?.[0]
      })
      
      if (result.status === 'SUCCEEDED') {
        console.log("✅ Setting queue data:", result.data)
        setQueueData(result.data)
        toast({
          title: "Data loaded successfully",
          description: `Showing ${result.rowCount} queue${result.rowCount !== 1 ? 's' : ''}`,
        })
      } else {
        console.error("❌ Query status not SUCCEEDED:", result.status)
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("❌ Queue data fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load queue data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
      console.log("🔵 fetchQueueData completed")
    }
  }

  // Load DID data
  const fetchDIDData = async () => {
    setIsLoading(true)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      const result = await athenaAPI.getDistributionByDID(dateRange.start, dateRange.end)
      
      if (result.status === 'SUCCEEDED') {
        setDidData(result.data)
        toast({
          title: "DID data loaded successfully",
          description: `Showing ${result.rowCount} phone number${result.rowCount !== 1 ? 's' : ''}`,
        })
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("DID data fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load DID data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load hourly data
  const fetchHourData = async () => {
    console.log("🔵 fetchHourData called")
    setIsLoading(true)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate || new Date()),
        end: DateHelper.formatDateFromDate(startDate || new Date(), true)
      }

      console.log("📅 Hourly date range:", dateRange)
      console.log("🌐 Calling API: distribution_distbyhour")

      const result = await athenaAPI.getDistributionByHour(dateRange.start, dateRange.end)
      
      console.log("📦 Hourly API Result:", {
        status: result.status,
        rowCount: result.rowCount,
        dataLength: result.data?.length,
        columns: result.columns,
        sampleData: result.data?.[0]
      })
      
      if (result.status === 'SUCCEEDED') {
        console.log("✅ Setting hourly data:", result.data)
        setHourData(result.data)
        toast({
          title: "Hourly data loaded successfully",
          description: `Showing ${result.rowCount} hour${result.rowCount !== 1 ? 's' : ''}`,
        })
      } else {
        console.error("❌ Query status not SUCCEEDED:", result.status)
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("❌ Hour data fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load hourly data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
      console.log("🔵 fetchHourData completed")
    }
  }

  // Load drilldown data
  const fetchDrilldownData = async (queueId?: string, did?: string, title?: string, itemId?: string) => {
    setLoadingItemId(itemId || null)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      const filters: any = {}
      if (queueId) filters.queueId = [queueId]
      if (did) filters.did = [did]

      const result = await athenaAPI.getDistributionDrilldown(
        dateRange.start,
        dateRange.end,
        filters
      )
      
      if (result.status === 'SUCCEEDED') {
        // Open in new tab
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(generateDrilldownHTML(result.data, title || 'Contact Details', startDate, endDate))
          newWindow.document.close()
        }
        
        toast({
          title: "Contact details loaded",
          description: `Found ${result.rowCount} contact${result.rowCount !== 1 ? 's' : ''}`,
        })
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("Drilldown data fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load contact details",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoadingItemId(null)
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
      overflow-x: auto;
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
      <div class="count">Showing ${data.length} contact${data.length !== 1 ? 's' : ''}</div>
      <button class="btn" onclick="exportToCSV()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export CSV
      </button>
    </div>
    
    <div class="table-container">
      <table id="dataTable">
        <thead>
          <tr>
            <th>DID</th>
            <th>Contact ID</th>
            <th>Agent Name</th>
            <th>Date</th>
            <th>Queue</th>
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
              <td class="font-mono">${contact.customer_number || '-'}</td>
              <td>${contact.channel || '-'}</td>
              <td>${contact.initiation_method || '-'}</td>
              <td>${contact.interation_status || '-'}</td>
              <td>${contact.agent_connection_attempts || '-'}</td>
              <td>${contact.event || '-'}</td>
              <td>${contact.ring_time || '-'}</td>
              <td>${contact.wait_time || '-'}</td>
              <td>${contact.talk_time || '-'}</td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="14" class="empty">No contacts found.</td>
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
          const text = cell.textContent.trim();
          return '"' + text.replace(/"/g, '""') + '"';
        }).join(',');
      }).join('\\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contact-details-${new Date().toISOString().slice(0, 10)}.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>
    `;
  }

  // Initial load
  useEffect(() => {
    fetchQueueData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'queue' && queueData.length === 0) {
      fetchQueueData()
    } else if (activeTab === 'did' && didData.length === 0) {
      fetchDIDData()
    } else if (activeTab === 'hour' && hourData.length === 0) {
      fetchHourData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const filteredQueues = queueData.filter((queue) => 
    queue.queue_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    queue.queue_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredDIDs = didData.filter((did) => 
    did.did?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredHours = hourData.filter((hour) => 
    hour.interval_hour?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hour.channel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hour.initiation_method?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewQueueDetails = (queue: QueueData) => {
    const title = `Contact Details - ${queue.queue_name || queue.queue_id}`
    fetchDrilldownData(queue.queue_id, undefined, title, queue.queue_id)
  }

  const handleViewDIDDetails = (didItem: DIDData) => {
    const title = `Contact Details - ${didItem.did}`
    fetchDrilldownData(undefined, didItem.did, title, didItem.did)
  }

  const handleApplyFilter = () => {
    if (activeTab === 'queue') {
      fetchQueueData()
    } else if (activeTab === 'did') {
      fetchDIDData()
    } else if (activeTab === 'hour') {
      fetchHourData()
    }
  }

  const handleResetFilter = () => {
    setStartDate(subDays(new Date(), 30))
    setEndDate(new Date())
    setSearchTerm("")
    // Optionally reset other filters if present
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Main content starts here */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Queue Performance Matrix</CardTitle>
                <CardDescription>
                  {startDate && endDate && (
                    <span className="block mt-1 text-xs">
                      Showing data from {format(startDate, "MMM dd, yyyy")} to {format(endDate, "MMM dd, yyyy")}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (activeTab === 'queue') exportToCSV(filteredQueues, 'queue-data.csv')
                    else if (activeTab === 'did') exportToCSV(filteredDIDs, 'did-data.csv')
                    else if (activeTab === 'hour') exportToCSV(filteredHours, 'hourly-data.csv')
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Date Filter Section */}
            <div className="flex flex-wrap gap-3 mt-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setIsStartDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setIsEndDateOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={handleApplyFilter} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Apply Filter
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={handleResetFilter}>
                Reset
              </Button>
            </div>
          </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="queue">By Queue</TabsTrigger>
                  <TabsTrigger value="did">By Phone Number (DID)</TabsTrigger>
                  <TabsTrigger value="hour">By Hour</TabsTrigger>
                </TabsList>

                {/* Queue Tab */}
                <TabsContent value="queue" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading queue data...
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Queue Name</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Answered</TableHead>
                            <TableHead>Unanswered</TableHead>
                            <TableHead>Abandoned</TableHead>
                            <TableHead>Transferred</TableHead>
                            <TableHead>Avg Wait</TableHead>
                            <TableHead>Avg Talk</TableHead>
                            <TableHead>Max Callers</TableHead>
                            <TableHead>% Answered</TableHead>
                            <TableHead>% Unanswered</TableHead>
                            <TableHead>SLA</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredQueues.map((queue) => (
                            <TableRow key={queue.queue_id}>
                              <TableCell 
                                className="font-medium cursor-pointer text-primary hover:underline"
                                onClick={() => handleViewQueueDetails(queue)}
                              >
                                {queue.queue_name || queue.queue_id}
                              </TableCell>
                              <TableCell>{queue.channel}</TableCell>
                              <TableCell>{queue.initiation_method}</TableCell>
                              <TableCell>{queue.received}</TableCell>
                              <TableCell>{queue.answered}</TableCell>
                              <TableCell>{queue.unanswered}</TableCell>
                              <TableCell>{queue.abandoned}</TableCell>
                              <TableCell>{queue.transferred}</TableCell>
                              <TableCell>{queue.avg_wait || "-"}</TableCell>
                              <TableCell>{queue.avg_talk || "-"}</TableCell>
                              <TableCell>{queue.max_callers}</TableCell>
                              <TableCell>{queue["%_answered"]}</TableCell>
                              <TableCell>{queue["%_unanswered"]}</TableCell>
                              <TableCell className="font-medium">{queue.sla}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewQueueDetails(queue)}
                                  disabled={loadingItemId === queue.queue_id}
                                >
                                  {loadingItemId === queue.queue_id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    'View Details'
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredQueues.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={15} className="h-24 text-center text-muted-foreground">
                                No queues found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* DID Tab */}
                <TabsContent value="did" className="mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading DID data...
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Phone Number (DID)</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Answered</TableHead>
                            <TableHead>Unanswered</TableHead>
                            <TableHead>Abandoned</TableHead>
                            <TableHead>Avg Wait</TableHead>
                            <TableHead>Avg Talk</TableHead>
                            <TableHead>% Answered</TableHead>
                            <TableHead>SLA</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDIDs.map((did, index) => (
                            <TableRow key={did.did + index}>
                              <TableCell 
                                className="font-mono cursor-pointer text-primary hover:underline"
                                onClick={() => handleViewDIDDetails(did)}
                              >
                                {did.did}
                              </TableCell>
                              <TableCell>{did.channel}</TableCell>
                              <TableCell>{did.initiation_method}</TableCell>
                              <TableCell>{did.received}</TableCell>
                              <TableCell>{did.answered}</TableCell>
                              <TableCell>{did.unanswered}</TableCell>
                              <TableCell>{did.abandoned}</TableCell>
                              <TableCell>{did.avg_wait || "-"}</TableCell>
                              <TableCell>{did.avg_talk || "-"}</TableCell>
                              <TableCell>{did["%_answered"]}</TableCell>
                              <TableCell className="font-medium">{did.sla}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewDIDDetails(did)}
                                  disabled={loadingItemId === did.did}
                                >
                                  {loadingItemId === did.did ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    'View Details'
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredDIDs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                                No phone numbers found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                {/* Hour Tab */}
                <TabsContent value="hour" className="mt-4">
                  <div className="mb-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
                    Note: Hourly breakdown shows data for the selected start date only.
                  </div>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading hourly data...
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time Interval</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Received</TableHead>
                            <TableHead>Answered</TableHead>
                            <TableHead>Unanswered</TableHead>
                            <TableHead>Abandoned</TableHead>
                            <TableHead>Transferred</TableHead>
                            <TableHead>Avg Wait</TableHead>
                            <TableHead>Avg Talk</TableHead>
                            <TableHead>Max Callers</TableHead>
                            <TableHead>% Answered</TableHead>
                            <TableHead>% Unanswered</TableHead>
                            <TableHead>SLA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredHours.map((hour, index) => (
                            <TableRow key={hour.interval_hour + index}>
                              <TableCell className="font-medium text-sm whitespace-nowrap">{hour.interval_hour}</TableCell>
                              <TableCell>{hour.channel}</TableCell>
                              <TableCell>{hour.initiation_method}</TableCell>
                              <TableCell>{hour.received}</TableCell>
                              <TableCell>{hour.answered}</TableCell>
                              <TableCell>{hour.unanswered}</TableCell>
                              <TableCell>{hour.abandoned}</TableCell>
                              <TableCell>{hour.transferred}</TableCell>
                              <TableCell>{hour.avg_wait || "-"}</TableCell>
                              <TableCell>{hour.avg_talk || "-"}</TableCell>
                              <TableCell>{hour.max_callers || "-"}</TableCell>
                              <TableCell>{hour["%_answered"]}</TableCell>
                              <TableCell>{hour["%_unanswered"]}</TableCell>
                              <TableCell className="font-medium">{hour.sla}</TableCell>
                            </TableRow>
                          ))}
                          {filteredHours.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                                No hourly data found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
      </DashboardLayout>
    </AuthGuard>
  )
}