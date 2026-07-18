'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Branch, User, UserRole } from '@/lib/types'

interface AddBranchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (branch: Branch, admin?: User) => void
  isLoading?: boolean
}

export function AddBranchModal({ open, onOpenChange, onSubmit, isLoading }: AddBranchModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    adminName: '',
    adminEmail: '',
    adminPhone: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.location) {
      alert('Please fill in branch details')
      return
    }

    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name: formData.name,
      location: formData.location,
      memberCount: 0,
      createdAt: new Date()
    }

    const branchAdmin: User | undefined = formData.adminName ? {
      id: `user_${Date.now()}`,
      email: formData.adminEmail,
      name: formData.adminName,
      role: UserRole.BRANCH_ADMIN,
      branchId: newBranch.id,
      password: Math.random().toString(36).slice(-8),
      createdAt: new Date()
    } : undefined

    onSubmit(newBranch, branchAdmin)

    setFormData({
      name: '',
      location: '',
      adminName: '',
      adminEmail: '',
      adminPhone: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Branch</DialogTitle>
          <DialogDescription>Create a new branch and assign an admin</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="branchName">Branch Name *</Label>
            <Input
              id="branchName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Lagos Branch"
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Lekki, Lagos"
              required
            />
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold mb-3">Branch Admin (Optional)</h3>

            <div>
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@example.com"
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

            <p className="text-xs text-muted-foreground mt-2">Temporary password will be generated and sent via email</p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Spinner className="w-4 h-4" />}
              Create Branch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
