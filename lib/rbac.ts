import { getPermissions } from "@/config/permissions"
import type { RoutePermission } from "@/lib/auth-types"

/**
 * Checks if a user with a specific role can access a route.
 * Supports wildcard matching for nested routes.
 */
export function canAccess(route: string, userRole?: string): boolean {
  if (!userRole) return false

  // Admin has access to everything
  if (userRole === "ADMIN") return true

  const permissions = getPermissions()

  // Find the exact route permission or the closest parent wildcard permission
  const permission = permissions.find((p) => {
    // Exact match
    if (p.route === route) return true

    // Wildcard match (e.g., /metrics/*)
    if (p.route.endsWith("/*")) {
      const baseRoute = p.route.replace("/*", "")
      return route.startsWith(baseRoute)
    }

    return false
  })

  if (!permission) return false

  // Check if route is enabled and user role is allowed
  return permission.isEnabled && permission.allowedRoles.includes(userRole as any)
}

/**
 * Returns all routes accessible by a specific role.
 */
export function getAccessibleRoutes(role?: string): RoutePermission[] {
  if (!role) return []
  const permissions = getPermissions()
  return permissions.filter((p) => p.isEnabled && canAccess(p.route, role))
}
