"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, TrendingUp, UserCheck, ArrowRight, Loader2 } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { useAuth } from "@/hooks/use-auth"
import { DateHelper } from "@/lib/date-helper"
import { useGlobalFilters } from "@/lib/global-filters-context"

interface AgentTotalsRow {
  number_of_agents: string
  average_online_time: string
  shortest_online_time: string
  longest_online_time: string
  total_online_time: string
  [key: string]: string
}

export default function AgentMatrixPage() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    appliedStartDate: startDate,
    appliedEndDate: endDate,
    appliedAgents: selectedAgents,
    applyVersion,
  } = useGlobalFilters()

  const [totals, setTotals] = useState<AgentTotalsRow | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const startRef = useRef(startDate)
  const endRef = useRef(endDate)
  const agentsRef = useRef(selectedAgents)
  useEffect(() => { startRef.current = startDate }, [startDate])
  useEffect(() => { endRef.current = endDate }, [endDate])
  useEffect(() => { agentsRef.current = selectedAgents }, [selectedAgents])

  const fetchData = async () => {
    if (!user?.email) return
    setIsLoading(true)
    try {
      const start = DateHelper.formatDateFromDate(startRef.current)
      const end = DateHelper.formatDateFromDate(endRef.current, true)
      const agentFilter = agentsRef.current.length > 0 ? agentsRef.current : undefined
      const result = await athenaAPI.getAgentTotals(start, end, user.email, agentFilter)
      if (result?.status === "SUCCEEDED" && Array.isArray(result.data) && result.data.length > 0) {
        setTotals(result.data[0])
      } else {
        setTotals(null)
      }
    } catch (err) {
      console.error("Agent totals fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.email])

  useEffect(() => {
    if (!authLoading) {
      startRef.current = startDate
      endRef.current = endDate
      agentsRef.current = selectedAgents
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyVersion])

  const metrics = [
    { label: "Number of Agents:", value: totals?.number_of_agents },
    { label: "Average Session Time:", value: totals?.average_online_time },
    { label: "Shortest Session Time:", value: totals?.shortest_online_time },
    { label: "Longest Session:", value: totals?.longest_online_time },
    { label: "Total Session Time:", value: totals?.total_online_time },
  ]

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agent Matrices</h1>
            <p className="text-muted-foreground mt-1">
              Overview of agent performance. Select a report below.
            </p>
          </div>

          {/* Agent Totals Table */}
          <Card className="max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Agent Totals</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <tbody>
                    {metrics.map((m, i) => (
                      <tr key={m.label} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                        <td className="px-6 py-3 text-sm font-medium border-t">{m.label}</td>
                        <td className="px-6 py-3 text-sm tabular-nums border-t border-l">{m.value ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Child page links */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Agent Activity</CardTitle>
                </div>
                <CardDescription>
                  Agent pause, hold, and custom status activity details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/agents/activity-analysis">
                    Open Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Agent Performance</CardTitle>
                </div>
                <CardDescription>
                  Agent call disposition: completed, transferred, failed, and missed calls.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/agents/performance-analysis">
                    Open Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Agent Availability</CardTitle>
                </div>
                <CardDescription>
                  Agent online time, pause time, talk time, and availability metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/agents/availability">
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
