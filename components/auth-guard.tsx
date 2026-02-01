"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { canAccess } from "@/lib/rbac"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        router.push("/login")
        return
      }

      if (user && pathname === "/login") {
        router.push("/dashboard")
        return
      }

      if (user && pathname !== "/login" && pathname !== "/unauthorized") {
        const hasAccess = canAccess(pathname, user.role)
        if (!hasAccess) {
          router.push("/unauthorized")
        }
      }
    }
  }, [user, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user && pathname !== "/login") {
    return null
  }

  return <>{children}</>
}
