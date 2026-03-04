"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Phone, TrendingUp, PhoneMissed, PhoneCall, Loader2 } from "lucide-react"
import { athenaAPI } from "@/lib/athena-api"
import { DateHelper } from "@/lib/date-helper"

// Safe column accessors — try multiple common naming conventions from the API
const getCallCount = (row: any): number =>
  Number(row.calls_offered ?? row.total_calls ?? row.offered ?? row.inbound_calls ?? 0)

const getAnsweredCount = (row: any): number =>
  Number(row.answered ?? row.calls_answered ?? row.answered_calls ?? 0)

const getServiceLevel = (row: any): number =>
  Number(row.service_level_pct ?? row.service_level ?? row.sl_pct ?? 0)

const getQueueName = (row: any): string =>
  String(row.queue_name ?? row.queue ?? row.name ?? "Unknown Queue")

const getHour = (row: any): number =>
  Number(row.hour ?? row.hour_of_day ?? row.call_hour ?? 0)

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [queueData, setQueueData] = useState<any[]>([])
  const [hourData, setHourData] = useState<any[]>([])
  const [userRegion, setUserRegion] = useState<string>("ALL")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.email) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const today = DateHelper.getToday()
        const normalizedEmail = user.email.replace(/@.*$/, "@TheTicketClinic.com")

        const [regionInfo, queueRes, hourRes] = await Promise.all([
          athenaAPI.getUserRegion(normalizedEmail),
          athenaAPI.getDistributionByQueue(today.start, today.end, null, user.email),
          athenaAPI.getDistributionByHour(today.start, today.end, null, user.email),
        ])

        setUserRegion(regionInfo?.region ?? "ALL")
        setQueueData(queueRes.data ?? [])
        setHourData(hourRes.data ?? [])
      } catch (err) {
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.email])

  const totalCalls = queueData.reduce((sum, row) => sum + getCallCount(row), 0)
  const totalAnswered = queueData.reduce((sum, row) => sum + getAnsweredCount(row), 0)
  const totalAbandoned = totalCalls - totalAnswered
  const avgServiceLevel =
    queueData.length > 0
      ? Math.round(
          queueData.reduce((sum, row) => sum + getServiceLevel(row), 0) / queueData.length
        )
      : 0

  const stats = [
    { label: "Total Calls Today", value: String(totalCalls), icon: Phone },
    { label: "Answered", value: String(totalAnswered), icon: PhoneCall },
    { label: "Abandoned", value: String(totalAbandoned), icon: PhoneMissed },
    { label: "Service Level", value: `${avgServiceLevel}%`, icon: TrendingUp },
  ]

  const chartData = [...hourData]
    .sort((a, b) => getHour(a) - getHour(b))
    .map((row) => ({
      time: `${String(getHour(row)).padStart(2, "0")}:00`,
      calls: getCallCount(row),
    }))

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.email}</h2>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">
                Here is what is happening across your AWS Connect instance today.
              </p>
              {!loading && (
                <Badge variant="outline">Region: {userRegion}</Badge>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-1" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Call Volume by Hour</CardTitle>
                <CardDescription>Incoming call volume today, by hour of day.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Queue Status</CardTitle>
                <CardDescription>Today&apos;s performance by queue.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : queueData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No queue data available
                  </p>
                ) : (
                  <div className="space-y-6">
                    {queueData.map((row, i) => {
                      const sl = getServiceLevel(row)
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{getQueueName(row)}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCallCount(row)} calls today
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-bold">{getAnsweredCount(row)}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Answered</p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                sl >= 80
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }
                            >
                              {sl}% SL
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
