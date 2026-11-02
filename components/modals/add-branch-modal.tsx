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
import { Switch } from '@/components/ui/switch'
import { Branch } from '@/lib/types'

interface AddBranchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (branch: Branch) => void
  isLoading?: boolean
  editingBranch?: Branch | null
}

export function AddBranchModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  editingBranch,
}: AddBranchModalProps) {
  const isEdit = !!editingBranch

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    isActive: true,
  })

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        name: editingBranch.name || '',
        location: editingBranch.location || '',
        isActive: editingBranch.isActive ?? true,
      })
    } else {
      setFormData({
        name: '',
        location: '',
        isActive: true,
      })
    }
  }, [editingBranch, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.location.trim()) {
      alert('Please fill in branch name and location')
      return
    }

    const branchPayload: Branch = {
      id: editingBranch?.id || `branch_${Date.now()}`,
      name: formData.name.trim(),
      location: formData.location.trim(),
      contactEmail: editingBranch?.contactEmail, // keep existing if editing
      isActive: formData.isActive,
      memberCount: editingBranch?.memberCount ?? 0,
      createdAt: editingBranch?.createdAt || new Date(),
      adminId: editingBranch?.adminId,
    }

    onSubmit(branchPayload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update branch name and location'
              : 'Create a new branch. You can assign an admin later.'}
          </DialogDescription>
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

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Branch Status</Label>
              <p className="text-xs text-muted-foreground">
                {formData.isActive ? 'Branch is active' : 'Branch is inactive'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Spinner className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}