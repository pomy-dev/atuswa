'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Affiliate, AffiliateDocument, AppUser } from '@/lib/types'
import {
  CreditCard, FileText, Bell, Link2, BarChart3, Upload, ImageIcon,
  File, Loader2, X, Share2, Archive, Unlink,
} from 'lucide-react'

export type AffiliateAction = 'payment' | 'document' | 'notify' | 'link' | 'report'

export type AffiliateActionPayload = Record<string, string> & {
  fileName?: string
  fileType?: string
  fileSize?: string
  fileDataUrl?: string
}

interface AffiliateActionsModalProps {
  open: boolean
  action: AffiliateAction | null
  affiliate: Affiliate | null
  affiliates: Affiliate[]
  links: any[]
  users?: AppUser[]
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: AffiliateActionPayload) => void | Promise<void>
  onDocumentAction: (action: 'archive' | 'share', document: AffiliateDocument) => void
  onLinkAction: (action: 'unlink', link: any) => void
}

const linkTypeOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'branch', label: 'Branch' },
  { value: 'shop-steward', label: 'Shop steward' },
  { value: 'employer', label: 'Bargaining unit' },
] as const

const emptyForm = {
  amount: '',
  period: '',
  reference: '',
  name: '',
  category: 'Other',
  version: '',
  channel: 'Email',
  recipient: '',
  subject: '',
  message: '',
  linkType: 'member',
  targetId: '',
  relation: '',
  reportType: 'Membership statistics',
}

const actionMeta: Record<
  AffiliateAction,
  { title: string; description: string; icon: typeof CreditCard; submitLabel: string }
