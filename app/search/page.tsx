"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Phone, MessageSquare, ExternalLink } from "lucide-react"
import { Suspense } from "react"

const mockContacts = [
  {
    id: "c-001",
    date: "2024-03-26 14:22",
    agent: "Sarah Johnson",
    queue: "Sales_English",
    channel: "Voice",
    sentiment: "Positive",
    duration: "05:12",
  },
  {
    id: "c-002",
    date: "2024-03-26 13:45",
    agent: "Michael Chen",
    queue: "Support_Tier1",
    channel: "Chat",
    sentiment: "Neutral",
    duration: "12:05",
  },
  {
    id: "c-003",
    date: "2024-03-26 12:10",
    agent: "Emily Davis",
    queue: "Billing_US",
    channel: "Voice",
    sentiment: "Negative",
    duration: "08:30",
  },
  {
    id: "c-004",
    date: "2024-03-26 11:30",
    agent: "Robert Wilson",
    queue: "Sales_English",
    channel: "Voice",
    sentiment: "Positive",
    duration: "04:45",
  },
]

function ContactSearchContent() {
  const [searchTerm, setSearchTerm] = useState("")
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contact Search</h2>
        <p className="text-muted-foreground">Search and review historical customer interactions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Contact ID, Agent, or Customer Phone..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="voice">Voice</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2">
              <Filter className="h-4 w-4" /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact ID</TableHead>
                <TableHead>Date/Time</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-mono text-xs">{contact.id}</TableCell>
                  <TableCell className="text-xs">{contact.date}</TableCell>
                  <TableCell className="font-medium">{contact.agent}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {contact.channel === "Voice" ? (
                        <Phone className="h-3 w-3" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                      <span className="text-xs">{contact.channel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        contact.sentiment === "Positive"
                          ? "text-green-500 border-green-500/20 bg-green-500/5"
                          : contact.sentiment === "Negative"
                            ? "text-destructive border-destructive/20 bg-destructive/5"
                            : "text-muted-foreground",
                      )}
                    >
                      {contact.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{contact.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ContactSearchPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Suspense fallback={null}>
          <ContactSearchContent />
        </Suspense>
      </DashboardLayout>
    </AuthGuard>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
