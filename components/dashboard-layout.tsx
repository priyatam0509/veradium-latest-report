"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import Image from "next/image"
import { useGlobalFilters } from "@/lib/global-filters-context"
import { agentGroupsService, AGENT_GROUPS_EVENT, type AgentGroup } from "@/lib/agent-groups-service"

import {
  Home,
  BarChart3,
  Users,
  Settings,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Phone,
  UserCheck,
  PhoneCall,
  PhoneMissed,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  FileText,
  Calendar,
  RefreshCw,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                           Global Filters Bar                               */
/* -------------------------------------------------------------------------- */

// Per-route filter visibility config.
// hidden: dropdowns to hide completely on this route (not applicable per PDF spec)
interface FilterConfig {
  hideAgent?: boolean
  hideQueue?: boolean
  hideDid?: boolean
}

const FILTER_ROUTE_CONFIG: Record<string, FilterConfig> = {
  // Queue Matrices — does NOT support agent
  "/queues/matrix":        { hideAgent: true },
  // Unanswered Calls — does NOT support agent
  "/queues/unanswered":    { hideAgent: true },
  // Agent Activity Analysis — only supports agent + region (hide queue + DID)
  "/agents/activity-analysis": { hideQueue: true, hideDid: true },
  // Agent Performance — does NOT support DID
  "/agents/performance-analysis": { hideDid: true },
  // Agent Availability — does NOT support DID
  "/agents/availability": { hideDid: true },
  // Queue Distribution — all dropdowns active
  "/queues/distribution": {},
  // Answered Calls — all dropdowns active
  "/queues/answered": {},
  // Transfer Analysis — all dropdowns active
  "/analytics/transfers": {},
  // Agent Matrices landing — only agent supported (queue + DID hidden, per PDF page 6)
  "/agents/matrix": { hideQueue: true, hideDid: true },
  // Contact Trace — all dropdowns active (per PDF page 11)
  "/contact-trace": {},
}

function GlobalFiltersBar({ config }: { config: FilterConfig }) {
  const {
    startDate, endDate,
    selectedQueues, selectedAgents, selectedDids,
    isStartOpen, isEndOpen,
    queueFilterOpen, agentFilterOpen, didFilterOpen,
    availableQueues, availableAgents, availableDids,
    setStartDate, setEndDate,
    setSelectedQueues, setSelectedAgents, setSelectedDids,
    setIsStartOpen, setIsEndOpen,
    setQueueFilterOpen, setAgentFilterOpen, setDidFilterOpen,
    handleApply, handleReset,
  } = useGlobalFilters()

  const [queueSearch, setQueueSearch] = useState("")
  const [agentSearch, setAgentSearch] = useState("")
  const [didSearch, setDidSearch] = useState("")

  // Agent Groups — a shortcut that fills the Agent selection with a saved group's agents
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupFilterOpen, setGroupFilterOpen] = useState(false)

  useEffect(() => {
    const load = () => agentGroupsService.list().then(setAgentGroups)
    load()
    window.addEventListener(AGENT_GROUPS_EVENT, load)
    return () => window.removeEventListener(AGENT_GROUPS_EVENT, load)
  }, [])

  // Selecting a group replaces the agent selection with that group's agents
  const applyGroup = (group: AgentGroup) => {
    setSelectedGroupId(group.id)
    setSelectedAgents(group.agents)
    setGroupFilterOpen(false)
  }
  const clearGroup = () => {
    setSelectedGroupId(null)
    setSelectedAgents([])
  }
  // Manually toggling an agent means the selection no longer matches a group,
  // so drop the group label back to "No Group Selected".
  const toggleAgentManual = (value: string) => {
    setSelectedGroupId(null)
    setSelectedAgents(selectedAgents.includes(value) ? selectedAgents.filter((x) => x !== value) : [...selectedAgents, value])
  }
  const selectedGroupLabel = selectedGroupId
    ? agentGroups.find((g) => g.id === selectedGroupId)?.name ?? "No Group Selected"
    : "No Group Selected"

  // Toggle item_value in/out of selection list
  const toggleValue = (list: string[], value: string, setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  // Label for dropdown button — shows display names of selected items
  const multiSelectLabel = (
    selectedValues: string[],
    available: { display: string; value: string }[],
    singular: string,
    all: string
  ) => {
    if (selectedValues.length === 0) return all
    if (selectedValues.length === 1) {
      const found = available.find((a) => a.value === selectedValues[0])
      return found ? found.display : selectedValues[0]
    }
    return `${selectedValues.length} ${singular}s selected`
  }

  return (
    <div className="border-b bg-card px-4 md:px-8 py-2 flex flex-wrap gap-2 items-end sticky top-16 z-30">
      {/* Start Date */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Start Date</label>
        <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-8 w-[155px] justify-start text-left font-normal text-xs", !startDate && "text-muted-foreground")}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setIsStartOpen(false) }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* End Date */}
      <div className="flex flex-col gap-0.5">
        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">End Date</label>
        <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("h-8 w-[155px] justify-start text-left font-normal text-xs", !endDate && "text-muted-foreground")}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setIsEndOpen(false) }} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Queue Filter — shows item_display, selects item_value (queue UID) */}
      {!config.hideQueue && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Queue</label>
          <Popover open={queueFilterOpen} onOpenChange={setQueueFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-[180px] justify-start text-left font-normal text-xs">
                {multiSelectLabel(selectedQueues, availableQueues, "queue", "All Queues")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search queues…"
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="h-7 text-xs mb-2"
              />
              <div className="max-h-52 overflow-y-auto space-y-1">
                {availableQueues.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">Loading queues…</p>
                ) : (
                  availableQueues
                    .filter((q) => q.display.toLowerCase().includes(queueSearch.toLowerCase()))
                    .map((q) => (
                    <div key={q.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer" onClick={() => toggleValue(selectedQueues, q.value, setSelectedQueues)}>
                      <Checkbox checked={selectedQueues.includes(q.value)} onCheckedChange={() => toggleValue(selectedQueues, q.value, setSelectedQueues)} onClick={(e) => e.stopPropagation()} />
                      <span className="text-xs truncate" title={q.display}>{q.display}</span>
                    </div>
                  ))
                )}
              </div>
              {selectedQueues.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => setSelectedQueues([])}>Clear</Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Agent Filter — shows item_display, selects item_value (agent UID) */}
      {!config.hideAgent && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Agent</label>
          <Popover open={agentFilterOpen} onOpenChange={setAgentFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-[180px] justify-start text-left font-normal text-xs">
                {multiSelectLabel(selectedAgents, availableAgents, "agent", "All Agents")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search agents…"
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="h-7 text-xs mb-2"
              />
              <div className="max-h-52 overflow-y-auto space-y-1">
                {availableAgents.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">Loading agents…</p>
                ) : (
                  availableAgents
                    .filter((a) => a.display.toLowerCase().includes(agentSearch.toLowerCase()))
                    .map((a) => (
                    <div key={a.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer" onClick={() => toggleAgentManual(a.value)}>
                      <Checkbox checked={selectedAgents.includes(a.value)} onCheckedChange={() => toggleAgentManual(a.value)} onClick={(e) => e.stopPropagation()} />
                      <span className="text-xs truncate" title={a.display}>{a.display}</span>
                    </div>
                  ))
                )}
              </div>
              {selectedAgents.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs h-7" onClick={clearGroup}>Clear</Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Agent Group Filter — selecting a group fills the Agent selection with its agents */}
      {!config.hideAgent && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Agent Group</label>
          <Popover open={groupFilterOpen} onOpenChange={setGroupFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-[180px] justify-start text-left font-normal text-xs">
                {selectedGroupLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                <div
                  className="px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs"
                  onClick={() => { clearGroup(); setGroupFilterOpen(false) }}
                >
                  No Group Selected
                </div>
                {agentGroups.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">No groups yet</p>
                ) : (
                  agentGroups.map((g) => (
                    <div
                      key={g.id}
                      className={cn(
                        "px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs truncate",
                        selectedGroupId === g.id && "bg-accent font-medium"
                      )}
                      title={`${g.name} — ${g.agentNames.length} agent${g.agentNames.length === 1 ? "" : "s"}`}
                      onClick={() => applyGroup(g)}
                    >
                      {g.name}
                      <span className="text-muted-foreground"> ({g.agents.length})</span>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* DID / Phone Filter — shows item_display, selects item_value (phone number) */}
      {!config.hideDid && (
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">DID / Phone</label>
          <Popover open={didFilterOpen} onOpenChange={setDidFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 w-[180px] justify-start text-left font-normal text-xs">
                {multiSelectLabel(selectedDids, availableDids, "DID", "All DIDs")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                placeholder="Search DIDs…"
                value={didSearch}
                onChange={(e) => setDidSearch(e.target.value)}
                className="h-7 text-xs mb-2"
              />
              <div className="max-h-52 overflow-y-auto space-y-1">
                {availableDids.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">Loading DIDs…</p>
                ) : (
                  availableDids
                    .filter((d) => d.display.toLowerCase().includes(didSearch.toLowerCase()))
                    .map((d) => (
                    <div key={d.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer" onClick={() => toggleValue(selectedDids, d.value, setSelectedDids)}>
                      <Checkbox checked={selectedDids.includes(d.value)} onCheckedChange={() => toggleValue(selectedDids, d.value, setSelectedDids)} onClick={(e) => e.stopPropagation()} />
                      <span className="text-xs truncate" title={d.display}>{d.display}</span>
                    </div>
                  ))
                )}
              </div>
              {selectedDids.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs h-7" onClick={() => setSelectedDids([])}>Clear</Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Apply + Reset */}
      <div className="flex gap-2 items-end">
        <Button size="sm" className="h-8 text-xs px-4" onClick={handleApply}>
          Apply
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs px-3" onClick={() => { setSelectedGroupId(null); handleReset() }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            Navigation Structure                             */
/* -------------------------------------------------------------------------- */

interface NavChild {
  route: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  icon: React.ElementType
  route: string // landing page route
  children: NavChild[]
}

interface NavItem {
  route: string
  label: string
  icon: React.ElementType
}

type NavEntry = NavGroup | NavItem

function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry
}

const NAV_STRUCTURE: NavEntry[] = [
  {
    route: "/dashboard/overview",
    label: "Dashboard Overview",
    icon: Home,
  },
  {
    label: "Queue Matrices",
    icon: LayoutGrid,
    route: "/queues/matrix",
    children: [
      { route: "/queues/distribution", label: "Queue Distribution", icon: BarChart3 },
      { route: "/queues/answered", label: "Answered Calls", icon: PhoneCall },
      { route: "/queues/unanswered", label: "Unanswered Calls", icon: PhoneMissed },
    ],
  },
  {
    label: "Agent Matrices",
    icon: Users,
    route: "/agents/matrix",
    children: [
      { route: "/agents/activity-analysis", label: "Agent Activity", icon: Activity },
      { route: "/agents/performance-analysis", label: "Agent Performance", icon: TrendingUp },
      { route: "/agents/availability", label: "Agent Availability", icon: UserCheck },
    ],
  },
  {
    route: "/analytics/transfers",
    label: "Transferred Calls",
    icon: Phone,
  },
  {
    route: "/contact-trace",
    label: "Call Journey",
    icon: FileText,
  },
  {
    label: "Setup",
    icon: Settings,
    route: "/setup/agent-groups",
    children: [
      { route: "/setup/agent-groups", label: "Agent Groups", icon: Users },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*                              Dashboard Layout                               */
/* -------------------------------------------------------------------------- */

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, logout, accessibleRoutes } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Track which groups are manually expanded/collapsed
  // By default, the group containing the active route is expanded
  const getDefaultExpanded = () => {
    const expanded: Record<string, boolean> = {}
    for (const entry of NAV_STRUCTURE) {
      if (isNavGroup(entry)) {
        const isActive =
          pathname === entry.route ||
          entry.children.some((c) => pathname === c.route || pathname.startsWith(c.route + "/"))
        expanded[entry.label] = isActive
      }
    }
    return expanded
  }

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(getDefaultExpanded)

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const accessibleRouteSet = new Set(accessibleRoutes.map((r) => r.route))

  // Check if a route is accessible (either in RBAC list or is a hardcoded accessible route)
  const isRouteAccessible = (route: string) => {
    // Pages that are always accessible without a RBAC entry
    const alwaysAccessible = [
      "/queues/matrix",
      "/queues/distribution",
      "/queues/answered",
      "/queues/unanswered",
      "/agents/matrix",
      "/agents/activity-analysis",
      "/agents/performance-analysis",
      "/agents/availability",
      "/contact-trace",
      "/setup/agent-groups",
    ]
    if (alwaysAccessible.includes(route)) return true
    return accessibleRouteSet.has(route)
  }

  // Show the global filters bar on all pages in FILTER_ROUTE_CONFIG
  const showFilters = Object.keys(FILTER_ROUTE_CONFIG).some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  )
  const currentFilterConfig: FilterConfig =
    Object.entries(FILTER_ROUTE_CONFIG).find(([r]) => pathname === r || pathname.startsWith(r + "/"))?.[1] ?? {}

  // Resolve a human-readable page title from NAV_STRUCTURE instead of the raw URL segment
  const getPageTitle = (): string => {
    for (const entry of NAV_STRUCTURE) {
      if (isNavGroup(entry)) {
        if (pathname === entry.route) return entry.label
        const child = entry.children.find((c) => pathname === c.route || pathname.startsWith(c.route + "/"))
        if (child) return child.label
      } else {
        if (pathname === entry.route || pathname.startsWith(entry.route + "/")) return entry.label
      }
    }
    // Fallback: prettify last URL segment
    return pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"
  }

  const renderNavItem = (item: NavItem, mobile = false, indent = false) => {
    const Icon = item.icon
    const isActive = pathname === item.route || pathname.startsWith(item.route + "/")

    return (
      <Link
        key={item.route}
        href={item.route}
        onClick={() => mobile && setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          indent && "ml-4 pl-3 border-l border-border",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.label}
      </Link>
    )
  }

  const renderNavGroup = (group: NavGroup, mobile = false) => {
    const isExpanded = expandedGroups[group.label] ?? false
    const GroupIcon = group.icon
    const isGroupActive =
      pathname === group.route ||
      group.children.some((c) => pathname === c.route || pathname.startsWith(c.route + "/"))

    // Only show children that are accessible
    const visibleChildren = group.children.filter((c) => isRouteAccessible(c.route))

    return (
      <div key={group.label}>
        <div className="flex items-center gap-1">
          <Link
            href={group.route}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={cn(
              "flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isGroupActive && !group.children.some((c) => pathname === c.route)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <GroupIcon className="w-4 h-4 shrink-0" />
            {group.label}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => toggleGroup(group.label)}
          >
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {isExpanded && visibleChildren.length > 0 && (
          <div className="mt-0.5 space-y-0.5">
            {visibleChildren.map((child) => {
              const ChildIcon = child.icon
              const isActive = pathname === child.route || pathname.startsWith(child.route + "/")
              return (
                <Link
                  key={child.route}
                  href={child.route}
                  onClick={() => mobile && setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 ml-4 pl-3 pr-3 py-2 rounded-md text-sm font-medium transition-colors border-l border-border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <ChildIcon className="w-4 h-4 shrink-0" />
                  {child.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderNav = (mobile = false) => {
    return NAV_STRUCTURE.map((entry) => {
      if (isNavGroup(entry)) {
        return renderNavGroup(entry, mobile)
      }
      if (!isRouteAccessible(entry.route)) return null
      return renderNavItem(entry, mobile)
    })
  }

  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* ========================== Desktop Sidebar ========================== */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r">
        <div className="flex items-center gap-3 px-6 h-16 border-b">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dnijbboek/image/upload/v1777654360/the_ticket_clinic_rzbfy6.png"
            alt="The Ticket Clinic Logo"
            width={80}
            height={80}
            style={{ objectFit: "contain" }}
          />
          <span className="font-semibold text-base leading-none">The Ticket Clinic Dashboard</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {renderNav()}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dnijbboek/image/upload/v1770896884/veradium_xqy6gh.png"
              alt="Veradium Logo"
              width={52}
              height={52}
              style={{ objectFit: "contain" }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{user?.email}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-destructive"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ============================== Content =============================== */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-semibold md:text-base capitalize">
            {getPageTitle()}
          </h1>
        </header>

        {showFilters && <GlobalFiltersBar config={currentFilterConfig} />}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ============================ Mobile Menu ============================ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-3/4 max-w-sm bg-card border-r shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-6 h-16 border-b">
              <span className="font-bold text-lg">The Ticket Clinic Dashboard</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {renderNav(true)}
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutInner>{children}</DashboardLayoutInner>
}
