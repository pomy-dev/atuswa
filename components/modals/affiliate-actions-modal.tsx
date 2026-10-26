'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Affiliate, AffiliateDocument } from '@/lib/types'

export type AffiliateAction = 'payment' | 'document' | 'notify' | 'link' | 'report'

interface AffiliateActionsModalProps {
  open: boolean
  action: AffiliateAction | null
  affiliate: Affiliate | null
  affiliates: Affiliate[]
  links: any[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: Record<string, string>) => void
  onDocumentAction: (action: 'archive' | 'share', document: AffiliateDocument) => void
  onLinkAction: (action: 'unlink', link: any) => void
}

const empty = { amount: '', period: '', reference: '', name: '', category: 'Other', version: '', channel: 'Email', recipient: '', subject: '', message: '', linkType: 'member', targetId: '', relation: '', reportType: 'Membership statistics' }

export function AffiliateActionsModal({ open, action, affiliate, affiliates, links, onOpenChange, onSubmit, onDocumentAction, onLinkAction }: AffiliateActionsModalProps) {
  const [form, setForm] = useState(empty)
  useEffect(() => { if (open) setForm(empty) }, [open, action, affiliate?.id])
  const update = (key: keyof typeof empty, value: string) => setForm(previous => ({ ...previous, [key]: value }))
  if (!affiliate || !action) return null
  const titles: Record<AffiliateAction, string> = { payment: 'Record subscription payment', document: 'Manage official document', notify: 'Queue affiliate notification', link: 'Link supporting record', report: 'Generate affiliate report' }
  const submit = (event: React.FormEvent) => { event.preventDefault(); onSubmit(form) }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{titles[action]}</DialogTitle><DialogDescription>{affiliate.acronym} · {affiliate.officialName}</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-5">
    {action === 'payment' && <div className="grid gap-4 md:grid-cols-3"><div className="space-y-1.5"><Label htmlFor="amount">Amount (E) *</Label><Input id="amount" type="number" min="0" step="0.01" required value={form.amount} onChange={event => update('amount', event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="period">Period covered *</Label><Input id="period" placeholder="October 2026" required value={form.period} onChange={event => update('period', event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="reference">Receipt / reference</Label><Input id="reference" value={form.reference} onChange={event => update('reference', event.target.value)} /></div></div>}
    {action === 'document' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="documentName">Document name *</Label><Input id="documentName" required placeholder="Constitution 2026.pdf" value={form.name} onChange={event => update('name', event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="documentVersion">Version</Label><Input id="documentVersion" placeholder="v2.0" value={form.version} onChange={event => update('version', event.target.value)} /></div></div><div className="space-y-1.5"><Label htmlFor="documentCategory">Category</Label><select id="documentCategory" value={form.category} onChange={event => update('category', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Constitution</option><option>Registration</option><option>Minutes</option><option>Resolution</option><option>Financial</option><option>Other</option></select></div><p className="text-xs text-muted-foreground">Local storage keeps the document register and metadata. Use the browser’s file system or secure document storage for production file contents.</p>{affiliate.documents.length > 0 && <div className="space-y-2 rounded-lg border border-border p-3"><p className="text-sm font-semibold">Current documents</p>{affiliate.documents.map(document => <div key={document.id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{document.name}{document.version ? ` · ${document.version}` : ''}</span><span className="flex shrink-0 gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => onDocumentAction('share', document)}>Share</Button><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onDocumentAction('archive', document)}>Archive</Button></span></div>)}</div>}</div>}
    {action === 'notify' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="channel">Channel</Label><select id="channel" value={form.channel} onChange={event => update('channel', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Email</option><option>SMS</option><option>Internal notice</option></select></div><div className="space-y-1.5"><Label htmlFor="recipient">Recipient</Label><Input id="recipient" placeholder="Email address or phone number" value={form.recipient} onChange={event => update('recipient', event.target.value)} /></div></div><div className="space-y-1.5"><Label htmlFor="subject">Subject</Label><Input id="subject" value={form.subject} onChange={event => update('subject', event.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="message">Message *</Label><Textarea id="message" required value={form.message} onChange={event => update('message', event.target.value)} placeholder="Upcoming congress, overdue subscription, or status update" /></div></div>}
    {action === 'link' && <div className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="linkType">Record type</Label><select id="linkType" value={form.linkType} onChange={event => update('linkType', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="member">Member / worker</option><option value="branch">Branch / region</option><option value="shop-steward">Shop steward</option><option value="employer">Employer / bargaining unit</option></select></div><div className="space-y-1.5"><Label htmlFor="targetId">Record ID or name *</Label><Input id="targetId" required value={form.targetId} onChange={event => update('targetId', event.target.value)} /></div></div><div className="space-y-1.5"><Label htmlFor="relation">Relationship / notes</Label><Input id="relation" placeholder="National shop steward, Manzini branch, bargaining unit" value={form.relation} onChange={event => update('relation', event.target.value)} /></div>{links.length > 0 && <div className="space-y-2 rounded-lg border border-border p-3"><p className="text-sm font-semibold">Current links</p>{links.map(link => <div key={link.id} className="flex items-center justify-between gap-2 text-sm"><span>{link.type}: {link.targetId}{link.relation ? ` · ${link.relation}` : ''}</span><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onLinkAction('unlink', link)}>Unlink</Button></div>)}</div>}</div>}
    {action === 'report' && <div className="space-y-3"><Label htmlFor="reportType">Report type</Label><select id="reportType" value={form.reportType} onChange={event => update('reportType', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Membership statistics</option><option>Compliance report</option><option>Affiliation fee statement</option><option>Gender and sector breakdown</option></select><p className="text-sm text-muted-foreground">A downloadable report will be generated from the current affiliate and local-storage records.</p></div>}
    <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{action === 'report' ? 'Generate report' : action === 'notify' ? 'Queue notification' : action === 'link' ? 'Create link' : action === 'document' ? 'Save document' : 'Record payment'}</Button></div>
  </form></DialogContent></Dialog>
}
