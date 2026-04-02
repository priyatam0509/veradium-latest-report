"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, BarChart3, PhoneCall, PhoneMissed, ArrowRight, RefreshCw } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { DateHelper } from "@/lib/date-helper"

/* -------------------------------------------------------------------------- */
/*                              Data interfaces                                */
/* -------------------------------------------------------------------------- */

interface TotalAnsweredData {
  received: string
  answered: string
  transferred: string
  avg_talk: string
  total_duration: string
  avg_wait: string
}

interface TotalUnansweredData {
  total: string
  unanswered: string
  abandoned: string
  avg_wait_before_disconnect: string
}

interface ServiceLevelRow {
  interval: string
  answered?: string
  abandoned?: string
  count: string
  delta: string
  "% of count": string
}

/* -------------------------------------------------------------------------- */
/*                               Label helpers                                 */
/* -------------------------------------------------------------------------- */

const ANSWERED_LABELS: Record<keyof TotalAnsweredData, string> = {
  received: "Received Calls",
  answered: "Answered Calls",
  transferred: "Transferred Calls",
  avg_talk: "Avg Talk",
  total_duration: "Total Duration",
  avg_wait: "Avg Wait",
}

const UNANSWERED_LABELS: Record<keyof TotalUnansweredData, string> = {
  total: "Incompleted Calls",
  abandoned: "Abandoned Calls",
  unanswered: "Unanswered Calls",
  avg_wait_before_disconnect: "Abandon Avg Wait Before Disconnection",
}

/* ========================================================================== */
export default function QueueMatrixPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { appliedStartDate, appliedEndDate, appliedQueues, appliedDids, applyVersion } = useGlobalFilters()

  // Refs so fetchData always reads the LATEST filter values (avoids stale closure)
  const startRef = useRef(appliedStartDate)
  const endRef = useRef(appliedEndDate)
  const queuesRef = useRef(appliedQueues)
  const didsRef = useRef(appliedDids)
  useEffect(() => { startRef.current = appliedStartDate }, [appliedStartDate])
  useEffect(() => { endRef.current = appliedEndDate }, [appliedEndDate])
  useEffect(() => { queuesRef.current = appliedQueues }, [appliedQueues])
  useEffect(() => { didsRef.current = appliedDids }, [appliedDids])

  const [totalAnswered, setTotalAnswered] = useState<TotalAnsweredData | null>(null)
  const [totalUnanswered, setTotalUnanswered] = useState<TotalUnansweredData | null>(null)
  const [answeredSL, setAnsweredSL] = useState<ServiceLevelRow[]>([])
  const [abandonedSL, setAbandonedSL] = useState<ServiceLevelRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    if (!user?.email) return
    setIsLoading(true)
    try {
      // Always read from refs — guaranteed to be the latest applied values
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const queueFilter = queuesRef.current.length > 0 ? queuesRef.current : undefined
      const didFilter = didsRef.current.length > 0 ? didsRef.current : undefined

      const [answeredRes, unansweredRes, answeredSLRes, abandonedSLRes] = await Promise.all([
        athenaAPI.getDashboardTotalAnswered(start, end, user.email, queueFilter, didFilter),
        athenaAPI.getDashboardTotalUnanswered(start, end, user.email, queueFilter, didFilter),
        athenaAPI.getDashboardAnsweredServiceLevel(start, end, user.email, queueFilter, didFilter),
        athenaAPI.getDashboardAbandonedServiceLevel(start, end, user.email, queueFilter, didFilter),
      ])

      if (answeredRes.status === "SUCCEEDED" && answeredRes.data.length > 0)
        setTotalAnswered(answeredRes.data[0])
      if (unansweredRes.status === "SUCCEEDED" && unansweredRes.data.length > 0)
        setTotalUnanswered(unansweredRes.data[0])
      if (answeredSLRes.status === "SUCCEEDED")
        setAnsweredSL(answeredSLRes.data)
      if (abandonedSLRes.status === "SUCCEEDED")
        setAbandonedSL(abandonedSLRes.data)
    } catch (err) {
      console.error("Queue Matrix fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (!authLoading) fetchData()
  }, [authLoading, user?.email])

  // Re-fetch when global Apply is clicked — sync refs first so fetchData sees the new values
  useEffect(() => {
    if (!authLoading) {
      startRef.current = appliedStartDate
      endRef.current = appliedEndDate
      queuesRef.current = appliedQueues
      didsRef.current = appliedDids
      fetchData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queue Matrices</h1>
            <p className="text-muted-foreground mt-1">
              Overview of queue call metrics, service levels, and call distribution.
            </p>
          </div>

          {/* Refresh button row — the filter bar is shown by the layout above */}
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* ── Metric Tables row ── */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Total Answered Calls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Total Answered Calls</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !totalAnswered ? (
                  <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">No data</div>
                ) : (
                  <Table>
                    <TableBody>
                      {(Object.keys(ANSWERED_LABELS) as (keyof TotalAnsweredData)[]).map((key) => (
                        <TableRow key={key}>
                          <TableCell className="text-sm text-muted-foreground pl-6">{ANSWERED_LABELS[key]}</TableCell>
                          <TableCell className="text-sm font-medium text-right pr-6">{totalAnswered[key] ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Total Unanswered Calls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Total Unanswered Calls</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : !totalUnanswered ? (
                  <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">No data</div>
                ) : (
                  <Table>
                    <TableBody>
                      {(Object.keys(UNANSWERED_LABELS) as (keyof TotalUnansweredData)[]).map((key) => (
                        <TableRow key={key}>
                          <TableCell className="text-sm text-muted-foreground pl-6">{UNANSWERED_LABELS[key]}</TableCell>
                          <TableCell className="text-sm font-medium text-right pr-6">{totalUnanswered[key] ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Service Level Tables row ── */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* Answered Service Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Service Level — Answered</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : answeredSL.length === 0 ? (
                  <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">No data</div>
                ) : (
                  <div className="overflow-auto" style={{ maxHeight: "320px" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Answer</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Delta</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {answeredSL.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm whitespace-nowrap">{row.answered ?? `within ${row.interval} seconds`}</TableCell>
                            <TableCell className="text-sm text-right">{row.count}</TableCell>
                            <TableCell className="text-sm text-right">{row.delta}</TableCell>
                            <TableCell className="text-sm text-right">{row["% of count"]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Abandoned Service Level */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Service Level — Abandoned</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-36">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : abandonedSL.length === 0 ? (
                  <div className="flex items-center justify-center h-36 text-sm text-muted-foreground">No data</div>
                ) : (
                  <div className="overflow-auto" style={{ maxHeight: "320px" }}>
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Abandoned</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">Delta</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {abandonedSL.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm whitespace-nowrap">{row.abandoned ?? `within ${row.interval} seconds`}</TableCell>
                            <TableCell className="text-sm text-right">{row.count}</TableCell>
                            <TableCell className="text-sm text-right">{row.delta}</TableCell>
                            <TableCell className="text-sm text-right">{row["% of count"]}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Open Report cards ── */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Queue Distribution</CardTitle>
                </div>
                <CardDescription>
                  Detailed call distribution by queue, DID, agent, hour, day, month, and state.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/queues/distribution">
                    Open Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <PhoneCall className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Answered Calls</CardTitle>
                </div>
                <CardDescription>
                  Answered call analysis by queue, DID, and agent with contact-level drilldowns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/queues/answered">
                    Open Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <PhoneMissed className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Unanswered Calls</CardTitle>
                </div>
                <CardDescription>
                  Unanswered and abandoned call analysis by queue and DID with drilldowns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/queues/unanswered">
                    Open Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
