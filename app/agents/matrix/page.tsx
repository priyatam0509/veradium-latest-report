"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, TrendingUp, UserCheck, ArrowRight } from "lucide-react"

export default function AgentMatrixPage() {
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