> = {
  payment: {
    title: 'Record subscription payment',
    description: 'Log a payment and optionally attach a receipt or proof of payment.',
    icon: CreditCard,
    submitLabel: 'Record payment',
  },
  document: {
    title: 'Manage official document',
    description: 'Upload or register a constitution, minutes, financials, or other official file.',
    icon: FileText,
    submitLabel: 'Save document',
  },
  notify: {
    title: 'Queue affiliate notification',
    description: 'Queue an email, SMS, or internal notice for delivery.',
    icon: Bell,
    submitLabel: 'Queue notification',
  },
  link: {
    title: 'Link supporting record',
    description: 'Connect a worker, branch, shop steward, or employer to this affiliate.',
    icon: Link2,
    submitLabel: 'Create link',
  },
  report: {
    title: 'Generate affiliate report',
    description: 'Export a downloadable summary from current affiliate and local records.',
    icon: BarChart3,
    submitLabel: 'Generate report',
  },
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePicker({
  id,
  label,
  hint,
  accept,
  file,
  previewUrl,
  disabled,
  onChange,
  onClear,
}: {
  id: string
  label: string
  hint: string
  accept: string
  file: File | null
  previewUrl: string | null
  disabled?: boolean
  onChange: (file: File | null) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${file
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-muted/50'
          }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null
            onChange(selected)
          }}
        />

        {!file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Click to upload a file or image
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-3 p-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-border"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-background ring-1 ring-border">
                <File className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatBytes(file.size)} · {file.type || 'Unknown type'}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="text-destructive"
                  onClick={onClear}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function AffiliateActionsModal({
  open,
  action,
  affiliate,
  affiliates,
  links,
  users = [],
  onOpenChange,
  onSubmit,
  onDocumentAction,
  onLinkAction,
}: AffiliateActionsModalProps) {
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(emptyForm)
    setFile(null)
    setPreviewUrl(null)
    setIsSubmitting(false)
  }, [open, action, affiliate?.id])

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const update = (key: keyof typeof emptyForm, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  if (!affiliate || !action) return null

  const meta = actionMeta[action]
  const Icon = meta.icon

  const setLinkType = (value: string) => {
    setForm((previous) => ({
      ...previous,
      linkType: value,
      targetId: '',
    }))
  }

  const filteredUsers = users.filter((u) => u.role?.name === "Affiliate Secretary")

  const readFileAsDataUrl = (selected: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(selected)
    })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload: AffiliateActionPayload = { ...form }

      if (file) {
        payload.fileName = file.name
        payload.fileType = file.type
        payload.fileSize = String(file.size)
        // Keep the form payload small; skip huge inline binaries.
        if (file.size <= 1.5 * 1024 * 1024) {
          payload.fileDataUrl = await readFileAsDataUrl(file)
        }
        if (action === 'document' && !payload.name.trim()) {
          payload.name = file.name
        }
      }

      await onSubmit(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="space-y-3 border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl">{meta.title}</DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                <span className="font-medium text-foreground">
                  {affiliate.acronym}
                </span>
                <span className="text-muted-foreground"> · {affiliate.official_name}</span>
                <br />
                {meta.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6 px-6 py-5">
          {action === 'payment' && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Amount (E) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    disabled={isSubmitting}
                    value={form.amount}
                    onChange={(event) => update('amount', event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="period">Period covered *</Label>
                  <Input
                    id="period"
                    placeholder="October 2026"
                    required
                    disabled={isSubmitting}
                    value={form.period}
                    onChange={(event) => update('period', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Receipt / reference</Label>
                  <Input
                    id="reference"
                    disabled={isSubmitting}
                    value={form.reference}
                    onChange={(event) => update('reference', event.target.value)}
                    placeholder="INV-2026-014"
                  />
                </div>
              </div>

              <FilePicker
                id="payment-proof"
                label="Receipt or proof of payment"
                hint="PDF, JPG, PNG · max recommended 1.5 MB for local storage"
                accept="image/*,.pdf,application/pdf"
                file={file}
                previewUrl={previewUrl}
                disabled={isSubmitting}
                onChange={setFile}
                onClear={() => setFile(null)}
              />
            </div>
          )}

          {action === 'document' && (
            <div className="space-y-5">
              <FilePicker
                id="document-file"
                label="Document file *"
                hint="PDF, Word, image, or other official file · max recommended 1.5 MB"
                accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                file={file}
                previewUrl={previewUrl}
                disabled={isSubmitting}
                onChange={(selected) => {
                  setFile(selected)
                  if (selected && !form.name.trim()) {
                    update('name', selected.name)
                  }
                }}
                onClear={() => setFile(null)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="documentName">Document name *</Label>
                  <Input
                    id="documentName"
                    required
                    disabled={isSubmitting}
                    placeholder="Constitution 2026.pdf"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="documentVersion">Version</Label>
                  <Input
                    id="documentVersion"
                    disabled={isSubmitting}
                    placeholder="v2.0"
                    value={form.version}
                    onChange={(event) => update('version', event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="documentCategory">Category</Label>
                <select
                  id="documentCategory"
                  disabled={isSubmitting}
                  value={form.category}
                  onChange={(event) => update('category', event.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Constitution</option>
                  <option>Registration</option>
                  <option>Minutes</option>
                  <option>Resolution</option>
                  <option>Financial</option>
                  <option>Other</option>
                </select>
              </div>

              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Metadata and a small preview/data URL are stored locally. Use secure document
                storage in production for full file contents.
              </p>

              {affiliate.documents.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold">Current documents</p>
                  <div className="divide-y divide-border">
                    {affiliate.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {document.name}
                            {document.version ? ` · ${document.version}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">{document.category}</p>
                        </div>
                        <span className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => onDocumentAction('share', document)}
                          >
                            <Share2 className="mr-1 h-3.5 w-3.5" />
                            Share
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSubmitting}
                            className="text-destructive"
                            onClick={() => onDocumentAction('archive', document)}
                          >
                            <Archive className="mr-1 h-3.5 w-3.5" />
                            Archive
                          </Button>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {action === 'notify' && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="channel">Channel</Label>
                  <select
                    id="channel"
                    disabled={isSubmitting}
                    value={form.channel}
                    onChange={(event) => update('channel', event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option>Email</option>
                    <option>SMS</option>
                    <option>Internal notice</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient">Recipient</Label>
                  <Input
                    id="recipient"
                    disabled={isSubmitting}
                    placeholder="Email address or phone number"
                    value={form.recipient}
                    onChange={(event) => update('recipient', event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  disabled={isSubmitting}
                  value={form.subject}
                  onChange={(event) => update('subject', event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  required
                  disabled={isSubmitting}
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  placeholder="Upcoming congress, overdue subscription, or status update"
                  className="min-h-[110px]"
                />
              </div>
            </div>
          )}

          {action === 'link' && (
            <div className="space-y-5">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium leading-none">Record type</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {linkTypeOptions.map((option) => {
                    const selected = form.linkType === option.value
                    return (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border px-2 py-3 text-center transition-colors ${selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/40'
                          } ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        <span className="text-xs font-medium text-foreground">{option.label}</span>
                        <input
                          type="radio"
                          name="linkType"
                          value={option.value}
                          checked={selected}
                          disabled={isSubmitting}
                          onChange={() => setLinkType(option.value)}
                          className="h-4 w-4 accent-primary"
                        />
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {form.linkType === 'admin' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="targetUser">Affiliate Admin user *</Label>
                  <select
                    id="targetUser"
                    required
                    disabled={isSubmitting || users.length === 0}
                    value={form.targetId}
                    onChange={(event) => update('targetId', event.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">
                      {filteredUsers.length === 0 ? 'No users available' : 'Select a user…'}
                    </option>
                    {filteredUsers.map((user) => (
                      <option key={user.id} value={user?.id}>
                        {user?.full_name}
                        {user?.email ? ` · ${user?.email}` : ''}
                        {user.role ? ` (${user?.role?.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="targetId">Record ID or name *</Label>
                  <Input
                    id="targetId"
                    required
                    disabled={isSubmitting}
                    value={form.targetId}
                    onChange={(event) => update('targetId', event.target.value)}
                    placeholder={
                      form.linkType === 'member'
                        ? 'Member ID or full name'
                        : form.linkType === 'branch'
                          ? 'Branch ID or name'
                          : form.linkType === 'shop-steward'
                            ? 'Shop steward ID or name'
                            : 'Employer / bargaining unit ID or name'
                    }
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="relation">Relationship / notes</Label>
                <Input
                  id="relation"
                  disabled={isSubmitting}
                  placeholder="National admin, Manzini branch, bargaining unit"
                  value={form.relation}
                  onChange={(event) => update('relation', event.target.value)}
                />
              </div>

              {links.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-semibold">Current links</p>
                  <div className="divide-y divide-border">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                      >
                        <span className="min-w-0 truncate">
                          {link.link_type ?? link.type}: {
                            link.link_type.toLowerCase() === "admin".toLowerCase() ?
                              users.find(u => u.id === (link.target_id ?? link.targetId))?.full_name
                              : link.target_id ?? link.targetId}
                          {link.relation ? ` · ${link.relation}` : ''}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                          className="text-destructive"
                          onClick={() => onLinkAction('unlink', link)}
                        >
                          <Unlink className="mr-1 h-3.5 w-3.5" />
                          Unlink
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {action === 'report' && (
            <div className="space-y-3">
              <Label htmlFor="reportType">Report type</Label>
              <select
                id="reportType"
                disabled={isSubmitting}
                value={form.reportType}
                onChange={(event) => update('reportType', event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option>Membership statistics</option>
                <option>Compliance report</option>
                <option>Affiliation fee statement</option>
                <option>Gender and sector breakdown</option>
              </select>
              <p className="text-sm text-muted-foreground">
                A downloadable report will be generated from the current affiliate and local-storage
                records.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                meta.submitLabel
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
