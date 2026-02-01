"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Calendar, RefreshCw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays, parse } from "date-fns"
import { cn } from "@/lib/utils"

interface QueueData {
  queue_id: string
  channel: string
  initiation_method: string
  received: string
  answered: string
  unanswered: string
  abandoned: string
  transferred: string
  avg_wait_s: string
  avg_talk: string
  max_callers: string
  "%_answered": string
  "%_unanswered": string
  sla: string
}

interface QueueDetailData {
  row_no: string
  contact_id: string
  agent: string
  date: string
  queue: string
  number: string
  event: string
  ring_time: string
  wait_time: string
  talk_time: string
  DID: string
}

interface APIResponse<T> {
  queryExecutionId: string
  status: string
  executionTime: number
  data: T[]
  columns: string[]
  rowCount: number
}

const API_ENDPOINT = "https://i2831zjef8.execute-api.us-east-1.amazonaws.com/prod/query"

export default function QueueDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queueId = params?.queueId as string
  
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [detailData, setDetailData] = useState<QueueDetailData[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const { toast } = useToast()

  // Initialize dates from URL params or use defaults
  const getInitialDate = (paramName: string, defaultDate: Date) => {
    const paramValue = searchParams?.get(paramName)
    if (paramValue) {
      try {
        return parse(paramValue, "yyyy-MM-dd", new Date())
      } catch {
        return defaultDate
      }
    }
    return defaultDate
  }

  const [startDate, setStartDate] = useState<Date | undefined>(
    getInitialDate('startDate', subDays(new Date(), 30))
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    getInitialDate('endDate', new Date())
  )
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  // Load queue summary data for the specific queue
  const fetchQueueData = async () => {
    if (!queueId) return

    setIsLoadingQueue(true)
    try {
      const requestBody: any = {
        preparedStatement: "prep_distbyqueue",
        waitForResults: true,
        maxWaitTime: 60,
      }

      if (startDate) {
        requestBody.startDate = format(startDate, "yyyy-MM-dd")
      }
      if (endDate) {
        requestBody.endDate = format(endDate, "yyyy-MM-dd")
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result: APIResponse<QueueData> = await response.json()
      const foundQueue = result.data.find(q => q.queue_id === queueId)
      setQueueData(foundQueue || null)
    } catch (error) {
      console.error("[v0] Queue data fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load queue data",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoadingQueue(false)
    }
  }

  // Load detailed queue data
  const fetchDetailData = async () => {
    if (!queueId) return

    setIsLoadingDetails(true)
    try {
      const requestBody: any = {
        preparedStatement: "prep_distbyqueue_dd",
        queueId: queueId,
        waitForResults: true,
        maxWaitTime: 60,
      }

      if (startDate) {
        requestBody.startDate = format(startDate, "yyyy-MM-dd")
      }
      if (endDate) {
        requestBody.endDate = format(endDate, "yyyy-MM-dd")
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result: APIResponse<QueueDetailData> = await response.json()
      setDetailData(result.data)
      
      toast({
        title: "Details loaded successfully",
        description: `Showing ${result.rowCount} call record${result.rowCount !== 1 ? 's' : ''}`,
      })
    } catch (error) {
      console.error("[v0] Queue detail fetch error:", error)
      toast({
        variant: "destructive",
        title: "Failed to load queue details",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchQueueData()
    fetchDetailData()
  }, [])

  const handleApplyFilter = () => {
    fetchQueueData()
    fetchDetailData()
  }

  const handleResetFilter = () => {
    setStartDate(subDays(new Date(), 30))
    setEndDate(new Date())
    setTimeout(() => {
      fetchQueueData()
      fetchDetailData()
    }, 0)
  }

  const setQuickRange = (days: number) => {
    setStartDate(subDays(new Date(), days))
    setEndDate(new Date())
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight">Queue Details</h2>
              <p className="text-muted-foreground">
                Detailed view for queue: <span className="font-mono">{queueId}</span>
              </p>
            </div>
          </div>

          {/* Date Filter Card */}
          <Card>
            <CardHeader>
              <CardTitle>Date Range Filter</CardTitle>
              <CardDescription>Adjust date range for detailed call records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                {/* Start Date */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
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

                {/* End Date */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
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

                {/* Quick Range Buttons */}
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium">Quick Select</label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuickRange(7)}
                    >
                      Last 7 Days
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setQuickRange(30)}
                    >
                      Last 30 Days
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 ml-auto">
                  <Button 
                    onClick={handleApplyFilter} 
                    disabled={isLoadingQueue || isLoadingDetails}
                  >
                    {(isLoadingQueue || isLoadingDetails) ? (
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
                  <Button 
                    variant="outline" 
                    onClick={handleResetFilter}
                    disabled={isLoadingQueue || isLoadingDetails}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Summary Card */}
          {isLoadingQueue ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading queue summary...
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : queueData ? (
            <Card>
              <CardHeader>
                <CardTitle>Queue Summary</CardTitle>
                <CardDescription>
                  Performance metrics for this queue
                  {startDate && endDate && (
                    <span className="block mt-1 text-xs">
                      {format(startDate, "MMM dd, yyyy")} to {format(endDate, "MMM dd, yyyy")}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Received</p>
                    <p className="text-2xl font-bold">{queueData.received}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Answered</p>
                    <p className="text-2xl font-bold text-green-600">{queueData.answered}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Abandoned</p>
                    <p className="text-2xl font-bold text-red-600">{queueData.abandoned}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Wait</p>
                    <p className="text-2xl font-bold">{queueData.avg_wait_s}s</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% Answered</p>
                    <p className="text-2xl font-bold">{queueData["%_answered"]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SLA</p>
                    <p className="text-2xl font-bold">{queueData.sla}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Queue not found for the selected date range
                </div>
              </CardContent>
            </Card>
          )}

          {/* Call Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Call Records</CardTitle>
              <CardDescription>Detailed call records for this queue</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading call records...
                  </div>
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact ID</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Ring Time</TableHead>
                        <TableHead>Wait Time</TableHead>
                        <TableHead>Talk Time</TableHead>
                        <TableHead>DID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.map((record) => (
                        <TableRow key={record.contact_id}>
                          <TableCell className="font-mono">{record.contact_id}</TableCell>
                          <TableCell>{record.agent || "-"}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>{record.number}</TableCell>
                          <TableCell>
                            <span className="inline-block px-2 py-1 rounded text-sm bg-muted">{record.event}</span>
                          </TableCell>
                          <TableCell>{record.ring_time || "-"}</TableCell>
                          <TableCell>{record.wait_time || "-"}</TableCell>
                          <TableCell>{record.talk_time || "-"}</TableCell>
                          <TableCell>{record.DID}</TableCell>
                        </TableRow>
                      ))}
                      {detailData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            No call records found for the selected date range.
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