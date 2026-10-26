'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Affiliate, Member } from '@/lib/types'

interface MemberRecordModalProps {
  open: boolean
  member: Member | null
  affiliates: Affiliate[]
  onOpenChange: (open: boolean) => void
  onSave: (member: Member) => void
  onTransfer: (member: Member, affiliateId: string, reason: string) => void
  onCredential: (member: Member, kind: 'card' | 'certificate') => void
}

export function MemberRecordModal({ open, member, affiliates, onOpenChange, onSave, onTransfer, onCredential }: MemberRecordModalProps) {
  const [form, setForm] = useState<Member | null>(member)
  const [transferTo, setTransferTo] = useState('')
  const [transferReason, setTransferReason] = useState('')
  useEffect(() => { setForm(member); setTransferTo(''); setTransferReason('') }, [member, open])
  if (!form) return null
  const update = (key: keyof Member, value: string) => setForm(previous => previous ? ({ ...previous, [key]: value }) : previous)
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSave(form); onOpenChange(false) }
  const currentAffiliate = affiliates.find(affiliate => affiliate.id === form.affiliateId)

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Worker record · {form.memberId}</DialogTitle><DialogDescription>Update personal and employment details, subscription status, and affiliate relationship.</DialogDescription></DialogHeader><div className="space-y-6">
    <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={event => update('name', event.target.value)} required /></div><div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={event => update('email', event.target.value)} /></div><div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={event => update('phone', event.target.value)} /></div><div className="space-y-1.5"><Label>Date of birth</Label><Input type="date" value={form.dob} onChange={event => update('dob', event.target.value)} /></div><div className="space-y-1.5"><Label>Workplace / employer</Label><Input value={form.workplace} onChange={event => update('workplace', event.target.value)} /></div><div className="space-y-1.5"><Label>Job category / grade</Label><Input value={form.jobCategory || ''} onChange={event => update('jobCategory', event.target.value)} /></div><div className="space-y-1.5"><Label>Gender</Label><select value={form.gender} onChange={event => update('gender', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Male</option><option>Female</option><option>Other</option></select></div><div className="space-y-1.5"><Label>Physical address</Label><Input value={form.address} onChange={event => update('address', event.target.value)} /></div></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label>Subscription status</Label><select value={form.subscriptionStatus || 'Pending'} onChange={event => update('subscriptionStatus', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Paid</option><option>Pending</option><option>In arrears</option></select></div><div className="space-y-1.5"><Label>TUCOSWA membership status</Label><select value={form.tucoswaStatus || 'Active'} onChange={event => update('tucoswaStatus', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Active</option><option>Resigned</option><option>Deceased</option><option>Transferred</option></select></div></div><div className="flex justify-end"><Button type="submit">Save worker details</Button></div></form>
    <section className="rounded-xl border border-border bg-muted/30 p-4"><h3 className="font-semibold">Affiliate transfer</h3><p className="mt-1 text-sm text-muted-foreground">Current affiliate: {currentAffiliate?.acronym || 'Unlinked'}. Transfers are queued for approval.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><select value={transferTo} onChange={event => setTransferTo(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Select new affiliate</option>{affiliates.filter(affiliate => affiliate.id !== form.affiliateId).map(affiliate => <option key={affiliate.id} value={affiliate.id}>{affiliate.acronym} — {affiliate.officialName}</option>)}</select><Input placeholder="Reason for transfer" value={transferReason} onChange={event => setTransferReason(event.target.value)} /></div><Button className="mt-3" variant="outline" disabled={!transferTo || !transferReason.trim()} onClick={() => { onTransfer(form, transferTo, transferReason.trim()); setTransferTo(''); setTransferReason('') }}>Request transfer approval</Button></section>
    <section className="rounded-xl border border-border p-4"><h3 className="font-semibold">Member credentials</h3><p className="mt-1 text-sm text-muted-foreground">Generate a printable membership card or certificate from the current record.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => onCredential(form, 'card')}>Generate membership card</Button><Button variant="outline" onClick={() => onCredential(form, 'certificate')}>Generate certificate</Button></div></section>
  </div></DialogContent></Dialog>
}
