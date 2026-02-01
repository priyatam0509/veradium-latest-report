"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Shield, Route as RouteIcon, Plus, Trash2, RefreshCw, Edit2, Info } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { awsRBACService } from "@/lib/aws-rbac-service"
import { useAuth } from "@/hooks/use-auth"

interface RoleData {
  roleId: string
  description: string
  color: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

interface RouteData {
  id?: string
  route: string
  label: string
  allowedRoles: string[]
  isEnabled: boolean
  description?: string
}

const COLOR_OPTIONS = [
  { value: "bg-red-500/10 text-red-500 border-red-500/20", label: "Red" },
  { value: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Blue" },
  { value: "bg-green-500/10 text-green-500 border-green-500/20", label: "Green" },
  { value: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Purple" },
  { value: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Yellow" },
  { value: "bg-orange-500/10 text-orange-500 border-orange-500/20", label: "Orange" },
  { value: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Pink" },
  { value: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Gray" },
]

export default function RBACManagementPage() {
  const { user: currentUser, refreshRoutes } = useAuth()
  const [roles, setRoles] = useState<RoleData[]>([])
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false)
  const [isEditRouteOpen, setIsEditRouteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [deleteRouteId, setDeleteRouteId] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [newRole, setNewRole] = useState({ 
    roleId: "", 
    description: "",
    color: COLOR_OPTIONS[0].value
  })
  const [newRoute, setNewRoute] = useState({ 
    route: "", 
    label: "", 
    description: "",
    allowedRoles: [] as string[] 
  })
  const [editRoute, setEditRoute] = useState({
    label: "",
    description: "",
    allowedRoles: [] as string[],
    isEnabled: true
  })
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    
    const loadData = async () => {
      if (cancelled) return
      await fetchData()
    }
    
    loadData()
    
    return () => {
      cancelled = true
    }
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [rolesData, routesData] = await Promise.all([
        awsRBACService.listRoles(),
        awsRBACService.listRoutes()
      ])
      // Deduplicate roles by roleId
      const uniqueRoles = rolesData.filter((role, index, self) => 
        index === self.findIndex((r) => r.roleId === role.roleId)
      )
      setRoles(uniqueRoles)
      setRoutes(routesData)
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

  const handleAddRole = async () => {
    if (!currentUser?.email) return
    
    if (!newRole.roleId || !newRole.description) {
      toast({ variant: "destructive", title: "Invalid input", description: "Please fill all fields." })
      return
    }

    try {
      const createdRole = await awsRBACService.createRole(
        currentUser.email,
        newRole.roleId.toUpperCase(),
        newRole.description,
        newRole.color
      )

      setRoles([...roles, createdRole])
      setNewRole({ roleId: "", description: "", color: COLOR_OPTIONS[0].value })
      setIsAddRoleOpen(false)
      toast({ title: "Role created", description: `${createdRole.roleId} has been added.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteRole = async () => {
    if (!currentUser?.email || !deleteRoleId) return

    try {
      await awsRBACService.deleteRole(currentUser.email, deleteRoleId)
      setRoles(roles.filter((r) => r.roleId !== deleteRoleId))
      setDeleteRoleId(null)
      toast({ title: "Role deleted", description: `${deleteRoleId} has been removed.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete role",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleAddRoute = async () => {
    if (!currentUser?.email) return
    
    if (!newRoute.route || !newRoute.label || newRoute.allowedRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please fill all fields and select at least one role.",
      })
      return
    }

    try {
      const createdRoute = await awsRBACService.createRoute(
        currentUser.email,
        newRoute.route,
        newRoute.label,
        newRoute.allowedRoles,
        newRoute.description
      )

      setRoutes([...routes, createdRoute])
      setNewRoute({ route: "", label: "", description: "", allowedRoles: [] })
      setIsAddRouteOpen(false)
      toast({ title: "Route added", description: `${newRoute.label} has been created.` })
      
      // Refresh accessible routes if needed
      await refreshRoutes()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleEditRoute = async () => {
    if (!currentUser?.email || !selectedRoute?.id) return

    try {
      const updatedRoute = await awsRBACService.updateRoute(
        currentUser.email,
        selectedRoute.id,
        editRoute
      )

      setRoutes(routes.map((r) => (r.id === selectedRoute.id ? updatedRoute : r)))
      setIsEditRouteOpen(false)
      setSelectedRoute(null)
      toast({ title: "Route updated", description: "Route has been updated successfully." })
      
      // Refresh accessible routes
      await refreshRoutes()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleToggleRoute = async (routeId: string) => {
    if (!currentUser?.email) return
    const route = routes.find((r) => r.id === routeId)
    if (!route) return

    try {
      const updatedRoute = await awsRBACService.updateRoute(
        currentUser.email,
        routeId,
        { isEnabled: !route.isEnabled }
      )

      setRoutes(routes.map((r) => (r.id === routeId ? updatedRoute : r)))
      toast({ title: "Route updated", description: `Route ${updatedRoute.isEnabled ? 'enabled' : 'disabled'}.` })
      
      // Refresh accessible routes
      await refreshRoutes()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleUpdateRouteRoles = async (routeId: string, role: string, checked: boolean) => {
    if (!currentUser?.email) return
    const route = routes.find((r) => r.id === routeId)
    if (!route) return

    const newRoles = checked 
      ? [...route.allowedRoles, role] 
      : route.allowedRoles.filter((ar) => ar !== role)

    try {
      const updatedRoute = await awsRBACService.updateRoute(
        currentUser.email,
        routeId,
        { allowedRoles: newRoles }
      )

      setRoutes(routes.map((r) => (r.id === routeId ? updatedRoute : r)))
      
      // Refresh accessible routes
      await refreshRoutes()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteRoute = async () => {
    if (!currentUser?.email || !deleteRouteId) return

    try {
      await awsRBACService.deleteRoute(currentUser.email, deleteRouteId)
      setRoutes(routes.filter((r) => r.id !== deleteRouteId))
      setDeleteRouteId(null)
      toast({ title: "Route deleted", description: "Route has been removed from the system." })
      
      // Refresh accessible routes
      await refreshRoutes()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete route",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const openEditRouteDialog = (route: RouteData) => {
    setSelectedRoute(route)
    setEditRoute({
      label: route.label,
      description: route.description || "",
      allowedRoles: route.allowedRoles,
      isEnabled: route.isEnabled
    })
    setIsEditRouteOpen(true)
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
                <RouteIcon className="h-4 w-4" /> Route Permissions
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" /> Roles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="routes" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Route Permissions ({routes.length})</CardTitle>
                    <CardDescription>Manage which roles can access specific routes</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
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
                              placeholder="Custom Reports"
                              value={newRoute.label}
                              onChange={(e) => setNewRoute({ ...newRoute, label: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Description of this route..."
                              value={newRoute.description}
                              onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Allowed Roles</Label>
                            <div className="space-y-2 border rounded-md p-3">
                              {roles.map((role) => {
                                const isAdmin = role.roleId === 'ADMIN'
                                const isChecked = isAdmin || newRoute.allowedRoles.includes(role.roleId)
                                return (
                                  <div key={role.roleId} className="flex items-center gap-2">
                                    <Checkbox
                                      id={`new-${role.roleId}`}
                                      checked={isChecked}
                                      disabled={isAdmin}
                                      onCheckedChange={(checked) => {
                                        if (isAdmin) return
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
                                    <Label 
                                      htmlFor={`new-${role.roleId}`} 
                                      className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                    >
                                      <Badge variant="outline" className={role.color}>
                                        {role.roleId}
                                      </Badge>
                                      {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                                      {isAdmin && <span className="text-xs text-muted-foreground">(Always has access)</span>}
                                    </Label>
                                  </div>
                                )
                              })}
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
                  </div>
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
                                {[...new Set(roles.map(r => r.roleId))].map((roleId) => {
                                  const role = roles.find(r => r.roleId === roleId)
                                  if (!role) return null
                                  const isAdmin = roleId === 'ADMIN'
                                  const allowedRoles = route.allowedRoles || []
                                  const isChecked = isAdmin || allowedRoles.includes(roleId)
                                  return (
                                    <div key={`${route.id}-${roleId}`} className="flex items-center gap-1">
                                      <Checkbox
                                        id={`route-${route.id}-role-${roleId}`}
                                        checked={isChecked}
                                        disabled={isAdmin}
                                        onCheckedChange={(checked) =>
                                          !isAdmin && handleUpdateRouteRoles(route.id!, roleId, checked as boolean)
                                        }
                                      />
                                      <Label 
                                        htmlFor={`route-${route.id}-role-${roleId}`} 
                                        className={`text-xs ${isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                      >
                                        <Badge variant="outline" className={role.color}>
                                          {roleId}
                                        </Badge>
                                      </Label>
                                    </div>
                                  )
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={route.isEnabled} 
                                onCheckedChange={() => handleToggleRoute(route.id!)} 
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditRouteDialog(route)}
                                  title="Edit route"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteRouteId(route.id!)}
                                  title="Delete route"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {routes.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                              No routes found. Create one to get started.
                            </TableCell>
                          </TableRow>
                        )}
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
                    <CardTitle>Role Definitions ({roles.length})</CardTitle>
                    <CardDescription>Create and manage user roles</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
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
                            <Textarea
                              id="description"
                              placeholder="Team management and oversight"
                              value={newRole.description}
                              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Color Theme</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {COLOR_OPTIONS.map((colorOption) => (
                                <button
                                  key={colorOption.value}
                                  type="button"
                                  onClick={() => setNewRole({ ...newRole, color: colorOption.value })}
                                  className={`p-3 border-2 rounded-md transition-all ${
                                    newRole.color === colorOption.value ? 'border-primary' : 'border-border'
                                  }`}
                                >
                                  <Badge variant="outline" className={colorOption.value}>
                                    {colorOption.label}
                                  </Badge>
                                </button>
                              ))}
                            </div>
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
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {roles.map((role) => (
                      <Card key={role.roleId}>
                        <CardContent className="flex items-center justify-between pt-6">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={role.color}>
                                {role.roleId}
                              </Badge>
                              {role.isSystem && (
                                <Badge variant="secondary" className="text-xs">
                                  System
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Info className="h-3 w-3" />
                              <span>{routes.filter(r => (r.allowedRoles || []).includes(role.roleId)).length} routes accessible</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={role.isSystem}
                              onClick={() => setDeleteRoleId(role.roleId)}
                              title={role.isSystem ? "Cannot delete system role" : "Delete role"}
                            >
                              <Trash2 className={`h-4 w-4 ${role.isSystem ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {roles.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-muted-foreground">
                        No roles found.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Route Dialog */}
          <Dialog open={isEditRouteOpen} onOpenChange={setIsEditRouteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Route</DialogTitle>
                <DialogDescription>
                  Update route details and permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Route Path (cannot be changed)</Label>
                  <Input value={selectedRoute?.route || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLabel">Display Label</Label>
                  <Input
                    id="editLabel"
                    value={editRoute.label}
                    onChange={(e) => setEditRoute({ ...editRoute, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editRoute.description}
                    onChange={(e) => setEditRoute({ ...editRoute, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allowed Roles</Label>
                  <div className="space-y-2 border rounded-md p-3">
                    {roles.map((role) => {
                      const isAdmin = role.roleId === 'ADMIN'
                      const isChecked = isAdmin || editRoute.allowedRoles.includes(role.roleId)
                      return (
                        <div key={role.roleId} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-${role.roleId}`}
                            checked={isChecked}
                            disabled={isAdmin}
                            onCheckedChange={(checked) => {
                              if (isAdmin) return
                              if (checked) {
                                setEditRoute({
                                  ...editRoute,
                                  allowedRoles: [...editRoute.allowedRoles, role.roleId],
                                })
                              } else {
                                setEditRoute({
                                  ...editRoute,
                                  allowedRoles: editRoute.allowedRoles.filter((r) => r !== role.roleId),
                                })
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`edit-${role.roleId}`} 
                            className={`flex items-center gap-2 ${isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                          >
                            <Badge variant="outline" className={role.color}>
                              {role.roleId}
                            </Badge>
                            {isAdmin && <span className="text-xs text-muted-foreground">(Always has access)</span>}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Route Enabled</Label>
                  <Switch
                    checked={editRoute.isEnabled}
                    onCheckedChange={(checked) => setEditRoute({ ...editRoute, isEnabled: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditRouteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditRoute}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Role Confirmation */}
          <AlertDialog open={deleteRoleId !== null} onOpenChange={(open) => !open && setDeleteRoleId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Role</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this role? This action cannot be undone.
                  {deleteRoleId && (
                    <span className="block mt-2 font-medium text-foreground">
                      {deleteRoleId}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Role
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Route Confirmation */}
          <AlertDialog open={deleteRouteId !== null} onOpenChange={(open) => !open && setDeleteRouteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Route</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this route? This action cannot be undone.
                  {deleteRouteId && (
                    <span className="block mt-2 font-medium text-foreground">
                      {routes.find(r => r.id === deleteRouteId)?.route}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRoute} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Route
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
