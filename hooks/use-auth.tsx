"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User, RoutePermission } from "@/lib/auth-types"
import { useRouter } from "next/navigation"
import { microsoftAuthService } from "@/lib/microsoft-auth-service"
import { getAccessibleRoutes as getLocalAccessibleRoutes } from "@/lib/rbac"

// Every user authenticated through Azure AD is granted this role.
// Authorization is no longer gated by the AWS RBAC service.
const DEFAULT_ROLE = "ADMIN"

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
    if (user?.role) {
      fetchAccessibleRoutes(user.role)
    }
  }

  // This function will be called from the callback page after MS auth
  const completeLogin = async (token: string, msUser: { email: string; displayName: string }) => {
    try {
      // Authorize purely on the basis of a successful Azure AD sign-in.
      const userData: Omit<User, "password"> = {
        id: msUser.email,
        email: msUser.email,
        role: DEFAULT_ROLE,
        isEnabled: true,
      }

      // Store token and user
      microsoftAuthService.storeAccessToken(token)
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
    // Authorize purely on the basis of a successful Azure AD sign-in.
    const userData = {
      id: msUser.email,
      email: msUser.email,
      role: DEFAULT_ROLE,
      isEnabled: true,
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
