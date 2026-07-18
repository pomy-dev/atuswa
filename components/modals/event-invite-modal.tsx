'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EventInvitation } from '@/lib/types'

interface EventInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (invitations: EventInvitation[]) => void
  isLoading?: boolean
}

export function EventInviteModal({ open, onOpenChange, onSubmit, isLoading }: EventInviteModalProps) {
  const [invitations, setInvitations] = useState<Partial<EventInvitation>[]>([
    { email: '', name: '' }
  ])

  const handleAddField = () => {
    setInvitations([...invitations, { email: '', name: '' }])
  }

  const handleRemoveField = (idx: number) => {
    setInvitations(invitations.filter((_, i) => i !== idx))
  }

  const handleFieldChange = (idx: number, field: keyof EventInvitation, value: string) => {
    const updated = [...invitations]
    updated[idx] = { ...updated[idx], [field]: value }
    setInvitations(updated)
  }

  const handleSubmit = () => {
    const validInvites = invitations
      .filter(inv => inv.email || inv.phone || inv.name)
      .map(inv => ({
        id: `invite_${Date.now()}_${Math.random()}`,
        email: inv.email || undefined,
        phone: inv.phone || undefined,
        name: inv.name || 'Guest',
        status: 'invited' as const,
        sentAt: new Date()
      }))

    if (validInvites.length > 0) {
      onSubmit(validInvites)
      setInvitations([{ email: '', name: '' }])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Event Invitations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {invitations.map((inv, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={inv.name || ''}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    className="text-sm"
                  />
                  {invitations.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveField(idx)}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inv.email || ''}
                    onChange={(e) => handleFieldChange(idx, 'email', e.target.value)}
                    className="text-sm flex-1"
                  />
                  <Input
                    placeholder="+234-..."
                    value={inv.phone || ''}
                    onChange={(e) => handleFieldChange(idx, 'phone', e.target.value)}
                    className="text-sm flex-1"
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleAddField}
            className="w-full text-sm"
          >
            Add Another Contact
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Invitations'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
