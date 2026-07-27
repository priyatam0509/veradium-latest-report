"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { exportToCSV } from "@/lib/csv-export"
import { useSortable, SortHead } from "@/lib/sort-table"

interface ReportData {
  period: string
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
  '%_answered': string
  '%_unanswered': string
  sla: string
}

export default function TimeAnalysisReportsPage() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily")

  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const generateReport = async () => {
    setIsLoading(true)
    try {
      const dateRange = {
        start: DateHelper.formatDateFromDate(startDate),
        end: DateHelper.formatDateFromDate(endDate, true)
      }

      let result
      switch (reportType) {
        case 'daily':
          result = await athenaAPI.getDistributionByDay(dateRange.start, dateRange.end, null, user?.email)
          break
        case 'weekly':
          result = await athenaAPI.getDistributionByWeek(dateRange.start, dateRange.end, null, user?.email)
          break
        case 'monthly':
          result = await athenaAPI.getDistributionByMonth(dateRange.start, dateRange.end, null, user?.email)
          break
      }

      if (result.status === 'SUCCEEDED') {
        // Map data to consistent format
        const mappedData = result.data.map((row: any) => ({
          period: row.interval_day || row.interval_weeknum || row.interval_month || 'N/A',
          region: row.region || '',
          channel: row.channel || 'Voice',
          initiation_method: row.initiation_method || 'N/A',
          received: row.received || '0',
          answered: row.answered || '0',
          unanswered: row.unanswered || '0',
          abandoned: row.abandoned || '0',
          transferred: row.transferred || '0',
          avg_wait: row.avg_wait || '0',
          avg_talk: row.avg_talk || '0',
          '%_answered': row['%_answered'] || '0',
          '%_unanswered': row['%_unanswered'] || '0',
          sla: row.sla || '0'
        }))
        
        setReportData(mappedData)
      } else {
        throw new Error(result.error || 'Query failed')
      }
    } catch (error) {
      console.error("Report generation error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      generateReport()
    }
  }, [authLoading, user?.email, reportType])

  const handleExportCSV = () => {
    exportToCSV(reportData, `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`)
  }

  const sort = useSortable(reportData)

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily': return 'Daily Report'
      case 'weekly': return 'Weekly Report'
      case 'monthly': return 'Monthly Report'
    }
  }

  const getPeriodLabel = () => {
    switch (reportType) {
      case 'daily': return 'Date'
      case 'weekly': return 'Week #'
      case 'monthly': return 'Month'
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Time Analysis Reports</h1>
              <p className="text-muted-foreground">Generate daily, weekly, and monthly performance reports</p>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm" disabled={reportData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Select report type and date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="space-y-2 flex items-end">
                  <Button onClick={generateReport} className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Generate Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{getReportTitle()}</CardTitle>
              <CardDescription>
                {isLoading ? "Generating report..." : `Showing ${reportData.length} period${reportData.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="scrollable-table">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <SortHead col="period" label={getPeriodLabel()} sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="region" label="Region" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} />
                        <SortHead col="channel" label="Channel" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="initiation_method" label="Initiation Method" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="received" label="Received" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="answered" label="Answered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="unanswered" label="Unanswered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="abandoned" label="Abandoned" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="transferred" label="Transferred" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="avg_wait" label="Avg Wait" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="avg_talk" label="Avg Talk" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="%_answered" label="% Answered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="%_unanswered" label="% Unanswered" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                        <SortHead col="sla" label="SLA %" sortKey={sort.sortKey} sortDir={sort.sortDir} onSort={sort.handleSort} className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sort.sorted.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.period}</TableCell>
                          <TableCell>{row.region || '—'}</TableCell>
                          <TableCell className="text-right">{row.channel}</TableCell>
                          <TableCell className="text-right">{row.initiation_method}</TableCell>
                          <TableCell className="text-right">{row.received}</TableCell>
                          <TableCell className="text-right text-green-600">{row.answered}</TableCell>
                          <TableCell className="text-right text-red-600">{row.unanswered}</TableCell>
                          <TableCell className="text-right text-orange-600">{row.abandoned || '0'}</TableCell>
                          <TableCell className="text-right text-blue-600">{row.transferred || '0'}</TableCell>
                          <TableCell className="text-right">{row.avg_wait || '-'}</TableCell>
                          <TableCell className="text-right">{row.avg_talk || '-'}</TableCell>
                          <TableCell className="text-right">{row['%_answered'] || '-'}</TableCell>
                          <TableCell className="text-right">{row['%_unanswered'] || '-'}</TableCell>
                          <TableCell className="text-right">{row.sla}</TableCell>
                        </TableRow>
                      ))}
                      {reportData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={14} className="text-center text-muted-foreground">
                            No data available for the selected period
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
