import { type RoutePermission, type RoleDefinition, DEFAULT_ROLES, DEFAULT_ROUTES } from "@/lib/auth-types"

const STORAGE_KEY_ROUTES = "aws_reports_routes"
const STORAGE_KEY_ROLES = "aws_reports_roles"

async function fetchRoutesFromAPI(): Promise<RoutePermission[]> {
  try {
    const response = await fetch("/api/routes")
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error("[v0] Failed to fetch routes from API:", error)
  }
  return DEFAULT_ROUTES
}

async function fetchRolesFromAPI(): Promise<RoleDefinition[]> {
  try {
    const response = await fetch("/api/roles")
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error("[v0] Failed to fetch roles from API:", error)
  }
  return DEFAULT_ROLES
}

export function getStoredRoutes(): RoutePermission[] {
  if (typeof window === "undefined") return DEFAULT_ROUTES
  const stored = localStorage.getItem(STORAGE_KEY_ROUTES)

  // If no cache, fetch from API in background and use defaults for now
  if (!stored) {
    fetchRoutesFromAPI().then((routes) => {
      localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes))
      window.dispatchEvent(new Event("permissions-updated"))
    })
    return DEFAULT_ROUTES
  }

  const parsed = JSON.parse(stored)

  const merged = [...parsed]
  const routeIds = new Set(parsed.map((r: RoutePermission) => r.route))

  // Add any default routes that are missing from storage
  for (const defaultRoute of DEFAULT_ROUTES) {
    if (!routeIds.has(defaultRoute.route)) {
      merged.push(defaultRoute)
    }
  }

  return merged
}

export function getStoredRoles(): RoleDefinition[] {
  if (typeof window === "undefined") return DEFAULT_ROLES
  const stored = localStorage.getItem(STORAGE_KEY_ROLES)

  // If no cache, fetch from API in background and use defaults for now
  if (!stored) {
    fetchRolesFromAPI().then((roles) => {
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
    })
    return DEFAULT_ROLES
  }

  return JSON.parse(stored)
}

export function getPermissions(): RoutePermission[] {
  return getStoredRoutes()
}

export function savePermissions(routes: RoutePermission[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes))
  // Trigger a custom event to notify other components of the change
  window.dispatchEvent(new Event("permissions-updated"))
}

export async function initializePermissions() {
  if (typeof window === "undefined") return

  // Fetch routes from API
  const routes = await fetchRoutesFromAPI()
  localStorage.setItem(STORAGE_KEY_ROUTES, JSON.stringify(routes))

  // Fetch roles from API
  const roles = await fetchRolesFromAPI()
  localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles))
}
