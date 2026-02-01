"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Brain, Smile, MessageSquare, AlertCircle } from "lucide-react"

const sentimentData = [
  { name: "Positive", value: 65, color: "oklch(0.7 0.15 140)" },
  { name: "Neutral", value: 20, color: "oklch(0.8 0.05 240)" },
  { name: "Negative", value: 15, color: "oklch(0.6 0.18 25)" },
]

const categoryData = [
  { name: "Billing Inquiry", count: 420 },
  { name: "Technical Issue", count: 350 },
  { name: "Account Access", count: 280 },
  { name: "Cancellation", count: 150 },
  { name: "Promotion", count: 120 },
]

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Contact Lens Analytics</h2>
              <p className="text-muted-foreground">AI-powered conversational analytics and sentiment trends.</p>
            </div>
            <Badge variant="outline" className="gap-2 px-3 py-1">
              <Brain className="h-3 w-3 text-primary" /> AI Insights Enabled
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smile className="h-4 w-4 text-green-500" /> Overall Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Positive</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sentimentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Contact Categories</CardTitle>
                <CardDescription>Volume breakdown by identified contact intent.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="radial" innerRadius="10%" outerRadius="80%" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Key Topic Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { topic: "Refund Policy", trend: "+12%", status: "Increasing" },
                  { topic: "v2.4 Bug", trend: "+45%", status: "Critical" },
                  { topic: "Holiday Hours", trend: "-5%", status: "Decreasing" },
                ].map((item) => (
                  <div key={item.topic} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{item.topic}</p>
                      <Badge variant={item.status === "Critical" ? "destructive" : "secondary"} className="text-[10px]">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.trend}</p>
                      <p className="text-[10px] text-muted-foreground">Volume Change</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" /> Compliance Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Script Adherence</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Privacy Disclosure</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Authentication Followed</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
