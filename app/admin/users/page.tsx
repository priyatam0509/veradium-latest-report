"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, UserMinus, UserCheck, Search, Eye, Edit2, Trash2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { awsRBACService } from "@/lib/aws-rbac-service"
import { useAuth } from "@/hooks/use-auth"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface UserData {
  email: string
  userId: string
  role: string
  displayName: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface RoleData {
  roleId: string
  description: string
  color: string
  isSystem: boolean
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [viewUserRoutes, setViewUserRoutes] = useState<string | null>(null)
  const [userRoutesData, setUserRoutesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [newUser, setNewUser] = useState({
    email: "",
    displayName: "",
    role: "",
  })
  const [editUser, setEditUser] = useState({
    role: "",
    displayName: "",
    isEnabled: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    if (!currentUser?.email) return
    
    setIsLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        awsRBACService.listUsers(currentUser.email),
        awsRBACService.listRoles()
      ])
      setUsers(usersData)
      setRoles(rolesData)
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

  const handleAddUser = async () => {
    if (!currentUser?.email) return
    
    if (!newUser.email || !newUser.displayName || !newUser.role) {
      toast({ variant: "destructive", title: "Invalid input", description: "Please fill all fields." })
      return
    }

    try {
      const createdUser = await awsRBACService.createUser(
        currentUser.email,
        newUser.email,
        newUser.role,
        newUser.displayName
      )

      setUsers([...users, createdUser])
      setIsAddUserOpen(false)
      setNewUser({ email: "", displayName: "", role: "" })
      toast({ title: "User added", description: `${createdUser.email} has been created.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleEditUser = async () => {
    if (!currentUser?.email || !selectedUser) return

    try {
      const updatedUser = await awsRBACService.updateUser(
        currentUser.email,
        selectedUser.email,
        editUser
      )

      setUsers(users.map((u) => (u.email === selectedUser.email ? updatedUser : u)))
      setIsEditUserOpen(false)
      setSelectedUser(null)
      toast({ title: "User updated", description: `${updatedUser.email} has been updated.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const toggleUserStatus = async (email: string) => {
    if (!currentUser?.email) return
    const user = users.find((u) => u.email === email)
    if (!user) return

    try {
      const updatedUser = await awsRBACService.updateUser(
        currentUser.email,
        email,
        { isEnabled: !user.isEnabled }
      )

      setUsers(users.map((u) => (u.email === email ? updatedUser : u)))
      toast({ title: "Status updated", description: `User ${updatedUser.isEnabled ? 'enabled' : 'disabled'}.` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!currentUser?.email || !deleteUserId) return

    try {
      await awsRBACService.deleteUser(currentUser.email, deleteUserId)
      setUsers(users.filter((u) => u.email !== deleteUserId))
      setDeleteUserId(null)
      toast({ title: "User deleted", description: "User has been removed from the system." })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user)
    setEditUser({
      role: user.role,
      displayName: user.displayName,
      isEnabled: user.isEnabled,
    })
    setIsEditUserOpen(true)
  }

  const loadUserRoutes = async (email: string, role: string) => {
    try {
      const response = await awsRBACService.getAccessibleRoutes(email)
      setUserRoutesData(response.routes)
      setViewUserRoutes(email)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load routes",
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const filteredUsers = users.filter((u) => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleColor = (roleId: string) => {
    const role = roles.find((r) => r.roleId === roleId)
    return role?.color || "bg-gray-500/10 text-gray-500 border-gray-500/20"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">Manage system users with Microsoft Entra ID integration.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. Email must match their Microsoft Entra ID account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@company.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        placeholder="John Doe"
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">User Role</Label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.roleId} value={role.roleId}>
                              <div className="flex items-center gap-2">
                                <span>{role.roleId}</span>
                                {role.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users ({users.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
              <div className="relative w-full max-w-sm mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.email}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isEnabled ? "outline" : "destructive"}>
                            {user.isEnabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.lastLogin || '')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => loadUserRoutes(user.email, user.role)}
                              title="View accessible routes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleUserStatus(user.email)}
                              title={user.isEnabled ? 'Disable user' : 'Enable user'}
                            >
                              {user.isEnabled ? (
                                <UserMinus className="h-4 w-4 text-orange-500" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteUserId(user.email)}
                              disabled={user.email === currentUser?.email}
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          {searchTerm ? 'No users match your search.' : 'No users found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user role, status, or display name.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email (cannot be changed)</Label>
                  <Input value={selectedUser?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDisplayName">Display Name</Label>
                  <Input
                    id="editDisplayName"
                    value={editUser.displayName}
                    onChange={(e) => setEditUser({ ...editUser, displayName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.roleId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="editEnabled">Account Enabled</Label>
                  <Button
                    variant={editUser.isEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditUser({ ...editUser, isEnabled: !editUser.isEnabled })}
                  >
                    {editUser.isEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditUser}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* View Routes Dialog */}
          <Dialog open={viewUserRoutes !== null} onOpenChange={(open) => !open && setViewUserRoutes(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Accessible Routes</DialogTitle>
                <DialogDescription>
                  Routes that {viewUserRoutes} can access based on their role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {userRoutesData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No accessible routes
                  </div>
                ) : (
                  userRoutesData.map((route) => (
                    <div
                      key={route.route}
                      className="flex items-start justify-between p-3 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{route.label}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">{route.route}</p>
                        {route.description && (
                          <p className="text-xs text-muted-foreground mt-1">{route.description}</p>
                        )}
                      </div>
                      <Badge variant={route.isEnabled ? "outline" : "secondary"} className="ml-2">
                        {route.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this user? This action cannot be undone.
                  {deleteUserId && (
                    <span className="block mt-2 font-medium text-foreground">
                      {users.find(u => u.email === deleteUserId)?.email}
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
