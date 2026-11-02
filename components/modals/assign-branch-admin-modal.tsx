'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Branch, User, UserRole } from '@/lib/types'

interface AssignBranchAdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branch: Branch | null
  onSubmit: (updatedBranch: Branch, admin: User) => void
  isLoading?: boolean
}

export function AssignBranchAdminModal({
  open,
  onOpenChange,
  branch,
  onSubmit,
  isLoading,
}: AssignBranchAdminModalProps) {
  const [formData, setFormData] = useState({
    contactEmail: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  })

  useEffect(() => {
    if (branch && open) {
      setFormData({
        contactEmail: branch.contactEmail || '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
      })
    }
  }, [branch, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!branch) return

    if (!formData.adminName.trim() || !formData.adminEmail.trim()) {
      alert('Please provide admin name and email')
      return
    }

    const admin: User = {
      id: `user_${Date.now()}`,
      name: formData.adminName.trim(),
      email: formData.adminEmail.trim(),
      role: UserRole.BRANCH_ADMIN,
      branchId: branch.id,
      password: Math.random().toString(36).slice(-8),
      createdAt: new Date(),
      // phone: formData.adminPhone.trim() || undefined, // uncomment if your User type has phone
    }

    const updatedBranch: Branch = {
      ...branch,
      contactEmail: formData.contactEmail.trim() || formData.adminEmail.trim(),
      adminId: admin.id,
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
            Assign an admin and contact email for <strong>{branch.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contactEmail">Branch Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="branch@tucoswa.org (optional – defaults to admin email)"
            />
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold mb-3">Admin Details</h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="adminName">Admin Name *</Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adminEmail">Admin Email *</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="adminPhone">Admin Phone</Label>
                <Input
                  id="adminPhone"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                  placeholder="+234-XXX-XXXX"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              A temporary password will be generated and should be sent to the admin via email.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Spinner className="w-4 h-4" />}
              Assign Admin
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}