"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Star, Eye } from "lucide-react"

const evaluations = [
  { id: "EV-101", agent: "Sarah Johnson", date: "2024-03-25", score: 94, status: "Completed", supervisor: "Admin" },
  { id: "EV-102", agent: "Michael Chen", date: "2024-03-24", score: 82, status: "Pending Review", supervisor: "Admin" },
  { id: "EV-103", agent: "Emily Davis", date: "2024-03-24", score: 88, status: "Completed", supervisor: "Admin" },
  {
    id: "EV-104",
    agent: "Robert Wilson",
    date: "2024-03-23",
    score: 75,
    status: "Action Required",
    supervisor: "Admin",
  },
]

export default function EvaluationsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Performance Evaluations</h2>
              <p className="text-muted-foreground">Monitor and score agent performance and compliance.</p>
            </div>
            <Button className="gap-2">
              <FileText className="h-4 w-4" /> New Evaluation
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">86.4%</div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                  <Star className="h-3 w-3 text-muted" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">3 assigned to you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Coaching Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">Completion rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Recent Evaluations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluation ID</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-mono text-xs">{ev.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">{ev.agent[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ev.agent}</span>
                        </div>
                      </TableCell>
                      <TableCell>{ev.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              ev.score >= 90
                                ? "text-green-500 font-bold"
                                : ev.score < 80
                                  ? "text-destructive font-bold"
                                  : "font-bold"
                            }
                          >
                            {ev.score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ev.status === "Completed"
                              ? "success"
                              : ev.status === "Action Required"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {ev.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
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
