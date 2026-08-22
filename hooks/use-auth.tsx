"use client"

import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react"
import type { User, RoutePermission } from "@/lib/auth-types"
import { useRouter } from "next/navigation"
import { microsoftAuthService } from "@/lib/microsoft-auth-service"
import { getAccessibleRoutes as getLocalAccessibleRoutes } from "@/lib/rbac"
import { athenaAPI } from "@/lib/athena-api"

// Every user authenticated through Azure AD is granted this role.
// Authorization is no longer gated by the AWS RBAC service.
const DEFAULT_ROLE = "ADMIN"

interface AuthContextType {
  user: Omit<User, "password"> | null
  accessToken: string | null
  accessibleRoutes: RoutePermission[]
  login: () => void
  logout: () => void
  completeLogin: (token: string, msUser: { email: string; displayName: string }) => Promise<boolean>
  isLoading: boolean
  refreshRoutes: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_USER = "aws_reports_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [accessibleRoutes, setAccessibleRoutes] = useState<RoutePermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchAccessibleRoutes = (role: string) => {
    try {
      setAccessibleRoutes(getLocalAccessibleRoutes(role))
    } catch (error) {
      console.error('[Auth] Failed to compute accessible routes:', error)
      setAccessibleRoutes([])
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const token = microsoftAuthService.getStoredAccessToken()
      const userStr = localStorage.getItem(STORAGE_KEY_USER)
      
      if (token && userStr) {
        try {
          const storedUser = JSON.parse(userStr)
          setUser(storedUser)
          setAccessToken(token)
          fetchAccessibleRoutes(storedUser.role)
          // One-time backfill of tier/region for sessions created before these
          // fields existed. Ongoing freshness is handled where it matters (the
          // Agent Groups page refreshes via refreshUser on a timer).
          if (storedUser.email && (storedUser.tier === undefined || storedUser.region === undefined)) {
            Promise.all([
              athenaAPI.getUserTier(storedUser.email).catch(() => null),
              athenaAPI.getUserRegion(storedUser.email).catch(() => null),
            ]).then(([tier, regionResult]) => {
              const updated = { ...storedUser, tier: tier ?? null, region: regionResult?.region ?? null }
              localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated))
              setUser(updated)
            })
          }
        } catch (e) {
          console.error("Failed to restore session", e)
          logout()
        }
      }
      setIsLoading(false)
    }
    
    initAuth()
  }, [])

  const login = () => {
    const authUrl = microsoftAuthService.getAuthUrl()
    window.location.href = authUrl
  }

  // Re-fetch the current user's tier + region and update the session. Used by the
  // Agent Groups page on a timer so a tier change is picked up without re-login.
  const refreshUser = useCallback(async () => {
    let email: string | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER)
      email = raw ? JSON.parse(raw).email ?? null : null
    } catch { email = null }
    if (!email) return
    const [tier, regionResult] = await Promise.all([
      athenaAPI.getUserTier(email).catch(() => null),
      athenaAPI.getUserRegion(email).catch(() => null),
    ])
    setUser((prev) => {
      if (!prev || prev.email !== email) return prev
      const updated = { ...prev, tier: tier ?? null, region: regionResult?.region ?? null }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated))
      return updated
    })
  }, [])

  const refreshRoutes = async () => {
    if (user?.role) {
      fetchAccessibleRoutes(user.role)
    }
  }

  // This function will be called from the callback page after MS auth
  const completeLogin = async (token: string, msUser: { email: string; displayName: string }) => {
    try {
      // Store the token first so proxy calls (getUserTier -> /api/query) are
      // authenticated during login, not just after.
      microsoftAuthService.storeAccessToken(token)

      // Authorize purely on the basis of a successful Azure AD sign-in.
      // Fetch the user's permission tier + region (used for Agent Group edit rules).
      const [tier, regionResult] = await Promise.all([
        athenaAPI.getUserTier(msUser.email).catch(() => null),
        athenaAPI.getUserRegion(msUser.email).catch(() => null),
      ])

      // Fail closed: if the user has no profile/region record, block login rather
      // than defaulting to ALL-region access. (found is 1 when a record exists.)
      const found = regionResult && (regionResult.found === 1 || regionResult.found === true)
      if (!found) {
        const errorCode = `PROFILE-404-${Date.now().toString(36).toUpperCase()}`
        throw new Error(`We are unable to find your profile. Please contact your administrator. Error code: ${errorCode}`)
      }
      const region = regionResult?.region ?? null

      const userData: Omit<User, "password"> = {
        id: msUser.email,
        email: msUser.email,
        role: DEFAULT_ROLE,
        isEnabled: true,
        tier,
        region,
      }

      // Persist the user (token already stored above)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))

      setUser(userData)
      setAccessToken(token)

      // Fetch accessible routes
      fetchAccessibleRoutes(userData.role)

      return true
    } catch (error) {
      console.error('[Auth] Login completion error:', error)
      microsoftAuthService.clearStoredToken()
      localStorage.removeItem(STORAGE_KEY_USER)
      throw error
    }
  }

  const logout = () => {
    microsoftAuthService.clearStoredToken()
    localStorage.removeItem(STORAGE_KEY_USER)
    setUser(null)
    setAccessToken(null)
    setAccessibleRoutes([])
    router.push("/login")
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken, 
        accessibleRoutes, 
        login,
        logout,
        completeLogin,
        isLoading,
        refreshRoutes,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
