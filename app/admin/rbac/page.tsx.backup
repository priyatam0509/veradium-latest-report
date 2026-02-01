"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Shield, Route, Plus, Trash2 } from "lucide-react"
import type { RoleDefinition, RoutePermission } from "@/lib/auth-types"
import { Checkbox } from "@/components/ui/checkbox"
import { apiCall } from "@/lib/api-helpers"
import { savePermissions } from "@/config/permissions"

export default function RBACManagementPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [routes, setRoutes] = useState<RoutePermission[]>([])
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newRole, setNewRole] = useState({ roleId: "", description: "" })
  const [newRoute, setNewRoute] = useState({ route: "", label: "", allowedRoles: [] as string[] })
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, routesData] = await Promise.all([apiCall("/api/roles"), apiCall("/api/routes")])
        setRoles(rolesData)
        setRoutes(routesData)
        savePermissions(routesData)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const handleAddRole = async () => {
    if (!newRole.roleId || !newRole.description) {
      toast({ variant: "destructive", title: "Invalid input", description: "Please fill all fields." })
      return
    }

    if (roles.some((r) => r.roleId === newRole.roleId)) {
      toast({ variant: "destructive", title: "Role exists", description: "This role ID already exists." })
      return
    }

    try {
      const createdRole = await apiCall("/api/roles", {
        method: "POST",
        body: JSON.stringify(newRole),
      })

      setRoles([...roles, createdRole])
      setNewRole({ roleId: "", description: "" })
      setIsAddRoleOpen(false)
      toast({ title: "Role created", description: `${newRole.roleId} has been added.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (["ADMIN", "SUPERVISOR", "ANALYST"].includes(roleId)) {
      toast({ variant: "destructive", title: "Cannot delete", description: "Default roles cannot be deleted." })
      return
    }

    try {
      await apiCall(`/api/roles/${roleId}`, { method: "DELETE" })
      setRoles(roles.filter((r) => r.roleId !== roleId))
      toast({ title: "Role deleted", description: `${roleId} has been removed.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleAddRoute = async () => {
    if (!newRoute.route || !newRoute.label || newRoute.allowedRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please fill all fields and select at least one role.",
      })
      return
    }

    if (routes.some((r) => r.route === newRoute.route)) {
      toast({ variant: "destructive", title: "Route exists", description: "This route already exists." })
      return
    }

    try {
      const createdRoute = await apiCall("/api/routes", {
        method: "POST",
        body: JSON.stringify(newRoute),
      })

      const updatedRoutes = [...routes, createdRoute]
      setRoutes(updatedRoutes)
      savePermissions(updatedRoutes)
      setNewRoute({ route: "", label: "", allowedRoles: [] })
      setIsAddRouteOpen(false)
      toast({ title: "Route added", description: `${newRoute.label} has been created.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleToggleRoute = async (routeId: string) => {
    const route = routes.find((r) => r.id === routeId)
    if (!route) return

    try {
      const updatedRoute = await apiCall(`/api/routes/${routeId}`, {
        method: "PATCH",
        body: JSON.stringify({ isEnabled: !route.isEnabled }),
      })

      const updatedRoutes = routes.map((r) => (r.id === routeId ? updatedRoute : r))
      setRoutes(updatedRoutes)
      savePermissions(updatedRoutes)
      toast({ title: "Route updated", description: "Route status has been changed." })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleUpdateRouteRoles = async (routeId: string, role: string, checked: boolean) => {
    const route = routes.find((r) => r.id === routeId)
    if (!route) return

    const newRoles = checked ? [...route.allowedRoles, role] : route.allowedRoles.filter((ar) => ar !== role)

    try {
      const updatedRoute = await apiCall(`/api/routes/${routeId}`, {
        method: "PATCH",
        body: JSON.stringify({ allowedRoles: newRoles }),
      })

      const updatedRoutes = routes.map((r) => (r.id === routeId ? updatedRoute : r))
      setRoutes(updatedRoutes)
      savePermissions(updatedRoutes)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    try {
      await apiCall(`/api/routes/${routeId}`, { method: "DELETE" })
      setRoutes(routes.filter((r) => r.id !== routeId))
      toast({ title: "Route deleted", description: "Route has been removed from the system." })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">RBAC Management</h2>
            <p className="text-muted-foreground">Configure roles and route-level permissions dynamically.</p>
          </div>

          <Tabs defaultValue="routes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="routes" className="gap-2">
                <Route className="h-4 w-4" /> Route Permissions
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" /> Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="routes" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Route Permissions</CardTitle>
                    <CardDescription>Manage which roles can access specific routes</CardDescription>
                  </div>
                  <Dialog open={isAddRouteOpen} onOpenChange={setIsAddRouteOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Route
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Route</DialogTitle>
                        <DialogDescription>Define a new route and assign roles that can access it.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="route">Route Path</Label>
                          <Input
                            id="route"
                            placeholder="/reports/custom"
                            value={newRoute.route}
                            onChange={(e) => setNewRoute({ ...newRoute, route: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="label">Display Label</Label>
                          <Input
                            id="label"
                            placeholder="Custom Report"
                            value={newRoute.label}
                            onChange={(e) => setNewRoute({ ...newRoute, label: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Allowed Roles</Label>
                          <div className="space-y-2">
                            {roles.map((role) => (
                              <div key={role.roleId} className="flex items-center gap-2">
                                <Checkbox
                                  id={`new-${role.roleId}`}
                                  checked={newRoute.allowedRoles.includes(role.roleId)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setNewRoute({
                                        ...newRoute,
                                        allowedRoles: [...newRoute.allowedRoles, role.roleId],
                                      })
                                    } else {
                                      setNewRoute({
                                        ...newRoute,
                                        allowedRoles: newRoute.allowedRoles.filter((r) => r !== role.roleId),
                                      })
                                    }
                                  }}
                                />
                                <Label htmlFor={`new-${role.roleId}`} className="cursor-pointer">
                                  {role.roleId}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRouteOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRoute}>Create Route</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>Allowed Roles</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routes.map((route) => (
                          <TableRow key={route.id}>
                            <TableCell className="font-mono text-xs">{route.route}</TableCell>
                            <TableCell className="font-medium">{route.label}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {roles.map((role) => (
                                  <div key={role.roleId} className="flex items-center">
                                    <Checkbox
                                      id={`${route.id}-${role.roleId}`}
                                      checked={route.allowedRoles.includes(role.roleId)}
                                      onCheckedChange={(checked) =>
                                        handleUpdateRouteRoles(route.id!, role.roleId, checked as boolean)
                                      }
                                      className="mr-1"
                                    />
                                    <Label htmlFor={`${route.id}-${role.roleId}`} className="text-xs cursor-pointer">
                                      {role.roleId}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch checked={route.isEnabled} onCheckedChange={() => handleToggleRoute(route.id!)} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRoute(route.id!)}
                                disabled={["/dashboard", "/admin/users", "/admin/rbac"].includes(route.route)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Role Definitions</CardTitle>
                    <CardDescription>Create and manage user roles</CardDescription>
                  </div>
                  <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Add Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Role</DialogTitle>
                        <DialogDescription>Define a new role for the system.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleId">Role ID</Label>
                          <Input
                            id="roleId"
                            placeholder="MANAGER"
                            value={newRole.roleId}
                            onChange={(e) => setNewRole({ ...newRole, roleId: e.target.value.toUpperCase() })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            placeholder="Team management and oversight"
                            value={newRole.description}
                            onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddRole}>Create Role</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {roles.map((role) => (
                      <Card key={role.roleId}>
                        <CardContent className="flex items-center justify-between pt-6">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={role.color}>
                                {role.roleId}
                              </Badge>
                              {["ADMIN", "SUPERVISOR", "ANALYST"].includes(role.roleId) && (
                                <Badge variant="secondary" className="text-xs">
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={["ADMIN", "SUPERVISOR", "ANALYST"].includes(role.roleId)}
                              onClick={() => handleDeleteRole(role.roleId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
