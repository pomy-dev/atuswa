'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { canSee } from '@/lib/constants'
import { UserRole, Branch, User, Role, Permission } from '@/lib/types'
import { getAllPermissions, getAllRoles } from '@/lib/utils'
import {
  Plus,
  MapPin,
  Users,
  Mail,
  Calendar,
  Pencil,
  Trash2,
  Power,
  UserPlus,
  MoreHorizontal,
} from 'lucide-react'
import { AddBranchModal } from '@/components/modals/add-branch-modal'
import { AssignBranchAdminModal } from '@/components/modals/assign-branch-admin-modal'
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { recordActivityLog } from '@/lib/constants'
import { useUserIP } from '@/lib/userUserIp'

export default function BranchesPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const [branches, setBranches] = useState<Branch[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [assigningBranch, setAssigningBranch] = useState<Branch | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('branches') || '[]')
    const normalized = stored.map((b: any) => ({
      ...b,
      isActive: b.isActive ?? true,
      contactEmail: b.contactEmail ?? '',
      createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
    }))
    setBranches(normalized)
  }, [])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

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

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user]);

  if (canSee(user?.role ?? '', roles.map(role => role.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Only the Secretary General can manage branches.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const memberCounts = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('members') || '[]')
    const counts: Record<string, number> = {}
    members.forEach((m: any) => {
      counts[m.branchId] = (counts[m.branchId] || 0) + 1
    })
    return counts
  }, [branches])

  const persistBranches = (updated: Branch[]) => {
    setBranches(updated)
    localStorage.setItem('branches', JSON.stringify(updated))
  }

  const handleToggleActive = (branchId: string) => {
    const updated = branches.map((b) =>
      b.id === branchId ? { ...b, isActive: !b.isActive } : b
    )
    persistBranches(updated)
  }

  const handleRemove = (branchId: string) => {
    if (!confirm('Are you sure you want to remove this branch? This cannot be undone.')) {
      return
    }
    persistBranches(branches.filter((b) => b.id !== branchId))
    recordActivityLog('Remove', 'Removed and cancelled branch', user?.id, user?.name, ip!)
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    setShowAddModal(true)
  }

  const handleAssignAdmin = (branch: Branch) => {
    setAssigningBranch(branch)
    setShowAssignModal(true)
    recordActivityLog('Assign', `Assign Branch Admin - ${branch}`, user?.id, user?.name, ip!)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branches</h1>
          <p className="text-muted-foreground mt-1">
            Manage union branches across regions
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBranch(null)
            setShowAddModal(true)
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Branch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Branches</CardTitle>
        </CardHeader>
        <CardContent>
          {branches.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No branches yet. Create the first one.
            </p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact Email</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {branch.name}
                          {branch.id === 'branch_main' && (
                            <Badge variant="secondary" className="text-xs">
                              HQ
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(branch.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {branch.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {branch.contactEmail ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                            {branch.contactEmail}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          {memberCounts[branch.id] ?? branch.memberCount ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={branch.isActive ? 'default' : 'secondary'}
                          className={
                            branch.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-600'
                          }
                        >
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'h-8 w-8' })}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(branch)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleAssignAdmin(branch)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              {branch.adminId ? 'Re-assign Admin' : 'Assign Admin'}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleToggleActive(branch.id)}>
                              <Power className="mr-2 h-4 w-4" />
                              {branch.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleRemove(branch.id)}
                              disabled={branch.id === 'branch_main'}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Branch Modal */}
      <AddBranchModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) setEditingBranch(null)
        }}
        editingBranch={editingBranch}
        onSubmit={(branch) => {
          setIsLoading(true)
          try {
            if (editingBranch) {
              const updated = branches.map((b) =>
                b.id === editingBranch.id ? { ...b, ...branch } : b
              )
              persistBranches(updated)
            } else {
              persistBranches([...branches, branch])
            }
            setShowAddModal(false)
            setEditingBranch(null)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />

      {/* Assign Admin Modal */}
      <AssignBranchAdminModal
        open={showAssignModal}
        onOpenChange={(open) => {
          setShowAssignModal(open)
          if (!open) setAssigningBranch(null)
        }}
        branch={assigningBranch}
        onSubmit={(updatedBranch, admin) => {
          setIsLoading(true)
          try {
            // Update branch
            const updatedBranches = branches.map((b) =>
              b.id === updatedBranch.id ? updatedBranch : b
            )
            persistBranches(updatedBranches)

            // Add / replace the admin user
            const allUsers: User[] = JSON.parse(localStorage.getItem('users') || '[]')

            // Optional: remove previous admin of this branch if you want strict 1-admin-per-branch
            const filteredUsers = allUsers.filter(
              (u) => !(u.role === UserRole.BRANCH_ADMIN && u.branchId === updatedBranch.id)
            )

            localStorage.setItem('users', JSON.stringify([...filteredUsers, admin]))

            setShowAssignModal(false)
            setAssigningBranch(null)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}