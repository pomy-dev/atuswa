'use client'

import Link from 'next/link'
import { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileText, FolderKanban, Headphones, Loader2, MapPin,
  Pencil, Plus, Save, ShieldCheck, Users, X, Upload, Archive, Trash2, Download
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createHelpdeskCase, getHelpdeskCases } from '@/services/help-desk-service'
import { FileCaseModal } from '@/components/modals/file-case-modal'
import { HelpDeskCase } from '@/lib/types'
import { toast } from 'sonner'

type AffiliateProfile = {
  name: string
  acronym: string
  affiliateCode: string
  status: string
  standing: string
  updated: string
  contact: string
  email: string
  phone: string
  address: string
}

type MembershipData = {
  declared: number
  paid: number
  women: number
  men: number
  other: number
  stewards: number
  executiveCommittee: number
  regions: string
  sectors: string
  lastCongress: string
  constitutionVersion: string
}

type DueRow = {
  id: string
  date: string
  reference: string
  amount: number
  status: string
  fileName?: string
  fileType?: string
  fileDataUrl?: string
}

type Project = {
  id: string
  title: string
  status: string
  progress: number
  lead: string
  archived?: boolean
}

type EventItem = {
  id: string
  date: string
  title: string
  place: string
  kind: string
  archived?: boolean
}

type DocumentItem = {
  id: string
  name: string
  type: string
  caption: string
  date: string // ISO or display; we sort by Date.parse
  fileName?: string
  fileType?: string
  fileDataUrl?: string
  archived?: boolean
}

type SupportCase = { id: string; title: string; status: string; updated: string }

const initialAffiliate: AffiliateProfile = {
  name: 'Eswatini National Association of Teachers',
  acronym: 'SNAT',
  affiliateCode: 'TUC-AFF-001',
  status: 'Active',
  standing: 'Good standing',
  updated: '6 November 2026',
  contact: 'Lindiwe Dlamini · Secretary General',
  email: 'office@snat.org.sz',
  phone: '+268 2404 1122',
  address: 'Mbabane, Hhohho Region',
}

const initialMembership: MembershipData = {
  declared: 4820,
  paid: 4315,
  women: 2910,
  men: 1840,
  other: 70,
  stewards: 84,
  executiveCommittee: 11,
  regions: 'Hhohho, Manzini, Lubombo, Shiselweni',
  sectors: 'Education, public service',
  lastCongress: '12 September 2025',
  constitutionVersion: '2023 revision',
}

const initialDuesChart = [
  { month: 'Aug', amount: 108750 },
  { month: 'Sep', amount: 108750 },
  { month: 'Oct', amount: 108750 },
  { month: 'Nov', amount: 108750 },
]

const initialDueRows: DueRow[] = [
  { id: 'du-1', date: '4 Nov 2026', reference: 'TUC-SNAT-26-104', amount: 108750, status: 'Received' },
  { id: 'du-2', date: '3 Oct 2026', reference: 'TUC-SNAT-26-103', amount: 108750, status: 'Received' },
  { id: 'du-3', date: '5 Sep 2026', reference: 'TUC-SNAT-26-102', amount: 108750, status: 'Received' },
  { id: 'du-4', date: '6 Aug 2026', reference: 'TUC-SNAT-26-101', amount: 108750, status: 'Received' },
]

const initialProjects: Project[] = [
  { id: 'pr-1', title: 'Teachers’ Workplace Rights Programme', status: 'In progress', progress: 68, lead: 'SNAT + TUCOSWA' },
  { id: 'pr-2', title: 'Young Workers Leadership Network', status: 'Planning', progress: 22, lead: 'SNAT' },
]

const initialEvents: EventItem[] = [
  { id: 'ev-1', date: '18 Nov', title: 'Affiliate Secretaries Forum', place: 'TUCOSWA House, Mbabane', kind: 'Meeting' },
  { id: 'ev-2', date: '02 Dec', title: 'Annual Labour Conference', place: 'Ezulwini Convention Centre', kind: 'Conference' },
  { id: 'ev-3', date: '10 Dec', title: 'Membership Data Clinic', place: 'Online', kind: 'Workshop' },
]

const initialDocuments: DocumentItem[] = [
  { id: 'doc-1', name: 'SNAT Constitution', type: 'Constitution', date: '12 Sep 2026', archived: false, caption: '' },
  { id: 'doc-2', name: '2026 Membership Return', type: 'Membership', date: '28 Oct 2026', archived: false, caption: '' },
  { id: 'doc-3', name: 'Audited Financial Statements', type: 'Financial', date: '14 Aug 2026', archived: false, caption: '' },
]

const initialCases: SupportCase[] = [
  { id: 'HD-2026-0148', title: 'Collective bargaining support', status: 'In progress', updated: '5 Nov' },
  { id: 'HD-2026-0122', title: 'Workplace safety referral', status: 'Awaiting update', updated: '29 Oct' },
]

const money = (amount: number) => `E${amount.toLocaleString('en-SZ')}`

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function sortDocsByDateDesc(items: DocumentItem[]) {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.date) || 0
    const tb = Date.parse(b.date) || 0
    return tb - ta
  })
}

