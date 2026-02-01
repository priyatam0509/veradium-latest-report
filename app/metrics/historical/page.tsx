"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Download, Filter } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const historicalData = [
  { date: "2024-03-20", volume: 450, abandoned: 12, sl: 92 },
  { date: "2024-03-21", volume: 520, abandoned: 24, sl: 88 },
  { date: "2024-03-22", volume: 480, abandoned: 15, sl: 94 },
  { date: "2024-03-23", volume: 210, abandoned: 5, sl: 98 },
  { date: "2024-03-24", volume: 180, abandoned: 2, sl: 99 },
  { date: "2024-03-25", volume: 610, abandoned: 45, sl: 78 },
  { date: "2024-03-26", volume: 580, abandoned: 32, sl: 84 },
]

export default function HistoricalMetricsPage() {
  const [range, setRange] = useState("7d")

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Historical Performance</h2>
              <p className="text-muted-foreground">Analyze trends and patterns over time.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Schedule Report
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Report Configuration</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Time Range
                </div>
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Contact Volume"
                    />
                    <Line
                      type="monotone"
                      dataKey="abandoned"
                      stroke="var(--destructive)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Abandoned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Contacts</TableHead>
                    <TableHead>Avg Handle Time</TableHead>
                    <TableHead>Abandoned Rate</TableHead>
                    <TableHead>Service Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicalData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell>{row.volume}</TableCell>
                      <TableCell>05:42</TableCell>
                      <TableCell>{((row.abandoned / row.volume) * 100).toFixed(1)}%</TableCell>
                      <TableCell>{row.sl}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
