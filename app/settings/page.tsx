"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Database, Monitor } from "lucide-react"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">Configure your AWS Connect reporting preferences.</p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <CardTitle>Display Preferences</CardTitle>
                </div>
                <CardDescription>Adjust how the dashboard looks and behaves.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Real-Time Auto Refresh</Label>
                    <p className="text-xs text-muted-foreground">Automatically update metrics every 15 seconds.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact View</Label>
                    <p className="text-xs text-muted-foreground">Show more rows in tables by reducing padding.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle>AWS Integration (Mock)</CardTitle>
                </div>
                <CardDescription>Configure connection to your AWS Connect instance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="instance-id">Connect Instance ARN</Label>
                  <Input
                    id="instance-id"
                    placeholder="arn:aws:connect:region:account:instance/id"
                    readOnly
                    value="arn:aws:connect:us-east-1:123456789:instance/veradium-prod"
                  />
                </div>
                <Button variant="outline">Test Connection</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>Configure alerts for threshold breaches.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Service Level Alerts</Label>
                    <p className="text-xs text-muted-foreground">Notify when SL drops below 80%.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Daily Summaries</Label>
                    <p className="text-xs text-muted-foreground">Send a PDF report every morning at 8:00 AM.</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
