"use client"

import type React from "react"
import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

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
} from "lucide-react"

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
    label: "Queue Matrix",
    icon: LayoutGrid,
    route: "/queues/matrix",
    children: [
      { route: "/queues/distribution", label: "Queue Distribution", icon: BarChart3 },
      { route: "/queues/answered", label: "Answered Calls", icon: PhoneCall },
      { route: "/queues/unanswered", label: "Unanswered Calls", icon: PhoneMissed },
    ],
  },
  {
    label: "Agent Matrix",
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
]

/* -------------------------------------------------------------------------- */
/*                              Dashboard Layout                               */
/* -------------------------------------------------------------------------- */

export function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  // Check if a route is accessible (either in RBAC list or is a new landing route)
  const isRouteAccessible = (route: string) => {
    // Landing pages that don't need RBAC entry yet
    const landingRoutes = ["/queues/matrix", "/agents/matrix", "/queues/distribution", "/queues/answered", "/queues/unanswered"]
    if (landingRoutes.includes(route)) return true
    return accessibleRouteSet.has(route)
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
          <Image
            src="https://res.cloudinary.com/dnijbboek/image/upload/v1770896884/veradium_xqy6gh.png"
            alt="Veradium Logo"
            width={42}
            height={28}
            priority
          />
          <span className="font-semibold text-base leading-none">Veradium Dashboard</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {renderNav()}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
            {pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard"}
          </h1>
        </header>

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
              <span className="font-bold text-lg">Veradium Dashboard</span>
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
