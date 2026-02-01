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
  {
    id: "1",
    route: "/dashboard",
    label: "Dashboard",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "2",
    route: "/queues/matrix",
    label: "Queue Matrix",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "3",
    route: "/metrics/real-time",
    label: "Real-Time Metrics",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "4",
    route: "/metrics/historical",
    label: "Historical Metrics",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "5",
    route: "/analytics",
    label: "Contact Lens",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "6",
    route: "/search",
    label: "Contact Search",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "7",
    route: "/evaluations",
    label: "Evaluations",
    allowedRoles: ["ADMIN"],
    isEnabled: true,
  },
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
  {
    id: "11",
    route: "/dashboard/overview",
    label: "Dashboard Overview",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "12",
    route: "/agents/performance",
    label: "Agent Performance",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
  {
    id: "13",
    route: "/reports/time-analysis",
    label: "Time Analysis Reports",
    allowedRoles: ["ADMIN", "SUPERVISOR", "ANALYST"],
    isEnabled: true,
  },
  {
    id: "14",
    route: "/calls/missed",
    label: "Missed Calls",
    allowedRoles: ["ADMIN", "SUPERVISOR"],
    isEnabled: true,
  },
]

export const DEFAULT_ADMIN: User = {
  id: "admin-1",
  email: "piyush@veradium.com",
  password: "Admin@123",
  role: "ADMIN",
  isEnabled: true,
}
