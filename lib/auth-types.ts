export type UserRole = string

export interface RoleDefinition {
  roleId: UserRole
  description: string
  color?: string
}

export interface RoutePermission {
  id?: string
  route: string
  label: string
  allowedRoles: UserRole[]
  isEnabled: boolean
}

export interface User {
  id: string
  email: string
  password?: string
  role: UserRole
  isEnabled: boolean
}

export interface AuthSession {
  user: Omit<User, "password">
  expires: string
}

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    roleId: "ADMIN",
    description: "Full system access including user and permission management",
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  {
    roleId: "SUPERVISOR",
    description: "Access to reporting, analytics, and team oversight",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    roleId: "ANALYST",
    description: "Read-only access to metrics and historical reports",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
]

export const DEFAULT_ROUTES: RoutePermission[] = [
  // ── Core ────────────────────────────────────────────────────────────────────
  {
    id: "1",
    route: "/dashboard/overview",
    label: "Dashboard Overview",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  // ── Queue Matrix ─────────────────────────────────────────────────────────────
  {
    id: "2",
    route: "/queues/matrix",
    label: "Queue Matrix",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "20",
    route: "/queues/distribution",
    label: "Queue Distribution",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "21",
    route: "/queues/answered",
    label: "Answered Calls",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "22",
    route: "/queues/unanswered",
    label: "Unanswered Calls",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  // ── Agent Matrix ─────────────────────────────────────────────────────────────
  {
    id: "23",
    route: "/agents/matrix",
    label: "Agent Matrix",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "24",
    route: "/agents/activity-analysis",
    label: "Agent Activity",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "25",
    route: "/agents/performance-analysis",
    label: "Agent Performance",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "26",
    route: "/agents/availability",
    label: "Agent Availability",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  // ── Other reports ────────────────────────────────────────────────────────────
  {
    id: "27",
    route: "/analytics/transfers",
    label: "Transferred Calls",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  // ── Admin ────────────────────────────────────────────────────────────────────
  {
    id: "8",
    route: "/admin/users",
    label: "User Management",
    allowedRoles: ["ADMIN"],
    isEnabled: true,
  },
  {
    id: "9",
    route: "/admin/rbac",
    label: "RBAC Settings",
    allowedRoles: ["ADMIN"],
    isEnabled: true,
  },
  {
    id: "10",
    route: "/settings",
    label: "Settings",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  // ── Legacy routes (kept for compatibility) ───────────────────────────────────
  {
    id: "12",
    route: "/agents/performance",
    label: "Agent Matrix (legacy)",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: false,
  },
  {
    id: "13",
    route: "/reports/time-analysis",
    label: "Time Analysis Reports",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: false,
  },
  {
    id: "14",
    route: "/calls/missed",
    label: "Missed Calls (legacy)",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: false,
  },
]

export const DEFAULT_ADMIN: User = {
  id: "admin-1",
  email: "piyush@veradium.com",
  password: "Admin@123",
  role: "ADMIN",
  isEnabled: true,
}
