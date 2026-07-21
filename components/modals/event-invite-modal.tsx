'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { EventInvitation } from '@/lib/types'

interface EventInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (invitations: EventInvitation[]) => void
  isLoading?: boolean
  existingInvitations?: EventInvitation[]   // ← New prop
}

export function EventInviteModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  existingInvitations = []
}: EventInviteModalProps) {
  const [invitations, setInvitations] = useState<Partial<EventInvitation>[]>([
    { email: '', name: '', phone: '' }
  ])
  const [formData, setFormData] = useState<Partial<EventInvitation>>({
    email: '', name: '', phone: ''
  })

  const handleAddField = () => {
    try {
      const newInvitee = { name: formData.name, email: formData.email, phone: formData.phone }
      setInvitations([...invitations, newInvitee])
    } catch (err) {
      console.error(err)
    } finally {
      setFormData({ name: '', email: '', phone: '' })
    }
  }

  const handleRemoveInvited = (id: number) => {
    setInvitations(invitations.filter((_, i) => i !== id))
  }

  const handleFieldChange = (idx: number, field: keyof EventInvitation, value: string) => {
    const updated = [...invitations]
    updated[idx] = { ...updated[idx], [field]: value }
    setInvitations(updated)
  }

  const handleSubmit = () => {
    const validInvites = invitations
      .filter(inv => inv.email?.trim() || inv.phone?.trim() || inv.name?.trim())
      .map(inv => ({
        id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: inv.email?.trim() || undefined,
        phone: inv.phone?.trim() || undefined,
        name: inv.name?.trim() || 'Guest',
        status: 'invited' as const,
        sentAt: new Date()
      }))

    if (validInvites.length > 0) {
      onSubmit(validInvites)
      // Reset form
      setInvitations([{ email: '', name: '', phone: '' }])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Send Event Invitations</DialogTitle>
        </DialogHeader>

        {/* === Already Invited Section === */}
        {existingInvitations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Already Invited ({existingInvitations.length})</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-2">
              {existingInvitations.map((inv) => (
                <Badge
                  key={inv.id}
                  variant="secondary"
                  className="flex items-center justify-between gap-1 px-2 py-3 text-sm"
                >
                  {inv.name}
                  {inv.status && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${inv.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : inv.status === 'declined'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                        }`}
                    >
                      {inv.status}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
            <div className="h-px bg-border my-2" />
          </div>
        )}

        {/* === New Invitations Form === */}
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Label className="text-sm font-medium">Add New Invitees</Label>

          <div className="space-y-3 overflow-y-auto pr-1 max-h-[280px]">
            {invitations.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-2">
                {invitations.map((inv, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="flex items-center justify-between gap-1 px-2 py-3 text-sm"
                  >
                    <span className='text-[12px] text-blue-700'>{inv.name}</span>
                    <button onClick={() => handleRemoveInvited(idx)}
                      className="text-[10px] rounded-full 'bg-red-100 text-red-700"
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleAddField}
            className="w-full"
          >
            + Add Another Person
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Sending...' : 'Send Invitations'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}