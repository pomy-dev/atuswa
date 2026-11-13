'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, UserPlus, Mail, Phone, User } from 'lucide-react'
import { EventInvitation } from '@/lib/types'
import { cn } from '@/lib/utils' // if you have it; otherwise remove cn
import { Spinner } from '../ui/spinner'

interface EventInviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (invitations: EventInvitation[]) => void
  isLoading?: boolean
  existingInvitations?: EventInvitation[]
}

export function EventInviteModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  existingInvitations = [],
}: EventInviteModalProps) {
  const [pending, setPending] = useState<Partial<EventInvitation>[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '' })

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPending([])
      setForm({ name: '', email: '', phone: '' })
    }
  }, [open])

  const addPerson = () => {
    const name = form.name.trim()
    const email = form.email.trim()
    const phone = form.phone.trim()

    if (!name && !email && !phone) return

    setPending((prev) => [
      ...prev,
      {
        name: name || 'Guest',
        email: email || undefined,
        phone: phone || undefined,
      },
    ])
    setForm({ name: '', email: '', phone: '' })
  }

  const removePending = (index: number) => {
    setPending((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    // Include the current form values if filled
    const current = {
      name: form.name.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    }

    const all = [...pending]
    if (current.name || current.email || current.phone) {
      all.push({
        name: current.name || 'Guest',
        email: current.email,
        phone: current.phone,
      })
    }

    const validInvites: EventInvitation[] = all
      .filter((inv) => inv.email || inv.phone || inv.name)
      .map((inv) => ({
        id: `invite_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        email: inv.email!,
        phone: inv.phone!,
        name: inv.name || 'Guest',
        status: 'invited' as const,
        event_id: inv?.event_id!,
        sent_at: new Date(),
      }))

    if (validInvites.length === 0) return

    onSubmit(validInvites)
    onOpenChange(false)
  }

  const canSubmit =
    pending.length > 0 ||
    form.name.trim() ||
    form.email.trim() ||
    form.phone.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Invite People
          </DialogTitle>
          <DialogDescription>
            Add guests by name, email, or phone. They will receive an invitation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Already invited */}
          {existingInvitations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">
                  Already invited
                </Label>
                <span className="text-xs text-muted-foreground">
                  {existingInvitations.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {existingInvitations.map((inv) => (
                  <Badge
                    key={inv.id}
                    variant="secondary"
                    className="pl-2.5 pr-1.5 py-1.5 gap-1.5 font-normal"
                  >
                    <span className="truncate max-w-[140px]">{inv.name}</span>
                    {inv.status && (
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full capitalize',
                          inv.status === 'accepted' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                          inv.status === 'declined' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                          inv.status === 'invited' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        )}
                      >
                        {inv.status}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pending invitees */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ready to invite</Label>
              <div className="flex flex-wrap gap-2">
                {pending.map((inv, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="pl-2.5 pr-1 py-1.5 gap-1.5 bg-primary/5 border-primary/20"
                  >
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium">{inv.name}</span>
                    <button
                      type="button"
                      onClick={() => removePending(idx)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add form */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Add new invitee</Label>

            <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
              <div className="space-y-1.5">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-9 h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="pl-9 h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="pl-9 h-10"
                    onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addPerson}
                className="w-full gap-2"
                disabled={!form.name.trim() && !form.email.trim() && !form.phone.trim()}
              >
                <UserPlus className="w-4 h-4" />
                Add to list
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t bg-muted/20">
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
            disabled={isLoading || !canSubmit}
            className="flex-1 gap-2"
          >
            {isLoading ? (
              <><Spinner className='h-6 w-6' /> 'Sending…'</>
            ) : (
              <>
                Send Invitations
                {(pending.length > 0 || canSubmit) && (
                  <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">
                    {pending.length + (form.name || form.email || form.phone ? 1 : 0)}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}