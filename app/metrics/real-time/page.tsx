"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, PhoneIncoming, Activity } from "lucide-react"

const queueData = [
  { name: "Sales_English", active: 12, waiting: 4, longest: "02:45", sl: 88 },
  { name: "Support_Tier1", active: 25, waiting: 8, longest: "05:12", sl: 72 },
  { name: "Support_Tier2", active: 8, waiting: 2, longest: "01:20", sl: 95 },
  { name: "Billing_US", active: 15, waiting: 3, longest: "03:10", sl: 82 },
]

const agentData = [
  { name: "Sarah Johnson", status: "Available", duration: "00:45:12", queue: "Sales_English" },
  { name: "Michael Chen", status: "On Call", duration: "00:05:22", queue: "Support_Tier1" },
  { name: "Emily Davis", status: "ACW", duration: "00:02:10", queue: "Billing_US" },
  { name: "Robert Wilson", status: "Lunch", duration: "00:28:45", queue: "N/A" },
  { name: "Jessica Taylor", status: "Available", duration: "01:12:05", queue: "Support_Tier2" },
]

export default function RealTimeMetricsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshKey((k) => k + 1)
    }, 15000)
    return () => clearInterval(timer)
  }, [])

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Real-Time Metrics</h2>
              <p className="text-muted-foreground">Live data from your contact center. Refreshes every 15s.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-card border rounded-full px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live Tracking ({refreshKey})
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Queue</CardTitle>
                <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">17</div>
                <p className="text-xs text-muted-foreground">+2 since last poll</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">60</div>
                <p className="text-xs text-muted-foreground">Across all channels</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Agents Logged In</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142</div>
                <p className="text-xs text-muted-foreground">85 Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Service Level (Avg)</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">84%</div>
                <Progress value={84} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="queues" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queues">Queues</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="routing">Routing Profiles</TabsTrigger>
            </TabsList>

            <TabsContent value="queues">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Queue Name</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Waiting</TableHead>
                        <TableHead>Longest Wait</TableHead>
                        <TableHead>Service Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueData.map((q) => (
                        <TableRow key={q.name}>
                          <TableCell className="font-medium">{q.name}</TableCell>
                          <TableCell>{q.active}</TableCell>
                          <TableCell>
                            <Badge variant={q.waiting > 5 ? "destructive" : "secondary"}>{q.waiting}</Badge>
                          </TableCell>
                          <TableCell>{q.longest}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={q.sl < 80 ? "text-destructive font-bold" : "text-green-500 font-bold"}>
                                {q.sl}%
                              </span>
                              <Progress value={q.sl} className="w-20 h-1.5" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time in Status</TableHead>
                        <TableHead>Queue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentData.map((agent) => (
                        <TableRow key={agent.name}>
                          <TableCell className="font-medium">{agent.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                agent.status === "Available"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : agent.status === "On Call"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {agent.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{agent.duration}</TableCell>
                          <TableCell>{agent.queue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
