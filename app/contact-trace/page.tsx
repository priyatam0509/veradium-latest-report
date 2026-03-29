"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { useGlobalFilters } from "@/lib/global-filters-context"

/* -------------------------------------------------------------------------- */
/*                              Data interfaces                                */
/* -------------------------------------------------------------------------- */

interface AnsweredCallDetail {
  contact_id: string
  date: string
  channel: string
  queue_name: string
  agent_name: string
  customer_number: string
  interaction_status: string
  ring_time: string
  wait_time: string
  talk_time: string
  did: string
  region: string
  state: string
  recording: string
  [key: string]: string
}

interface UnansweredCallDetail {
  contact_id: string
  date: string
  channel: string
  queue_name: string
  customer_number: string
  interaction_status: string
  ring_time: string
  wait_time: string
  did: string
  region: string
  recording: string
  [key: string]: string
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

/* ========================================================================== */
export default function ContactTracePage() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedQueues: selectedQueues,
    appliedAgents: selectedAgents,
    appliedDids: selectedDids,
    applyVersion,
  } = useGlobalFilters()

  const [activeTab, setActiveTab] = useState<"answered" | "unanswered">("answered")
  const [answeredData, setAnsweredData] = useState<AnsweredCallDetail[]>([])
  const [unansweredData, setUnansweredData] = useState<UnansweredCallDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Refs to avoid stale closures
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

  const fetchTab = async (tab: "answered" | "unanswered") => {
    if (!user?.email) return
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const didFilter = didsRef.current.length > 0 ? didsRef.current : undefined

      if (tab === "answered") {
        const result = await athenaAPI.getAnsweredCallDetails(start, end, user.email, queueFilter, agentFilter, didFilter)
        if (result?.status === "SUCCEEDED") setAnsweredData(result.data)
      } else {
        const result = await athenaAPI.getUnansweredCallDetails(start, end, user.email, queueFilter, agentFilter, didFilter)
        if (result?.status === "SUCCEEDED") setUnansweredData(result.data)
      }
    } catch (err) {
      console.error("Contact trace fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (!authLoading) fetchTab(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  // Re-fetch on Apply
  useEffect(() => {
    if (!authLoading) {
      startRef.current = startDate
      endRef.current = endDate
      queuesRef.current = selectedQueues
      agentsRef.current = selectedAgents
      didsRef.current = selectedDids
      setAnsweredData([])
      setUnansweredData([])
      fetchTab(activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  // Load tab data on switch if not yet loaded
  const handleTabChange = (tab: string) => {
    const t = tab as "answered" | "unanswered"
    setActiveTab(t)
    if (t === "answered" && answeredData.length === 0) fetchTab("answered")
    if (t === "unanswered" && unansweredData.length === 0) fetchTab("unanswered")
  }

  const displayedAnswered = answeredData
  const displayedUnanswered = unansweredData

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contact Trace</h1>
            <p className="text-muted-foreground mt-1">
              Detailed call records — answered and unanswered call details
            </p>
          </div>

          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                {/* Tab header row with download button */}
                <div className="flex items-center justify-between px-4 pt-4 pb-0">
                  <TabsList>
                    <TabsTrigger value="answered" className="text-sm">Answered Calls</TabsTrigger>
                    <TabsTrigger value="unanswered" className="text-sm">Unanswered Calls</TabsTrigger>
                  </TabsList>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (activeTab === "answered") exportToCSV(displayedAnswered, "answered-call-details.csv")
                      else exportToCSV(displayedUnanswered, "unanswered-call-details.csv")
                    }}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Export CSV
                  </Button>
                </div>

                {/* ── Answered Calls Tab ── */}
                <TabsContent value="answered" className="mt-0 px-4 pb-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : displayedAnswered.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No answered call data for the selected period
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto mt-3" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Contact ID</TableHead>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Channel</TableHead>
                            <TableHead className="whitespace-nowrap">Queue</TableHead>
                            <TableHead className="whitespace-nowrap">Agent</TableHead>
                            <TableHead className="whitespace-nowrap">Number</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Ring Time</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Wait Time</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Talk Time</TableHead>
                            <TableHead className="whitespace-nowrap">DID</TableHead>
                            <TableHead className="whitespace-nowrap">Region</TableHead>
                            <TableHead className="whitespace-nowrap">State</TableHead>
                            <TableHead className="whitespace-nowrap">Recording</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedAnswered.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.contact_id ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.date ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.channel ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.queue_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.agent_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.customer_number ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.interaction_status ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.ring_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.wait_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.talk_time ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.did ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.region ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.state ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.recording ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {!isLoading && displayedAnswered.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">{displayedAnswered.length.toLocaleString()} records</p>
                  )}
                </TabsContent>

                {/* ── Unanswered Calls Tab ── */}
                <TabsContent value="unanswered" className="mt-0 px-4 pb-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : displayedUnanswered.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      No unanswered call data for the selected period
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-x-auto mt-3" style={{ maxHeight: "calc(100vh - 280px)", overflowY: "auto" }}>
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Contact ID</TableHead>
                            <TableHead className="whitespace-nowrap">Date</TableHead>
                            <TableHead className="whitespace-nowrap">Channel</TableHead>
                            <TableHead className="whitespace-nowrap">Queue</TableHead>
                            <TableHead className="whitespace-nowrap">Number</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Ring Time</TableHead>
                            <TableHead className="whitespace-nowrap text-right">Wait Time</TableHead>
                            <TableHead className="whitespace-nowrap">DID</TableHead>
                            <TableHead className="whitespace-nowrap">Region</TableHead>
                            <TableHead className="whitespace-nowrap">Recording</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedUnanswered.map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.contact_id ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.date ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.channel ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.queue_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.customer_number ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.interaction_status ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.ring_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.wait_time ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.did ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.region ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.recording ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {!isLoading && displayedUnanswered.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">{displayedUnanswered.length.toLocaleString()} records</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
