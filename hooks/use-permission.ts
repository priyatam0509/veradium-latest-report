"use client"

import { useAuth } from "@/hooks/use-auth"
import { canAccess } from "@/lib/rbac"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

/**
 * Hook to check if the current user has access to a specific route or the current route.
 */
export function usePermission(route?: string) {
  const { user } = useAuth()
  const pathname = usePathname()

  const targetRoute = route || pathname

  const hasAccess = useMemo(() => {
    return canAccess(targetRoute, user?.role)
  }, [targetRoute, user?.role])

  return {
    hasAccess,
    role: user?.role,
    isAdmin: user?.role === "ADMIN",
  }
}