/** Inline edit: display → input when Edit is clicked */
function EditableField({
  label,
  value,
  onSave,
  type = 'text',
  multiline = false,
  className = '',
  displayClassName = '',
  placeholder,
  readOnly = false,
}: {
  label: string
  value: string
  onSave: (next: string) => void | Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number'
  multiline?: boolean
  className?: string
  displayClassName?: string
  placeholder?: string
  readOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    if (readOnly) return
    setDraft(value)
    setEditing(true)
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(draft.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-xl border bg-card p-4 ${className}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {!readOnly && !editing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={startEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              disabled={saving}
              className="min-h-[80px] text-sm"
              autoFocus
            />
          ) : (
            <Input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              disabled={saving}
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') void save()
                if (e.key === 'Escape') cancel()
              }}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={cancel}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
              {saving ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <p className={`text-sm font-medium text-foreground ${displayClassName}`}>
          {value || <span className="font-normal text-muted-foreground">Not set</span>}
        </p>
      )}
    </div>
  )
}

function EditableNumberField({
  label,
  value,
  onSave,
}: {
  label: string
  value: number
  onSave: (next: number) => void | Promise<void>
}) {
  return (
    <EditableField
      label={label}
      value={String(value)}
      type="number"
      onSave={async (raw) => {
        const n = Number(raw.replace(/,/g, ''))
        if (Number.isFinite(n) && n >= 0) await onSave(n)
      }}
      displayClassName="text-lg"
    />
  )
}

