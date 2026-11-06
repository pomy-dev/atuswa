'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth-context'
import { Permission, Role, AppUser } from '@/lib/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  Plus,
  Search,
  Download,
  MoreVertical,
  Eye,
  Pencil,
  Key,
  FileDown, RotateCcwKey,
  Trash2,
  Filter,
  Calendar,
  Activity,
  Users,
  ShieldCheck,
  Clock,
  KeyRound,
} from 'lucide-react'
import {
  getAllPermissions, createRole, getAllRoles, updateRole,
  getAllUsersWithRoles, createUserAccount, updateUserAccount,
  resendInvitation, deleteUserAccount
} from '@/lib/utils'
import { cn, canSee, formatLabel, menuItems } from '@/lib/constants'
import { FullScreenLoader } from '@/components/fullScreenLoader'

interface ActivityLogEntry {
  id: string
  userId: string
  userName: string
  action: string
  details?: string
  timestamp: string
  ip?: string
}

const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log1',
    userId: 'u1',
    userName: 'Jane Doe',
    action: 'Login',
    details: 'Successful login',
    timestamp: '2025-11-01T18:22:00Z',
    ip: '192.168.1.10',
  },
  {
    id: 'log2',
    userId: 'u2',
    userName: 'John Smith',
    action: 'Updated user',
    details: 'Changed role of Maria Garcia',
    timestamp: '2025-10-28T10:05:00Z',
  },
  {
    id: 'log3',
    userId: 'u1',
    userName: 'Jane Doe',
    action: 'Created role',
    details: 'Created role "Moderator"',
    timestamp: '2025-10-25T14:12:00Z',
  },
  {
    id: 'log4',
    userId: 'u3',
    userName: 'Maria Garcia',
    action: 'Login',
    details: 'Successful login',
    timestamp: '2025-08-14T13:00:00Z',
  },
]

