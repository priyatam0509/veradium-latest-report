"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Download, X, Search } from "lucide-react"
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

interface CallFlowStep {
  contact_id: string
  start_timestamp: string
  elapsed_time: string
  channel: string
  initiation_method: string
  resource_type: string
  resource_name: string
  outcome: string
  resource_id: string
  queue_name: string | null
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                    */
/* -------------------------------------------------------------------------- */

// Shared ref to track the currently playing RecordingCell's stop callback
let activeRecordingStop: (() => void) | null = null

function RecordingCell({ recording }: { recording?: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (!recording) return <span>—</span>

  let key = ""
  try {
    const rec = JSON.parse(recording)
    if (rec.location) {
      const slashIdx = rec.location.indexOf("/")
      if (slashIdx > 0) {
        key = rec.location.substring(slashIdx + 1)
      }
    }
  } catch {
    return <span className="text-xs">{recording}</span>
  }

  if (!key) return <span>—</span>

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setPlaying(false)
  }

  const handleToggle = () => {
    if (playing) {
      stopPlayback()
      activeRecordingStop = null
      return
    }
    // Stop any other playing recording first
    if (activeRecordingStop) activeRecordingStop()
    activeRecordingStop = stopPlayback
    setPlaying(true)
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className="text-xs text-blue-600 hover:underline"
      >
        {playing ? "⏹ Stop" : "▶ Play"}
      </button>
      {playing && (
        <audio ref={audioRef} controls autoPlay className="mt-1 w-48 h-8"
          onEnded={() => { setPlaying(false); activeRecordingStop = null }}>
          <source src={`/api/recording?key=${encodeURIComponent(key)}`} type="audio/wav" />
        </audio>
      )}
    </div>
  )
}

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

function getStatusColor(status: string) {
  switch (status) {
    case "Transferred to External": return "text-purple-600"
    case "Transferred": return "text-blue-600"
    case "Completed by Agent":
    case "Completed by Caller": return "text-green-600"
    default: return "text-foreground"
  }
}

function getBadgeStyle(resourceType: string) {
  switch (resourceType) {
    case "CONTACT_FLOW": return "bg-blue-100 text-blue-800"
    case "MODULE": return "bg-purple-100 text-purple-800"
    case "CUSTOMER_QUEUE": return "bg-orange-100 text-orange-800"
    case "AGENT": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-700"
  }
}

function getResourceLabel(resourceType: string) {
  switch (resourceType) {
    case "CONTACT_FLOW": return "Flow"
    case "MODULE": return "Module"
    case "CUSTOMER_QUEUE": return "Queue"
    case "AGENT": return "Agent"
    default: return resourceType
  }
}

/* -------------------------------------------------------------------------- */
/*                           Call Flow Modal                                   */
/* -------------------------------------------------------------------------- */

function CallFlowModal({
  contactId,
  steps,
  isLoading,
  onClose,
}: {
  contactId: string
  steps: CallFlowStep[]
  isLoading: boolean
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Call Flow Timeline</h2>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{contactId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-0.5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : steps.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              No flow data found for this contact
            </div>
          ) : (
            <div className="space-y-1">
              {steps.map((step, i) => {
                const originalContactId = steps[0].contact_id
                const contactIdChanged = step.contact_id !== originalContactId
                return (
                <div key={i}>
                  {/* Elapsed time connector (not shown for first step) */}
                  {i > 0 && step.elapsed_time && (
                    <div className="flex items-center gap-2 ml-4 my-1">
                      <div className="w-px h-4 bg-border ml-2" />
                      <span className="text-xs text-muted-foreground font-mono">+{step.elapsed_time}</span>
                    </div>
                  )}

                  {/* Step card */}
                  <div className="border rounded-lg p-4 hover:border-border/80 hover:shadow-sm transition-all bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${getBadgeStyle(step.resource_type)}`}>
                            {getResourceLabel(step.resource_type)}
                          </span>
                          {step.queue_name && (
                            <span className="text-xs text-amber-700 font-medium">
                              Queue: {step.queue_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{step.resource_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Outcome: <span className="font-medium text-foreground">{step.outcome}</span>
                        </p>
                        {contactIdChanged && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{step.contact_id}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground font-mono whitespace-nowrap">{step.start_timestamp}</p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                          Initiation: <span className="font-medium text-foreground">{step.initiation_method}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
  const [localSearch, setLocalSearch] = useState("")

  // Drilldown state
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [callFlowSteps, setCallFlowSteps] = useState<CallFlowStep[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false)

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

  const handleContactIdClick = async (contactId: string) => {
    setSelectedContactId(contactId)
    setCallFlowSteps([])
    setIsModalOpen(true)
    setIsDrilldownLoading(true)
    try {
      const result = await athenaAPI.getCallFlowDrilldown(contactId, user?.email)
      if (result?.status === "SUCCEEDED") setCallFlowSteps(result.data)
    } catch (err) {
      console.error("Drilldown fetch error:", err)
    } finally {
      setIsDrilldownLoading(false)
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

  const displayedAnswered = useMemo(() => {
    const search = localSearch.trim().toLowerCase()
    if (!search) return answeredData
    return answeredData.filter((row) => {
      const values = [
        row.contact_id, row.date, row.channel, row.queue_name, row.agent_name,
        row.customer_number, row.interaction_status, row.ring_time, row.wait_time,
        row.talk_time, row.did, row.region, row.state,
      ]
      return values.some((v) => (v || '').toLowerCase().includes(search))
    })
  }, [answeredData, localSearch])

  const displayedUnanswered = useMemo(() => {
    const search = localSearch.trim().toLowerCase()
    if (!search) return unansweredData
    return unansweredData.filter((row) => {
      const values = [
        row.contact_id, row.date, row.channel, row.queue_name,
        row.customer_number, row.interaction_status, row.ring_time, row.wait_time,
        row.did, row.region,
      ]
      return values.some((v) => (v || '').toLowerCase().includes(search))
    })
  }, [unansweredData, localSearch])

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

                <div className="px-4 pt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by contact ID, queue, agent, number, status..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="pl-9 max-w-sm"
                    />
                  </div>
                </div>

                {/* ── Answered Calls Tab ── */}
                <TabsContent value="answered" className="mt-0 px-4 pb-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : displayedAnswered.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                      {localSearch
                        ? `No results found for "${localSearch}"`
                        : 'No answered call data for the selected period'}
                    </div>
                  ) : (
                    <div className="scrollable-table mt-3">
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
                              <TableCell className="text-xs whitespace-nowrap font-mono">
                                <button
                                  onClick={() => handleContactIdClick(row.contact_id)}
                                  className="text-blue-600 hover:underline cursor-pointer text-left"
                                >
                                  {row.contact_id ?? "—"}
                                </button>
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.date ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.channel ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.queue_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.agent_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.customer_number ?? "—"}</TableCell>
                              <TableCell className={`text-xs whitespace-nowrap font-medium ${getStatusColor(row.interaction_status)}`}>{row.interaction_status ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.ring_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.wait_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.talk_time ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.did ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.region ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.state ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap"><RecordingCell recording={row.recording} /></TableCell>
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
                      {localSearch
                        ? `No results found for "${localSearch}"`
                        : 'No unanswered call data for the selected period'}
                    </div>
                  ) : (
                    <div className="scrollable-table mt-3">
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
                              <TableCell className="text-xs whitespace-nowrap font-mono">
                                <button
                                  onClick={() => handleContactIdClick(row.contact_id)}
                                  className="text-blue-600 hover:underline cursor-pointer text-left"
                                >
                                  {row.contact_id ?? "—"}
                                </button>
                              </TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.date ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.channel ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.queue_name ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.customer_number ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.interaction_status ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.ring_time ?? "—"}</TableCell>
                              <TableCell className="text-xs text-right font-mono">{row.wait_time ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap font-mono">{row.did ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">{row.region ?? "—"}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap"><RecordingCell recording={row.recording} /></TableCell>
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

        {/* Drilldown Modal */}
        {isModalOpen && selectedContactId && (
          <CallFlowModal
            contactId={selectedContactId}
            steps={callFlowSteps}
            isLoading={isDrilldownLoading}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