export default function AffiliateDashboardPage() {
  const { user } = useAuth()
  const [section, setSection] = useState('Overview')
  const [affiliate, setAffiliate] = useState(initialAffiliate)
  const [membership, setMembership] = useState(initialMembership)
  const [dueRows, setDueRows] = useState(initialDueRows)
  const [projects, setProjects] = useState(initialProjects)
  const [events, setEvents] = useState(initialEvents)
  const [documents, setDocuments] = useState(initialDocuments)
  const [cases, setCases] = useState(initialCases)
  const [currentAffiliate, setCurrentAffiliate] = useState<{ id: string; name: string } | null>(null)
  const [showFileCase, setShowFileCase] = useState(false)
  const [isFilingCase, setIsFilingCase] = useState(false)
  const [monthlyRate, setMonthlyRate] = useState('E25 / member')
  const [savingBanner, setSavingBanner] = useState<string | null>(null)

  const [showAddDue, setShowAddDue] = useState(false)
  const [showAddProgramme, setShowAddProgramme] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showUploadDoc, setShowUploadDoc] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)

  const [programmesView, setProgrammesView] = useState<'active' | 'archived'>('active')
  const [documentsView, setDocumentsView] = useState<'active' | 'archived'>('active')

  // form state for modals
  const [dueForm, setDueForm] = useState({ date: '', reference: '', amount: '', status: 'Received' })
  const [dueFile, setDueFile] = useState<File | null>(null)
  const [duePreview, setDuePreview] = useState<string | null>(null)

  const [programmeForm, setProgrammeForm] = useState({ title: '', status: 'Planning', progress: '0', lead: '' })
  const [eventForm, setEventForm] = useState({ title: '', date: '', place: '', kind: 'Meeting' })

  const [docForm, setDocForm] = useState({ name: '', type: 'Other', caption: '' })
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docPreview, setDocPreview] = useState<string | null>(null)
  const [modalBusy, setModalBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const loadAffiliateSupportData = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const affiliateId = user.affiliateId
      if (!affiliateId) {
        if (!cancelled) {
          setCurrentAffiliate(null)
          setCases([])
        }
        return
      }

      const [{ data: affiliateRow, error: affiliateError }, loadedCases] = await Promise.all([
        supabase
          .from('affiliates')
          .select('id, official_name')
          .eq('id', affiliateId)
          .single(),
        getHelpdeskCases(supabase),
      ])
      if (affiliateError) throw affiliateError
      if (cancelled) return

      setCurrentAffiliate({ id: affiliateRow.id, name: affiliateRow.official_name })
      setCases(loadedCases
        .filter((item) => item.affiliate_id === affiliateId)
        .map((item) => ({
          id: item.id,
          title: item.title,
          status: item.status.replace(/_/g, ' '),
          updated: new Date(item.updated_at).toLocaleDateString(),
        })))
    }

    void loadAffiliateSupportData().catch((error: unknown) => {
      console.error('Unable to load affiliate support cases:', error)
      if (!cancelled) toast.error(error instanceof Error ? error.message : 'Unable to load support cases.')
    })

    return () => { cancelled = true }
  }, [user])

  const sections = ['Overview', 'Membership', 'Dues & finance', 'Programmes', 'Documents', 'Support']
  const maxDues = Math.max(...initialDuesChart.map((item) => item.amount))
  const paidUpPct = membership.declared
    ? Math.round((membership.paid / membership.declared) * 100)
    : 0
  const gap = Math.max(0, membership.declared - membership.paid)
  const totalDues2026 = dueRows.reduce((sum, row) => sum + row.amount, 0)

  const touchUpdated = useCallback(() => {
    const stamp = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    setAffiliate((prev) => ({ ...prev, updated: stamp }))
    setSavingBanner('Changes saved to your affiliate workspace')
    window.setTimeout(() => setSavingBanner(null), 2500)
  }, [])

  const updateAffiliate = useCallback(
    <K extends keyof AffiliateProfile>(key: K, value: AffiliateProfile[K]) => {
      setAffiliate((prev) => ({ ...prev, [key]: value }))
      touchUpdated()
    },
    [touchUpdated],
  )

  const updateMembership = useCallback(
    <K extends keyof MembershipData>(key: K, value: MembershipData[K]) => {
      setMembership((prev) => ({ ...prev, [key]: value }))
      touchUpdated()
    },
    [touchUpdated],
  )

  useEffect(() => {
    if (!dueFile || !dueFile.type.startsWith('image/')) {
      setDuePreview(null)
      return
    }
    const url = URL.createObjectURL(dueFile)
    setDuePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [dueFile])

  useEffect(() => {
    if (!docFile || !docFile.type.startsWith('image/')) {
      setDocPreview(null)
      return
    }
    const url = URL.createObjectURL(docFile)
    setDocPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [docFile])

  const updateProjectField = (index: number, key: keyof Project, value: string | number) => {
    setProjects((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
    touchUpdated()
  }

  const updateEventField = (index: number, key: keyof EventItem, value: string) => {
    setEvents((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
    touchUpdated()
  }

  const updateDocumentField = (index: number, key: keyof DocumentItem, value: string) => {
    setDocuments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    )
    touchUpdated()
  }

  const activeProjects = projects.filter((p) => !p.archived)
  const archivedProjects = projects.filter((p) => p.archived)
  const activeEvents = events.filter((e) => !e.archived)
  const archivedEvents = events.filter((e) => e.archived)

  const activeDocuments = sortDocsByDateDesc(documents.filter((d) => !d.archived))
  const archivedDocuments = sortDocsByDateDesc(documents.filter((d) => d.archived))
  const visibleDocuments = documentsView === 'active' ? activeDocuments : archivedDocuments

  const addDue = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalBusy(true)
    try {
      let fileName: string | undefined
      let fileType: string | undefined
      let fileDataUrl: string | undefined
      if (dueFile) {
        fileName = dueFile.name
        fileType = dueFile.type
        if (dueFile.size <= 1.5 * 1024 * 1024) fileDataUrl = await readFileAsDataUrl(dueFile)
      }
      setDueRows((prev) => [
        {
          id: `due_${Date.now()}`,
          date: dueForm.date,
          reference: dueForm.reference,
          amount: Number(dueForm.amount) || 0,
          status: dueForm.status,
          fileName,
          fileType,
          fileDataUrl,
        },
        ...prev,
      ])
      setDueForm({ date: '', reference: '', amount: '', status: 'Received' })
      setDueFile(null)
      setShowAddDue(false)
      touchUpdated()
    } finally {
      setModalBusy(false)
    }
  }

  const addProgramme = (e: React.FormEvent) => {
    e.preventDefault()
    setProjects((prev) => [
      {
        id: `proj_${Date.now()}`,
        title: programmeForm.title,
        status: programmeForm.status,
        progress: Math.min(100, Number(programmeForm.progress) || 0),
        lead: programmeForm.lead,
        archived: false,
      },
      ...prev,
    ])
    setProgrammeForm({ title: '', status: 'Planning', progress: '0', lead: '' })
    setShowAddProgramme(false)
    touchUpdated()
  }

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault()
    setEvents((prev) => [
      {
        id: `evt_${Date.now()}`,
        ...eventForm,
        archived: false,
      },
      ...prev,
    ])
    setEventForm({ title: '', date: '', place: '', kind: 'Meeting' })
    setShowAddEvent(false)
    touchUpdated()
  }

  const archiveProject = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: true } : p)))
    touchUpdated()
  }
  const restoreProject = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, archived: false } : p)))
    touchUpdated()
  }
  const deleteProject = (id: string) => {
    if (!window.confirm('Permanently delete this programme?')) return
    setProjects((prev) => prev.filter((p) => p.id !== id))
    touchUpdated()
  }

  const archiveEvent = (id: string) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, archived: true } : ev)))
    touchUpdated()
  }
  const restoreEvent = (id: string) => {
    setEvents((prev) => prev.map((ev) => (ev.id === id ? { ...ev, archived: false } : ev)))
    touchUpdated()
  }
  const deleteEvent = (id: string) => {
    if (!window.confirm('Permanently delete this event?')) return
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    touchUpdated()
  }

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docFile) {
      alert('Please select a file to upload.')
      return
    }
    setModalBusy(true)
    try {
      let fileDataUrl: string | undefined
      if (docFile.size <= 1.5 * 1024 * 1024) fileDataUrl = await readFileAsDataUrl(docFile)
      const today = new Date().toISOString().slice(0, 10)
      setDocuments((prev) => [
        {
          id: `doc_${Date.now()}`,
          name: docForm.name || docFile.name,
          type: docForm.type,
          caption: docForm.caption,
          date: today,
          fileName: docFile.name,
          fileType: docFile.type,
          fileDataUrl,
          archived: false,
        },
        ...prev,
      ])
      setDocForm({ name: '', type: 'Other', caption: '' })
      setDocFile(null)
      setShowUploadDoc(false)
      touchUpdated()
    } finally {
      setModalBusy(false)
    }
  }

  const handleMakeQuery = async (caseData: Partial<HelpDeskCase>) => {
    if (!user || !currentAffiliate) {
      toast.error('Your account is not linked to an affiliate.')
      return
    }

    setIsFilingCase(true)
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const created = await createHelpdeskCase(supabase, {
        branch_id: null,
        affiliate_id: currentAffiliate.id,
        title: caseData.title?.trim() ?? '',
        member_name: currentAffiliate.name,
        member_phone: caseData.member_phone ?? '',
        member_email: caseData.member_email ?? '',
        description: caseData.description?.trim() ?? '',
      })

      setCases((previous) => [{
        id: created.id,
        title: created.title,
        status: created.status.replace(/_/g, ' '),
        updated: new Date(created.updated_at).toLocaleDateString(),
      }, ...previous])
      setShowFileCase(false)
      toast.success('Query submitted to the TUCOSWA helpdesk.')
    } catch (error) {
      console.error('Unable to submit affiliate query:', error)
      toast.error(error instanceof Error ? error.message : 'Unable to submit query.')
    } finally {
      setIsFilingCase(false)
    }
  }

  const archiveDocument = (id: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, archived: true } : d)))
    touchUpdated()
  }
  const restoreDocument = (id: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, archived: false } : d)))
    touchUpdated()
  }
  const removeDocument = (id: string) => {
    if (!window.confirm('Remove this document from your workspace?')) return
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    setPreviewDoc((cur) => (cur?.id === id ? null : cur))
    touchUpdated()
  }
  const shareDocument = async (doc: DocumentItem) => {
    const text = `${doc.name}${doc.caption ? ` — ${doc.caption}` : ''} (${doc.type}, ${doc.date})`
    try {
      await navigator.clipboard?.writeText(text)
      alert('Document reference copied for sharing.')
    } catch {
      alert(text)
    }
  }

  return (
    <div className="min-h-full bg-muted/20 p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        {savingBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {savingBanner}
          </div>
        )}

        {/* Hero — profile fields editable */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-emerald-100">
                <ShieldCheck className="h-4 w-4" />
                Affiliate workspace
                <span className="text-white/40">·</span>
                <span className="font-mono text-xs text-white/80">{affiliate.affiliateCode}</span>
              </div>

              <EditableField
                label="Official name"
                value={affiliate.name}
                onSave={(v) => updateAffiliate('name', v)}
                className="border-white/15 bg-white/[0.06] text-white"
                displayClassName="text-xl font-semibold tracking-tight md:text-2xl text-white"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Acronym"
                  value={affiliate.acronym}
                  onSave={(v) => updateAffiliate('acronym', v)}
                  className="border-white/15 bg-white/[0.06]"
                  displayClassName="text-white"
                />
                <EditableField
                  label="Status"
                  value={affiliate.status}
                  onSave={(v) => updateAffiliate('status', v)}
                  className="border-white/15 bg-white/[0.06]"
                  displayClassName="text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="border-emerald-300/30 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/15">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  {affiliate.status}
                </Badge>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
                  {affiliate.standing}
                </Badge>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/15 bg-white/[0.06] p-4 md:min-w-72">
              <p className="text-xs uppercase tracking-wide text-white/55">Affiliation contact</p>
              <EditableField
                label="Primary contact"
                value={affiliate.contact}
                onSave={(v) => updateAffiliate('contact', v)}
                className="border-white/10 bg-transparent p-0 shadow-none"
                displayClassName="text-white"
              />
              <EditableField
                label="Email"
                value={affiliate.email}
                type="email"
                onSave={(v) => updateAffiliate('email', v)}
                className="border-white/10 bg-transparent p-0 shadow-none"
                displayClassName="text-white/90"
              />
              <EditableField
                label="Phone"
                value={affiliate.phone}
                type="tel"
                onSave={(v) => updateAffiliate('phone', v)}
                className="border-white/10 bg-transparent p-0 shadow-none"
                displayClassName="text-white/90"
              />
              <EditableField
                label="Address"
                value={affiliate.address}
                onSave={(v) => updateAffiliate('address', v)}
                className="border-white/10 bg-transparent p-0 shadow-none"
                displayClassName="text-white/90"
              />
            </div>
          </div>
        </section>

        <nav
          className="flex gap-1 overflow-x-auto border-b"
          aria-label="Affiliate dashboard sections"
        >
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSection(item)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${section === item
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {section === 'Overview' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={Users}
                label="Declared members"
                value={membership.declared.toLocaleString()}
                helper={`${membership.paid.toLocaleString()} paid-up`}
                detail={`${paidUpPct}% paid-up`}
              />
              <Metric
                icon={CircleDollarSign}
                label="Dues recorded · 2026"
                value={money(totalDues2026)}
                helper={`Last payment: ${dueRows[0]?.date ?? '—'}`}
                detail="Up to date"
              />
              <Metric
                icon={FolderKanban}
                label="Active programmes"
                value={String(projects.length)}
                helper={`${projects.filter((p) => p.status === 'In progress').length} in progress`}
                detail="View programmes"
              />
              <Metric
                icon={Headphones}
                label="Open support cases"
                value={String(cases.length)}
                helper={`Most recent: ${cases[0]?.updated ?? '—'}`}
                detail="View support"
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="rounded-2xl">
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle className="text-base">Membership snapshot</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Edit full figures under Membership
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSection('Membership')}>
                    Manage <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5 pt-3">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Paid-up membership</span>
                      <span className="font-medium">
                        {membership.paid.toLocaleString()} / {membership.declared.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${paidUpPct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {gap.toLocaleString()} members still need to be included in the paid-up return.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="Women" value={membership.women.toLocaleString()} />
                    <MiniStat label="Men" value={membership.men.toLocaleString()} />
                    <MiniStat label="Other" value={membership.other.toLocaleString()} />
                    <MiniStat label="Shop stewards" value={String(membership.stewards)} />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent dues</CardTitle>
                  <p className="text-sm text-muted-foreground">Monthly affiliate subscription</p>
                </CardHeader>
                <CardContent>
                  <div className="flex h-28 items-end justify-between gap-3 px-1">
                    {initialDuesChart.map((item) => (
                      <div
                        key={item.month}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <div
                          className="w-full max-w-12 rounded-t-md bg-emerald-600/80"
                          style={{
                            height: `${Math.max(15, (item.amount / maxDues) * 72)}%`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{item.month}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
                    <span className="text-muted-foreground">Latest payment</span>
                    <span className="font-medium">
                      {dueRows[0] ? `${money(dueRows[0].amount)} · ${dueRows[0].date}` : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Upcoming events</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Manage under Programmes</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSection('Programmes')}>
                    See all <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="divide-y">
                  {events.slice(0, 2).map((event) => (
                    <div key={event.title} className="flex gap-4 py-3">
                      <div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                        <CalendarDays className="mb-0.5 h-4 w-4" />
                        <span className="text-[10px] font-semibold">{event.date}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{event.title}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {event.kind}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.place}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Recent documents</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Shared with your affiliate</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSection('Documents')}>
                    Browse <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="divide-y">
                  {documents.slice(0, 2).map((doc) => (
                    <div key={doc.name} className="flex items-center gap-3 py-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {doc.type} · Added {doc.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Affiliate record last updated {affiliate.updated}
              </p>
              <Button variant="outline" size="sm" onClick={() => setSection('Support')}>
                Contact TUCOSWA <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {section === 'Membership' && (
          <Panel
            title="Membership & leadership"
            intro="Update your affiliate return and registered contacts. Click Edit on any field to change it."
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <EditableNumberField
                label="Declared members"
                value={membership.declared}
                onSave={(v) => updateMembership('declared', v)}
              />
              <EditableNumberField
                label="Paid-up members"
                value={membership.paid}
                onSave={(v) => updateMembership('paid', v)}
              />
              <EditableNumberField
                label="Executive committee"
                value={membership.executiveCommittee}
                onSave={(v) => updateMembership('executiveCommittee', v)}
              />
              <EditableNumberField
                label="Women"
                value={membership.women}
                onSave={(v) => updateMembership('women', v)}
              />
              <EditableNumberField
                label="Men"
                value={membership.men}
                onSave={(v) => updateMembership('men', v)}
              />
              <EditableNumberField
                label="Other"
                value={membership.other}
                onSave={(v) => updateMembership('other', v)}
              />
              <EditableNumberField
                label="Shop stewards"
                value={membership.stewards}
                onSave={(v) => updateMembership('stewards', v)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <EditableField
                label="Regions represented"
                value={membership.regions}
                onSave={(v) => updateMembership('regions', v)}
              />
              <EditableField
                label="Sectors"
                value={membership.sectors}
                onSave={(v) => updateMembership('sectors', v)}
              />
              <EditableField
                label="Last congress"
                value={membership.lastCongress}
                onSave={(v) => updateMembership('lastCongress', v)}
              />
              <EditableField
                label="Constitution version"
                value={membership.constitutionVersion}
                onSave={(v) => updateMembership('constitutionVersion', v)}
              />
            </div>

            <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              Changes are held in this workspace session. Wire Save handlers to your affiliate-scoped
              Supabase update when accounts are linked.
            </p>
          </Panel>
        )}

        {section === 'Dues & finance' && (
          <Panel
            title="Dues & financial standing"
            intro="Record subscription payments and attach a receipt or proof. Standing is supervised by TUCOSWA finance."
          >
            <div className='flex justify-end'>
              <Button className="gap-2" onClick={() => setShowAddDue(true)}>
                <Plus className="h-4 w-4" />
                Record payment
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">2026 payments</p>
                  <p className="mt-1 text-lg font-semibold">{money(totalDues2026)}</p>
                </div>
                <EditableField
                  label="Monthly rate"
                  value={monthlyRate}
                  onSave={(v) => {
                    setMonthlyRate(v)
                    touchUpdated()
                  }}
                />
                <EditableField
                  label="Financial standing"
                  value={affiliate.standing}
                  onSave={(v) => updateAffiliate('standing', v)}
                  readOnly
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Reference</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dueRows.map((row) => (
                    <tr key={row.id}>
                      <td className="p-3">{row.date}</td>
                      <td className="p-3 font-mono text-xs">{row.reference}</td>
                      <td className="p-3">{money(row.amount)}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{row.status}</Badge>
                      </td>
                      <td className="p-3">
                        {row.fileDataUrl ? (
                          <a
                            href={row.fileDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {row.fileName || 'View file'}
                          </a>
                        ) : row.fileName ? (
                          <span className="text-muted-foreground">{row.fileName}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {section === 'Programmes' && (
          <Panel
            title="Programmes & events"
            intro="Add programmes and events, edit fields inline, or archive/delete records. Archived items are hidden from the active list."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg border p-1">
                <Button type="button" size="sm" variant={programmesView === 'active' ? 'default' : 'ghost'} onClick={() => setProgrammesView('active')}>
                  Active
                </Button>
                <Button type="button" size="sm" variant={programmesView === 'archived' ? 'default' : 'ghost'} onClick={() => setProgrammesView('archived')}>
                  Archived ({archivedProjects.length + archivedEvents.length})
                </Button>
              </div>
              {programmesView === 'active' && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => setShowAddEvent(true)}>
                    <Plus className="h-4 w-4" /> Add event
                  </Button>
                  <Button className="gap-2" onClick={() => setShowAddProgramme(true)}>
                    <Plus className="h-4 w-4" /> Add programme
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Programmes</p>
              {(programmesView === 'active' ? activeProjects : archivedProjects).length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No {programmesView} programmes.
                </p>
              )}
              {(programmesView === 'active' ? activeProjects : archivedProjects).map((project) => {
                const index = projects.findIndex((p) => p.id === project.id)
                return (
                  <div key={project.id} className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Badge variant={project.archived ? 'secondary' : project.status === 'In progress' ? 'default' : 'secondary'}>
                        {project.archived ? 'Archived' : project.status}
                      </Badge>
                      <div className="flex flex-wrap gap-1">
                        {project.archived ? (
                          <Button type="button" variant="outline" size="sm" onClick={() => restoreProject(project.id)}>
                            Restore
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => archiveProject(project.id)}>
                            <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => deleteProject(project.id)}>
                          <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <EditableField label="Programme title" value={project.title} onSave={(v) => updateProjectField(index, 'title', v)} />
                      <EditableField label="Status" value={project.status} onSave={(v) => updateProjectField(index, 'status', v)} />
                      <EditableField label="Lead" value={project.lead} onSave={(v) => updateProjectField(index, 'lead', v)} />
                      <EditableNumberField label="Progress %" value={project.progress} onSave={(v) => updateProjectField(index, 'progress', Math.min(100, v))} />
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Events</p>
              {(programmesView === 'active' ? activeEvents : archivedEvents).length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No {programmesView} events.
                </p>
              )}
              {(programmesView === 'active' ? activeEvents : archivedEvents).map((event) => {
                const index = events.findIndex((ev) => ev.id === event.id)
                return (
                  <div key={event.id} className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap justify-end gap-1">
                      {event.archived ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => restoreEvent(event.id)}>Restore</Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => archiveEvent(event.id)}>
                          <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <EditableField label="Title" value={event.title} onSave={(v) => updateEventField(index, 'title', v)} />
                      <EditableField label="Date label" value={event.date} onSave={(v) => updateEventField(index, 'date', v)} />
                      <EditableField label="Place" value={event.place} onSave={(v) => updateEventField(index, 'place', v)} />
                      <EditableField label="Kind" value={event.kind} onSave={(v) => updateEventField(index, 'kind', v)} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>
        )}

        {section === 'Documents' && (
          <Panel
            title="Affiliate documents"
            intro="Upload files with a type and caption. Sorted by date. Preview, share, archive, or remove each item."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg border p-1">
                <Button type="button" size="sm" variant={documentsView === 'active' ? 'default' : 'ghost'} onClick={() => setDocumentsView('active')}>
                  Active
                </Button>
                <Button type="button" size="sm" variant={documentsView === 'archived' ? 'default' : 'ghost'} onClick={() => setDocumentsView('archived')}>
                  Archived ({archivedDocuments.length})
                </Button>
              </div>
              {documentsView === 'active' && (
                <Button className="gap-2" onClick={() => setShowUploadDoc(true)}>
                  <Upload className="h-4 w-4" /> Upload document
                </Button>
              )}
            </div>

            {visibleDocuments.length === 0 ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No {documentsView} documents.
              </p>
            ) : (
              <div className="divide-y rounded-xl border">
                {visibleDocuments.map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="rounded-lg bg-muted p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {doc.type} · {doc.date}
                        {doc.caption ? ` · ${doc.caption}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => setPreviewDoc(doc)}>
                        Preview
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void shareDocument(doc)}>
                        Share
                      </Button>
                      {doc.archived ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => restoreDocument(doc.id)}>
                          Restore
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => archiveDocument(doc.id)}>
                          <Archive className="mr-1 h-3.5 w-3.5" /> Archive
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeDocument(doc.id)}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {section === 'Support' && (
          <Panel
            title="Support cases"
            intro="Follow requests submitted by your affiliate. Case status is updated by the TUCOSWA helpdesk."
          >
            <div className="flex justify-end">
              <Button
                type="button"
                className="gap-2"
                onClick={() => setShowFileCase(true)}
                disabled={!currentAffiliate || isFilingCase}
              >
                <Plus className="h-4 w-4" /> Make Query
              </Button>
            </div>
            <div className="space-y-3">
              {cases.length === 0 ? (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No support cases submitted yet.
                </p>
              ) : cases.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge variant={item.status === 'In progress' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.id} · Updated {item.updated}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" type="button">
                    View case
                  </Button>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-sm font-medium">Need assistance?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Reach the TUCOSWA helpdesk at helpdesk@tucoswa.org.sz or +268 2404 6810.
              </p>
              <Button className="mt-3" size="sm" asChild>
                <Link href="tel:+286 000 000">Open helpdesk</Link>
              </Button>
            </div>
          </Panel>
        )}
      </div>

      <FileCaseModal
        open={showFileCase}
        onOpenChange={setShowFileCase}
        onSubmit={handleMakeQuery}
        isLoading={isFilingCase}
        affiliate={currentAffiliate ?? undefined}
      />

      {/* Preview Documents */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
            <DialogDescription>
              {previewDoc?.type} · {previewDoc?.date}
              {previewDoc?.caption ? ` · ${previewDoc.caption}` : ''}
            </DialogDescription>
          </DialogHeader>
          {previewDoc?.fileDataUrl && previewDoc.fileType?.startsWith('image/') ? (
            <img src={previewDoc.fileDataUrl} alt={previewDoc.name} className="max-h-[60vh] w-full rounded-lg object-contain" />
          ) : previewDoc?.fileDataUrl ? (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
              <p>Preview is available as a download for this file type.</p>
              <a href={previewDoc.fileDataUrl} download={previewDoc.fileName || previewDoc.name} className="inline-flex items-center gap-2 text-primary underline-offset-2 hover:underline">
                <Download className="h-4 w-4" /> Download {previewDoc.fileName || 'file'}
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No file content stored for preview (metadata only).</p>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => previewDoc && void shareDocument(previewDoc)}>Share</Button>
            <Button type="button" variant="outline" onClick={() => setPreviewDoc(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal For Payments of Dues */}
      <Dialog open={showAddDue} onOpenChange={(o) => !modalBusy && setShowAddDue(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record subscription payment</DialogTitle>
            <DialogDescription>Enter payment details and optionally attach a receipt (PDF or image).</DialogDescription>
          </DialogHeader>
          <form onSubmit={addDue} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="due-date">Date *</Label>
                <Input id="due-date" required value={dueForm.date} onChange={(e) => setDueForm((f) => ({ ...f, date: e.target.value }))} placeholder="4 Nov 2026" disabled={modalBusy} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-ref">Reference *</Label>
                <Input id="due-ref" required value={dueForm.reference} onChange={(e) => setDueForm((f) => ({ ...f, reference: e.target.value }))} placeholder="TUC-SNAT-26-105" disabled={modalBusy} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-amount">Amount (E) *</Label>
                <Input id="due-amount" type="number" min="0" step="0.01" required value={dueForm.amount} onChange={(e) => setDueForm((f) => ({ ...f, amount: e.target.value }))} disabled={modalBusy} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-status">Status</Label>
                <select id="due-status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={dueForm.status} onChange={(e) => setDueForm((f) => ({ ...f, status: e.target.value }))} disabled={modalBusy}>
                  <option>Received</option>
                  <option>Pending</option>
                  <option>Queried</option>
                </select>
              </div>
            </div>
            <WorkspaceFilePicker
              id="due-file"
              label="Receipt / proof of payment"
              hint="PDF, JPG, PNG · recommended max 1.5 MB"
              accept="image/*,.pdf,application/pdf"
              file={dueFile}
              previewUrl={duePreview}
              disabled={modalBusy}
              onChange={setDueFile}
              onClear={() => setDueFile(null)}
            />
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" disabled={modalBusy} onClick={() => setShowAddDue(false)}>Cancel</Button>
              <Button type="submit" disabled={modalBusy}>
                {modalBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : 'Save payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal For Uploading documents */}
      <Dialog open={showUploadDoc} onOpenChange={(o) => !modalBusy && setShowUploadDoc(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload document</DialogTitle>
            <DialogDescription>Attach a file and set its type and caption for your affiliate register.</DialogDescription>
          </DialogHeader>
          <form onSubmit={uploadDocument} className="space-y-4">
            <WorkspaceFilePicker
              id="doc-file"
              label="File *"
              hint="PDF, Word, image · recommended max 1.5 MB for local preview"
              accept=".pdf,.doc,.docx,image/*,application/pdf"
              file={docFile}
              previewUrl={docPreview}
              disabled={modalBusy}
              onChange={(f) => {
                setDocFile(f)
                if (f && !docForm.name) setDocForm((prev) => ({ ...prev, name: f.name }))
              }}
              onClear={() => setDocFile(null)}
            />
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Display name</Label>
              <Input id="doc-name" value={docForm.name} onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))} disabled={modalBusy} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Type / category *</Label>
              <select id="doc-type" required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={docForm.type} onChange={(e) => setDocForm((f) => ({ ...f, type: e.target.value }))} disabled={modalBusy}>
                <option>Constitution</option>
                <option>Membership</option>
                <option>Financial</option>
                <option>Minutes</option>
                <option>Resolution</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-caption">Caption</Label>
              <Textarea id="doc-caption" value={docForm.caption} onChange={(e) => setDocForm((f) => ({ ...f, caption: e.target.value }))} placeholder="Short description for colleagues" disabled={modalBusy} />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" disabled={modalBusy} onClick={() => setShowUploadDoc(false)}>Cancel</Button>
              <Button type="submit" disabled={modalBusy || !docFile}>
                {modalBusy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal For Programme */}
      <Dialog open={showAddProgramme} onOpenChange={(open) => !modalBusy && setShowAddProgramme(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add programme</DialogTitle>
            <DialogDescription>
              Create a programme record for your affiliate workspace. You can edit fields later or archive it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addProgramme} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prog-title">Programme title *</Label>
              <Input
                id="prog-title"
                required
                value={programmeForm.title}
                onChange={(e) => setProgrammeForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Young Workers Leadership Network"
                disabled={modalBusy}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prog-status">Status</Label>
                <select
                  id="prog-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={programmeForm.status}
                  onChange={(e) => setProgrammeForm((f) => ({ ...f, status: e.target.value }))}
                  disabled={modalBusy}
                >
                  <option>Planning</option>
                  <option>In progress</option>
                  <option>On hold</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prog-progress">Progress %</Label>
                <Input
                  id="prog-progress"
                  type="number"
                  min={0}
                  max={100}
                  value={programmeForm.progress}
                  onChange={(e) => setProgrammeForm((f) => ({ ...f, progress: e.target.value }))}
                  disabled={modalBusy}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prog-lead">Lead</Label>
              <Input
                id="prog-lead"
                value={programmeForm.lead}
                onChange={(e) => setProgrammeForm((f) => ({ ...f, lead: e.target.value }))}
                placeholder="e.g. SNAT + TUCOSWA"
                disabled={modalBusy}
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={modalBusy}
                onClick={() => setShowAddProgramme(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={modalBusy || !programmeForm.title.trim()}>
                {modalBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Add programme'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal For Event */}
      <Dialog open={showAddEvent} onOpenChange={(open) => !modalBusy && setShowAddEvent(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add event</DialogTitle>
            <DialogDescription>
              Schedule an event linked to your affiliate. Archive it when it is no longer relevant.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={addEvent} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="evt-title">Event title *</Label>
              <Input
                id="evt-title"
                required
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Affiliate Secretaries Forum"
                disabled={modalBusy}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="evt-date">Date label *</Label>
                <Input
                  id="evt-date"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
                  placeholder="18 Nov"
                  disabled={modalBusy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="evt-kind">Kind</Label>
                <select
                  id="evt-kind"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={eventForm.kind}
                  onChange={(e) => setEventForm((f) => ({ ...f, kind: e.target.value }))}
                  disabled={modalBusy}
                >
                  <option>Meeting</option>
                  <option>Conference</option>
                  <option>Workshop</option>
                  <option>Training</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="evt-place">Place *</Label>
              <Input
                id="evt-place"
                required
                value={eventForm.place}
                onChange={(e) => setEventForm((f) => ({ ...f, place: e.target.value }))}
                placeholder="TUCOSWA House, Mbabane"
                disabled={modalBusy}
              />
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={modalBusy}
                onClick={() => setShowAddEvent(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={modalBusy || !eventForm.title.trim() || !eventForm.date.trim()}
              >
                {modalBusy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Add event'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  helper,
  detail,
}: {
  icon: typeof Users
  label: string
  value: string
  helper: string
  detail: string
}) {
  const positive = detail === 'Up to date' || detail.includes('%')
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        <p
          className={`mt-3 flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-700' : 'text-muted-foreground'
            }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {detail}
        </p>
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}

function Panel({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{intro}</p>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

function WorkspaceFilePicker({
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
        className={`relative rounded-lg border-2 border-dashed transition-colors ${file ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30 hover:border-primary/30'
          }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {!file ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 px-4 py-8 text-center"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </button>
        ) : (
          <div className="flex items-start gap-3 p-4">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="h-14 w-14 rounded-md object-cover ring-1 ring-border" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-md bg-background ring-1 ring-border">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} · {file.type || 'Unknown'}
              </p>
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
                  Replace
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} className="text-destructive" onClick={onClear}>
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