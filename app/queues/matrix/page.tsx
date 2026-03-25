"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, PhoneCall, PhoneMissed, ArrowRight } from "lucide-react"

export default function QueueMatrixPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Queue Matrix</h1>
            <p className="text-muted-foreground mt-1">
              Overview of queue performance. Select a report below.
            </p>
          </div>

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
