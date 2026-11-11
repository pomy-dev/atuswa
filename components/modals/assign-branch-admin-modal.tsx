'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Branch, AppUser, UserRole } from '@/lib/types'
import { Search } from 'lucide-react'

interface AssignBranchAdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch: Branch | null
  branches: Branch[]
  users: AppUser[]
  onSubmit: (updatedBranch: Branch, admin: AppUser) => void
  isLoading?: boolean
}

function getUserDisplayName(user: AppUser): string {
  return (
    user.full_name ||
    (user as any).fullName ||
    user.email ||
    'Unnamed user'
  )
}

function getUserEmail(user: AppUser): string {
  return user.email || ''
}

export function AssignBranchAdminModal({
  open,
  onOpenChange,
  branch,
  branches,
  users,
  onSubmit,
  isLoading,
}: AssignBranchAdminModalProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(
    undefined
  )
  const [search, setSearch] = useState('')

  const selectableUsers = useMemo(() => {
    const assignedAdminIds = new Set(
      branches
        .map((item) => {
          const branchRecord = item as Branch & { admin_id?: string | null }
          return branchRecord.adminId ?? branchRecord.admin_id
        })
        .filter((id): id is string => Boolean(id))
        .map(String)
    )
    const seen = new Set<string>()

    return (users ?? []).filter((candidate) => {
      const id = candidate?.id != null ? String(candidate.id) : ''
      const roleName = candidate.role?.name?.trim().toLowerCase().replace(/[_-]+/g, ' ')
      const isSecretaryGeneral =
        candidate.role_id === UserRole.SECRETARY_GENERAL ||
        roleName === 'secretary general'

      if (
        !id ||
        seen.has(id) ||
        isSecretaryGeneral ||
        assignedAdminIds.has(id)
      ) {
        return false
      }

      seen.add(id)
      return true
    })
  }, [branches, users])

  // Reset / prefill when modal opens for a branch
  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedAdminId(undefined)
      return
    }

    if (branch) {
      const currentId = branch.adminId || (branch as any).admin_id || undefined
      // Only keep selection if that user still exists in the list
      const exists = currentId
        ? selectableUsers.some((u) => String(u.id) === String(currentId))
        : false
      setSelectedAdminId(exists ? String(currentId) : undefined)
    }
  }, [branch, open, selectableUsers])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return selectableUsers
    return selectableUsers.filter((user) => {
      const name = getUserDisplayName(user).toLowerCase()
      const email = getUserEmail(user).toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }, [selectableUsers, search])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!branch) return
    if (!selectedAdminId) {
      alert('Please select an admin')
      return
    }

    const selectedAdmin = selectableUsers.find(
      (user) => String(user.id) === String(selectedAdminId)
    )

    if (!selectedAdmin) {
      alert('Selected admin not found')
      return
    }

    const admin: AppUser = {
      ...selectedAdmin,
      branchId: branch.id,
      // Only set if your AppUser / backend expects this
      role_id: (UserRole as any)?.BRANCH_ADMIN ?? selectedAdmin.role_id,
    }

    const updatedBranch: Branch = {
      ...branch,
      contactEmail: selectedAdmin.email,
      adminId: selectedAdmin.id,
      admin: selectedAdmin,
    }

    onSubmit(updatedBranch, admin)
  }

  if (!branch) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Branch Admin</DialogTitle>
          <DialogDescription>
            Assign an admin for <strong>{branch.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 pt-2">
            {/* Optional search when the list is long */}
            {selectableUsers.length > 8 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-select">Select Admin *</Label>

              {selectableUsers.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No eligible users available. Secretary General accounts and
                  users already assigned to a branch cannot be selected.
                </p>
              ) : (
                <select
                  id="admin-select"
                  required
                  value={selectedAdminId ?? ''}
                  onChange={(event) =>
                    setSelectedAdminId(event.target.value || undefined)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="" disabled>
                    {filteredUsers.length === 0
                      ? 'No users match your search'
                      : 'Select a user'}
                  </option>
                  {filteredUsers.map((user) => {
                    const id = String(user.id)
                    const name = getUserDisplayName(user)
                    const email = getUserEmail(user)
                    return (
                      <option key={id} value={id}>
                        {name}
                        {email ? ` (${email})` : ''}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              The selected user will be assigned as the branch administrator.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !selectedAdminId || selectableUsers.length === 0
              }
              className="gap-2"
            >
              {isLoading && <Spinner className="h-4 w-4" />}
              Assign Admin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}