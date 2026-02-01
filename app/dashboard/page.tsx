"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { Phone, Users, Clock, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react"

const mockStats = [
  { label: "Active Calls", value: "24", change: "+4", trend: "up", icon: Phone },
  { label: "Agents Online", value: "142", change: "+12", trend: "up", icon: Users },
  { label: "Avg Wait Time", value: "0:45", change: "-0:12", trend: "down", icon: Clock },
  { label: "Service Level", value: "94%", change: "+2%", trend: "up", icon: TrendingUp },
]

const chartData = [
  { time: "09:00", calls: 45, wait: 32 },
  { time: "10:00", calls: 52, wait: 45 },
  { time: "11:00", calls: 48, wait: 28 },
  { time: "12:00", calls: 61, wait: 35 },
  { time: "13:00", calls: 55, wait: 42 },
  { time: "14:00", calls: 67, wait: 31 },
  { time: "15:00", calls: 72, wait: 38 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.email}</h2>
            <p className="text-muted-foreground">Here is what is happening across your AWS Connect instance today.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockStats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs pt-1">
                    {stat.trend === "up" ? (
                      <span className="text-green-500 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" /> {stat.change}
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center">
                        <ArrowDownRight className="h-3 w-3 mr-1" /> {stat.change}
                      </span>
                    )}
                    <span className="text-muted-foreground ml-1">since last hour</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Call Volume Trends</CardTitle>
                <CardDescription>Real-time incoming call volume across all queues.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Queue Status</CardTitle>
                <CardDescription>Current performance by department.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {["Sales", "Support", "Billing"].map((q) => (
                    <div key={q} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{q}</p>
                        <p className="text-xs text-muted-foreground">8 agents online</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold">12</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Waiting</p>
                        </div>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          Healthy
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
