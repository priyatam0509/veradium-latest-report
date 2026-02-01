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
  BarChart3,
  LayoutDashboard,
  Users,
  Clock,
  History,
  Settings,
  ShieldCheck,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  PhoneOff,
  FileText,
  Headphones,
  Home,
} from "lucide-react"

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

const routeIcons: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/overview": Home,
  "/queues/matrix": Activity,
  "/agents/performance": Headphones,
  "/reports/time-analysis": FileText,
  "/calls/missed": PhoneOff,
  "/metrics/real-time": Clock,
  "/metrics/historical": History,
  "/analytics": TrendingUp,
  "/evaluations": ShieldCheck,
  "/admin/users": Users,
  "/admin/rbac": Shield,
  "/settings": Settings,
}

const routeDisplayNames: Record<string, string> = {
  "/calls/missed": "Unanswered Call Analysis",
  "/admin/rbac": "RBAC",
  "/admin/users": "User Management",
}

const routeOrder = [
  "/dashboard",
  "/dashboard/overview",
  "/queues/matrix",
  "/agents/performance",
  "/reports/time-analysis",
  "/metrics/real-time",
  "/metrics/historical",
  "/analytics",
  "/evaluations",
  "/calls/missed",
  "/admin/rbac",
  "/admin/users",
  "/settings",
]

/* -------------------------------------------------------------------------- */
/*                              Dashboard Layout                               */
/* -------------------------------------------------------------------------- */

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, accessibleRoutes } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const enabledRoutes = accessibleRoutes.filter(route => route.isEnabled)

  const navItems = enabledRoutes.sort((a, b) => {
    const indexA = routeOrder.indexOf(a.route)
    const indexB = routeOrder.indexOf(b.route)
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
  })

  const getDisplayName = (route: string, fallback: string) =>
    routeDisplayNames[route] || fallback

  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* ========================== Desktop Sidebar ========================== */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-card border-r">
        
      <div className="flex items-center gap-3 px-6 h-16 border-b">
  <Image
    src="/veradium-image.jpg"
    alt="Veradium Logo"
    width={42}
    height={28}
    priority
  />

  <span className="font-semibold text-base leading-none">
    Veradium Dashboard
  </span>
</div>


        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.length === 0 ? (
            <div className="text-sm text-muted-foreground px-3 py-2">
              No accessible routes
            </div>
          ) : (
            navItems.map(item => {
              const Icon = routeIcons[item.route] || BarChart3
              const displayName = getDisplayName(item.route, item.label)
              const isActive = pathname === item.route

              return (
                <Link
                  key={item.route}
                  href={item.route}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {displayName}
                </Link>
              )
            })
          )}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {user?.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.role}
              </span>
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
            {pathname.split("/").filter(Boolean).pop() || "Dashboard"}
          </h1>

          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            Auto-refreshing in 15s
          </span>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map(item => {
                const Icon = routeIcons[item.route] || BarChart3
                const displayName = getDisplayName(item.route, item.label)
                const isActive = pathname === item.route

                return (
                  <Link
                    key={item.route}
                    href={item.route}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {displayName}
                  </Link>
                )
              })}
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
