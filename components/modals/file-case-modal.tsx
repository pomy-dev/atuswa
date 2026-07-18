'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { HelpDeskCase, HelpDeskStatus } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface FileCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (caseData: Partial<HelpDeskCase>) => void
  isLoading?: boolean
}

export function FileCaseModal({ open, onOpenChange, onSubmit, isLoading }: FileCaseModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    memberName: '',
    memberPhone: '',
    memberEmail: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newCase: Partial<HelpDeskCase> = {
      title: formData.title,
      memberName: formData.memberName,
      memberPhone: formData.memberPhone,
      memberEmail: formData.memberEmail,
      description: formData.description,
      status: HelpDeskStatus.PENDING,
      handlers: [
        {
          userId: user!.id,
          userName: user!.name,
          handledAt: new Date(),
          action: 'Filed case'
        }
      ],
      notes: [],
      documents: [],
      createdBy: user!.id,
      createdByName: user!.name
    }

    onSubmit(newCase)
    setFormData({ title: '', memberName: '', memberPhone: '', memberEmail: '', description: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>File New Support Case</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              placeholder="e.g., Salary Dispute"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="memberName">Member Name</Label>
            <Input
              id="memberName"
              placeholder="Full name"
              value={formData.memberName}
              onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="memberPhone">Phone</Label>
            <Input
              id="memberPhone"
              placeholder="+234-..."
              value={formData.memberPhone}
              onChange={(e) => setFormData({ ...formData, memberPhone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="memberEmail">Email</Label>
            <Input
              id="memberEmail"
              type="email"
              placeholder="member@example.com"
              value={formData.memberEmail}
              onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the case details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="min-h-24"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Filing...' : 'File Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