// ---------- Component ----------
export default function UserManagementPage() {
  const { user } = useAuth()

  // Data state (replace localStorage / API calls as needed)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [logs] = useState<ActivityLogEntry[]>(INITIAL_LOGS)

  // UI state
  const [activeTab, setActiveTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // Sheet (slide-over) state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    status: 'inactive' as 'inactive' | 'active',
  })

  // Role form state
  const [roleSheetOpen, setRoleSheetOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    accesses: menuItems,
    description: '',
    permissions: [] as Permission[],
  })

  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (!user) return;

    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const [loadedRoles, loadedPermissions] = await Promise.all([
        getAllRoles(supabase, session),
        getAllPermissions(supabase, session),
      ])

      if (!cancelled) {
        setRoles(loadedRoles ?? [])
        setPermissions(loadedPermissions ?? [])
      }
    }

    const loadUsers = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return
      const loadedUsers = await getAllUsersWithRoles(supabase, session)

      if (!cancelled) {
        setUsers(loadedUsers ?? [])
      }
    }

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })
    void loadUsers().catch((error: unknown) => {
      console.error('Unable to load users:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user]);

  // ---------- Helpers ----------
  const getRoleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.name ?? 'Unknown'

  const getRolePermissionIds = (role: Role): string[] =>
    (role.permissions as unknown[]).flatMap((permission) => {
      if (typeof permission === 'string') return [permission]
      if (!permission || typeof permission !== 'object') return []

      const permissionRecord = permission as Record<string, unknown>
      const id = permissionRecord.id ?? permissionRecord.permission_id
      return typeof id === 'string' ? [id] : []
    })

  const getRoleAccesses = (role: Role): string[] => {
    const menuItemLabels = menuItems.map(item => item.label)
    const roleAcesses = menuItemLabels.filter(label => role.accesses?.includes(label))
    return roleAcesses
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getRoleName(u.role_id).toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || u.status === statusFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const created = new Date(u.createdAt)
        const now = new Date()
        if (dateFilter === '7d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 7))
        } else if (dateFilter === '30d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 30))
        } else if (dateFilter === '90d') {
          matchesDate = created >= new Date(now.setDate(now.getDate() - 90))
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [users, searchQuery, statusFilter, dateFilter, roles])

  // ---------- User actions ----------
  const openAddUser = () => {
    setEditingUser(null)
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      roleId: roles[0]?.id ?? '',
      status: 'inactive',
    })
    setSheetOpen(true)
  }

  const openEditUser = (u: AppUser) => {
    setEditingUser(u)
    setFormData({
      fullName: u.full_name,
      email: u.email,
      phone: u.phone ?? '',
      roleId: u.role_id,
      status: u.status,
    })
    setSheetOpen(true)
  }

  const handleSaveUser = useCallback(async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      setSaving(true)
      if (editingUser) {
        const userPayload = {
          user_id: editingUser?.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.roleId,
          status: formData.status
        }

        const updatedUser = await updateUserAccount(supabase, session, userPayload)

        if (updatedUser) {
          setUsers((prev) => prev.map((u) => u.id === editingUser.id
            ? {
              ...u,
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone || undefined,
              roleId: formData.roleId,
              status: formData.status,
            }
            : u
          )
          )

          toast.success("User updated successfully")
        }

      } else {
        const newUser: AppUser = {
          id: `u_${Date.now()}`,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role_id: formData.roleId,
          status: formData.status,
          createdAt: new Date().toISOString(),
        }

        const createdUser = await createUserAccount(supabase, session, newUser)

        if (createdUser) { setUsers((prev) => [...prev, newUser]); toast.success("Account created.") }
      }
      setSheetOpen(false)
    } catch (err) {
      toast.error(`Encountered error: ${err}`)
      throw new Error(`Encountered error: ${err}`)
    } finally {
      setSaving(false)
    }


  }, [editingUser, formData]);

  const handleResendInvitation = useCallback(async (user: any) => {

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your session has expired. Please log in again.");
      }

      await resendInvitation(
        supabase,
        session,
        user.id
      );

      toast.success("Invitation email sent successfully.");

    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation.");
    }
  }, []);

  const handleDeleteUser = useCallback(async (id: string) => {
    if (!id) return

    if (confirm('Are you sure you want to delete this user?')) {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) throw new Error('You must be signed in to manage roles.')

      try {
        setRemoving(true)
        const res = await deleteUserAccount(supabase, session, id)

        res && setUsers((prev) => prev.filter((u) => u.id !== id))
      } catch (error) {
        toast.error(`Failed to remove account. ${error}`)
        throw new Error(`Encountered error: ${error}`)
      } finally {
        setRemoving(false)
      }
    }
  }, [])

  const handleExportUsers = () => {
    // Simple CSV export example
    const headers = ['Role', 'Full Name', 'Email', 'Date Created', 'Status']
    const rows = filteredUsers.map((u) => [
      getRoleName(u.role_id),
      u.full_name,
      u.email,
      new Date(u.createdAt).toLocaleDateString(),
      u.status,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ---------- Role actions ----------
  const openAddRole = () => {
    setEditingRole(null)
    setRoleForm({ name: '', accesses: [], description: '', permissions: [] })
    setRoleSheetOpen(true)
  }

  const openEditRole = (role: Role) => {
    const selectedPermissionIds = new Set(getRolePermissionIds(role))
    const selectedAccess = new Set(getRoleAccesses(role))
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      accesses: menuItems.filter(item => selectedAccess.has(item.label)),
      description: role.description ?? '',
      permissions: permissions.filter((permission) =>
        selectedPermissionIds.has(permission.id)
      ),
    })
    console.log('Editing role:', role)
    setRoleSheetOpen(true)
  }

  const handleSaveRole = useCallback(async () => {
    if (!roleForm.name.trim()) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!session) throw new Error('You must be signed in to manage roles.')

    try {
      setSaving(true)
      if (editingRole) {
        const rolePayload: Role = {
          id: editingRole.id,
          name: roleForm.name,
          accesses: roleForm.accesses.map(item => item.label),
          description: roleForm.description,
          permissions: roleForm.permissions.map((p) => p.id),
          createdAt: editingRole.createdAt
        }
        const updatedRole = await updateRole(supabase, session, rolePayload)

        if (updatedRole) {
          setRoles((prev) =>
            prev.map((role) =>
              role.id === editingRole.id
                ? {
                  ...role,
                  name: roleForm.name,
                  accesses: roleForm.accesses.map(item => item.label),
                  description: roleForm.description,
                  permissions: roleForm.permissions.map((p) => p.id),
                }
                : role
            )
          )
        }
      } else {
        const rolePayload: Role = {
          id: `role_${Date.now()}`,
          name: roleForm.name,
          accesses: roleForm.accesses.map(item => item.label),
          description: roleForm.description,
          permissions: roleForm.permissions.map((p) => p.id),
          createdAt: new Date().toISOString(),
        }
        const newRole = await createRole(supabase, session, rolePayload);
        if (newRole) {
          setRoles((prevRoles) => [...prevRoles, newRole])
        };
      }
      setRoleSheetOpen(false)
    } catch (error) {
      throw new Error(`Encountered error: ${error}`)
    } finally {
      setSaving(false)
    }
  }, [editingRole, roleForm])

  const togglePermission = (permissionToToggle: Permission) => {
    setRoleForm((prev) => {
      const isSelected = prev.permissions.some(
        (p: Permission) => p.id === permissionToToggle.id
      );

      return {
        ...prev,
        permissions: isSelected
          ? prev.permissions.filter(
            (p: Permission) => p.id !== permissionToToggle.id
          )
          : [...prev.permissions, permissionToToggle],
      };
    });
  };

  const toggleAccess = (accessToToggle: string) => {
    setRoleForm((prev) => {
      const isSelected = prev.accesses.some((item: any) => item.label === accessToToggle);

      return {
        ...prev,
        accesses: isSelected
          ? prev.accesses.filter((item: any) => item.label !== accessToToggle)
          : [...prev.accesses, menuItems.find(item => item.label === accessToToggle)!],
      };
    });
  };

  // Access control (adjust as needed)
  if (canSee(user?.role ?? '', roles.map(role => role.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Only the Secretary General can manage users and roles.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------- Render ----------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage roles, users, and activity across the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="w-4 h-4" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* ==================== USER ROLES TAB ==================== */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Define roles and configure their permissions
            </p>
            <Button onClick={openAddRole} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Role
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{formatLabel(role.name)}</CardTitle>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditRole(role)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {getRolePermissionIds(role).slice(0, 4).map((permissionId) => {
                      const permission = permissions.find((p) => p.id === permissionId)
                      return (
                        <Badge key={permissionId} variant="secondary" className="text-xs">
                          {permission?.label ?? permissionId}
                        </Badge>
                      )
                    })}
                    {getRolePermissionIds(role).length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{getRolePermissionIds(role).length - 4} more
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ==================== USERS TAB ==================== */}
        <TabsContent value="users" className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-1 flex-wrap gap-2 items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as string)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as string)}>
                <SelectTrigger className="w-[160px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Date Created" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportUsers} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button onClick={openAddUser} className="gap-2">
                <Plus className="w-4 h-4" />
                Add User
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Badge variant="outline">{getRoleName(u.role_id)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.phone}</TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.status === 'active' ? 'default' : 'secondary'}
                            className={cn(
                              u.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({ variant: 'ghost', size: 'icon' })}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.role?.permissions.map(perm => perm === "Read") && <DropdownMenuItem
                                onClick={() => {
                                  openEditUser(u)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              }

                              {u.role?.permissions.map(perm => perm === "Write") && <DropdownMenuItem onClick={() => openEditUser(u)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>}

                              {u.role?.permissions.map(perm => perm === "Export") && <DropdownMenuItem
                                onClick={() => {
                                  // Export single user details
                                  const data = JSON.stringify(u, null, 2)
                                  const blob = new Blob([data], { type: 'application/json' })
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `${u.full_name.replace(/\s+/g, '_')}_details.json`
                                  a.click()
                                  URL.revokeObjectURL(url)
                                }}
                              >
                                <FileDown className="w-4 h-4 mr-2" />
                                Export Details
                              </DropdownMenuItem>}

                              {(user?.role?.toLowerCase() === "Secretary General".toLowerCase() && u?.status === "inactive") && (
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(u)}
                                >
                                  <RotateCcwKey className="w-4 h-4 mr-2" />
                                  Resend Invite
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />
                              {user?.role?.toLowerCase() === "Secretary General".toLowerCase() && <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteUser(u.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ACTIVITY LOG TAB ==================== */}
        <TabsContent value="activity" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recent activity across all users, including last login events
          </p>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No activity recorded yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.userName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.action.toLowerCase().includes('login') ? (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Activity className="w-4 h-4 text-muted-foreground" />
                            )}
                            {log.action}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {log.details ?? '—'}
                        </TableCell>
                        <TableCell>
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.ip ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Optional: Last login summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Last Login Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div>
                      <p className="font-medium text-sm">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Last login</p>
                      <p className="text-sm">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========== Slide-over Sheet for Add / Edit User ========== */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right px-6"
        >
          <SheetHeader>
            <SheetTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </SheetTitle>
            <SheetDescription>
              {editingUser
                ? 'Update user details and permissions.'
                : 'Fill in the details to create a new user account.'}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                placeholder="Jane Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="jane.doe@union.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+268 0000 0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={roles.find((role) => role.id === formData.roleId)?.name}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, roleId: val ?? '' }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  Active users can sign in
                </p>
              </div>
              <Switch
                checked={formData.status === 'active'}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: checked ? 'active' : 'inactive',
                  }))
                }
              />
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={saving}>
              {editingUser ? saving ? 'Saving...' : 'Save Changes' : saving ? 'Creating...' : 'Create User'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ========== Slide-over Sheet for Add / Edit Role ========== */}
      <Sheet open={roleSheetOpen} onOpenChange={setRoleSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto transition-transform duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right px-6"
        >
          <SheetHeader>
            <SheetTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </SheetTitle>
            <SheetDescription>
              Name the role and select the permissions it should have.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Moderator"
                disabled={roleForm.name?.toLowerCase() === "Secretary General".toLowerCase()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleDesc">Description</Label>
              <Textarea
                id="roleDesc"
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">System Access</Label>
              <div className="space-y-3 border rounded-lg p-3">
                {menuItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={item.label}
                      checked={roleForm.accesses.some((a: any) => a.label === item.label)}
                      onCheckedChange={() => toggleAccess(item.label)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={item.label}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {item.label}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-3 border rounded-lg p-3">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={perm.id}
                      checked={roleForm.permissions.some((p: any) => p.id === perm.id)}
                      onCheckedChange={() => togglePermission(perm)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {perm.label}
                      </label>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setRoleSheetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {editingRole ? saving ? 'Saving...' : 'Save Role' : saving ? 'Creating...' : 'Create Role'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <FullScreenLoader isLoading={removing} />
    </div>
  );
}