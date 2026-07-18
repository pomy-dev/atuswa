'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { BoardMember } from '@/lib/types'

interface AddBoardMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (member: Omit<BoardMember, 'id' | 'createdAt'>) => void
  isLoading?: boolean
}

export function AddBoardMemberModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false
}: AddBoardMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    responsibilities: '',
    branchId: 'branch_main',
    isAdmin: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.position) {
      alert('Please fill in all required fields')
      return
    }
    
    onSubmit({
      name: formData.name,
      email: formData.email,
      position: formData.position,
      responsibilities: formData.responsibilities,
      branchId: formData.branchId,
      isAdmin: formData.isAdmin
    })
    
    setFormData({
      name: '',
      email: '',
      position: '',
      responsibilities: '',
      branchId: 'branch_main',
      isAdmin: false
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Board Member</DialogTitle>
          <DialogDescription>Add a new board member to leadership</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="john@union.org"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="position">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="General Secretary"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="responsibilities">Responsibilities</Label>
            <Textarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
              placeholder="Key responsibilities..."
              disabled={isLoading}
              className="min-h-24"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 gap-2"
            >
              {isLoading && <Spinner className="w-4 h-4" />}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
