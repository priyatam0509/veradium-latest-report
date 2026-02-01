"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, RoutePermission } from "@/lib/auth-types"
import { useRouter } from "next/navigation"
import { microsoftAuthService } from "@/lib/microsoft-auth-service"
import { awsRBACService } from "@/lib/aws-rbac-service"

interface AuthContextType {
  user: Omit<User, "password"> | null
  accessToken: string | null
  accessibleRoutes: RoutePermission[]
  login: () => void
  logout: () => void
  isLoading: boolean
  refreshRoutes: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY_USER = "aws_reports_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [accessibleRoutes, setAccessibleRoutes] = useState<RoutePermission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchAccessibleRoutes = async (email: string) => {
    try {
      const response = await awsRBACService.getAccessibleRoutes(email)
      const routes: RoutePermission[] = response.routes.map(r => ({
        id: r.routeId,
        route: r.route,
        label: r.label,
        allowedRoles: r.allowedRoles,
        isEnabled: r.isEnabled,
      }))
      setAccessibleRoutes(routes)
    } catch (error) {
      console.error('[Auth] Failed to fetch accessible routes:', error)
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
          await fetchAccessibleRoutes(storedUser.email)
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

  const refreshRoutes = async () => {
    if (user?.email) {
      await fetchAccessibleRoutes(user.email)
    }
  }

  // This function will be called from the callback page after MS auth
  const completeLogin = async (token: string, msUser: { email: string; displayName: string }) => {
    try {
      // Verify user with AWS RBAC API
      const verifyResponse = await awsRBACService.verifyUser(msUser.email)
      
      const userData: Omit<User, "password"> = {
        id: verifyResponse.user.userId,
        email: verifyResponse.user.email,
        role: verifyResponse.user.role,
        isEnabled: verifyResponse.user.isEnabled,
      }

      if (!userData.isEnabled) {
        throw new Error('User account is disabled')
      }

      // Store token and user
      microsoftAuthService.storeAccessToken(token)
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))
      
      setUser(userData)
      setAccessToken(token)
      
      // Fetch accessible routes
      await fetchAccessibleRoutes(userData.email)
      
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
        isLoading, 
        refreshRoutes 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Export completeLogin for use in callback page
export async function completeAuthLogin(token: string, msUser: { email: string; displayName: string }) {
  try {
    const verifyResponse = await awsRBACService.verifyUser(msUser.email)
    
    const userData = {
      id: verifyResponse.user.userId,
      email: verifyResponse.user.email,
      role: verifyResponse.user.role,
      isEnabled: verifyResponse.user.isEnabled,
    }

    if (!userData.isEnabled) {
      throw new Error('User account is disabled')
    }

    microsoftAuthService.storeAccessToken(token)
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData))
    
    return userData
  } catch (error) {
    console.error('[Auth] Login completion error:', error)
    microsoftAuthService.clearStoredToken()
    localStorage.removeItem(STORAGE_KEY_USER)
    throw error
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
