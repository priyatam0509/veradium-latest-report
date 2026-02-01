import type { User, RoleDefinition, RoutePermission } from "./auth-types"

interface VerifyUserResponse {
  user: {
    email: string
    userId: string
    role: string
    displayName: string
    isEnabled: boolean
  }
}

interface AccessibleRoutesResponse {
  role: string
  routes: Array<{
    route: string
    routeId: string
    label: string
    allowedRoles: string[]
    isEnabled: boolean
    description: string
    createdAt: string
    updatedAt: string
  }>
}

interface CheckPermissionResponse {
  allowed: boolean
  error?: string
}

interface RoleResponse {
  roleId: string
  description: string
  color: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface UserListResponse {
  email: string
  userId: string
  role: string
  displayName: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_AWS_API_URL || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev'

export class AWSRBACService {
  private static instance: AWSRBACService
  private baseUrl: string

  private constructor() {
    this.baseUrl = BASE_URL
  }

  static getInstance(): AWSRBACService {
    if (!AWSRBACService.instance) {
      AWSRBACService.instance = new AWSRBACService()
    }
    return AWSRBACService.instance
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || error.message || 'API request failed')
    }

    return response.json()
  }

  async verifyUser(email: string): Promise<VerifyUserResponse> {
    return this.request<VerifyUserResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async checkPermission(email: string, route: string): Promise<CheckPermissionResponse> {
    return this.request<CheckPermissionResponse>('/auth/check-permission', {
      method: 'POST',
      body: JSON.stringify({ email, route }),
    })
  }

  async getAccessibleRoutes(email: string): Promise<AccessibleRoutesResponse> {
    return this.request<AccessibleRoutesResponse>('/auth/accessible-routes', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async listUsers(requesterEmail: string): Promise<UserListResponse[]> {
    return this.request<UserListResponse[]>('/users/list', {
      method: 'POST',
      body: JSON.stringify({ email: requesterEmail }),
    })
  }

  async createUser(
    requesterEmail: string,
    email: string,
    role: string,
    displayName: string
  ): Promise<UserListResponse> {
    return this.request<UserListResponse>('/users', {
      method: 'POST',
      body: JSON.stringify({ requesterEmail, email, role, displayName }),
    })
  }

  async updateUser(
    requesterEmail: string,
    email: string,
    updates: { role?: string; isEnabled?: boolean; displayName?: string }
  ): Promise<UserListResponse> {
    return this.request<UserListResponse>(`/users/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: JSON.stringify({ requesterEmail, ...updates }),
    })
  }

  async deleteUser(requesterEmail: string, email: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      body: JSON.stringify({ requesterEmail }),
    })
  }

  async listRoles(): Promise<RoleResponse[]> {
    return this.request<RoleResponse[]>('/roles/list', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  }

  async createRole(
    requesterEmail: string,
    roleId: string,
    description: string,
    color: string
  ): Promise<RoleResponse> {
    return this.request<RoleResponse>('/roles', {
      method: 'POST',
      body: JSON.stringify({ requesterEmail, roleId, description, color }),
    })
  }

  async deleteRole(requesterEmail: string, roleId: string): Promise<{ success: boolean }> {
    return this.request(`/roles/${encodeURIComponent(roleId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ requesterEmail }),
    })
  }

  async listRoutes(): Promise<RoutePermission[]> {
    const routes = await this.request<any[]>('/routes/list', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    
    return routes.map(r => ({
      id: r.routeId,
      route: r.route,
      label: r.label,
      allowedRoles: r.allowedRoles,
      isEnabled: r.isEnabled,
      description: r.description,
    }))
  }

  async createRoute(
    requesterEmail: string,
    route: string,
    label: string,
    allowedRoles: string[],
    description: string
  ): Promise<RoutePermission> {
    const response: any = await this.request('/routes', {
      method: 'POST',
      body: JSON.stringify({ requesterEmail, route, label, allowedRoles, description }),
    })
    
    return {
      id: response.routeId,
      route: response.route,
      label: response.label,
      allowedRoles: response.allowedRoles,
      isEnabled: response.isEnabled,
      description: response.description,
    }
  }

  async updateRoute(
    requesterEmail: string,
    routeId: string,
    updates: {
      allowedRoles?: string[]
      isEnabled?: boolean
      label?: string
      description?: string
    }
  ): Promise<any> {
    return this.request(`/routes/${encodeURIComponent(routeId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ requesterEmail, ...updates }),
    })
  }

  async deleteRoute(requesterEmail: string, routeId: string): Promise<{ success: boolean }> {
    return this.request(`/routes/${encodeURIComponent(routeId)}`, {
      method: 'DELETE',
      body: JSON.stringify({ requesterEmail }),
    })
  }
}

export const awsRBACService = AWSRBACService.getInstance()
