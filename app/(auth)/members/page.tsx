'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Affiliate, AffiliateStatus, FinancialStanding, Member, UserRole } from '@/lib/types'
import { dummyAffiliates, dummyMembers } from '@/lib/dummy-data'
import { Plus, Trash2, Download, Upload, Printer, Building2, UsersRound, WalletCards, FilePenLine, Archive, RefreshCcw, Search, ShieldCheck } from 'lucide-react'
import { BulkImportModal } from '@/components/modals/bulk-import-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { RegisterAffiliateModal, AffiliateDraft } from '@/components/modals/register-affiliate-modal'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

const statusStyles: Record<AffiliateStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-800', Provisional: 'bg-amber-100 text-amber-800', Suspended: 'bg-orange-100 text-orange-800', Expelled: 'bg-red-100 text-red-800', Withdrawn: 'bg-slate-100 text-slate-700'
}

const financialStyles: Record<FinancialStanding, string> = {
  'Good standing': 'bg-emerald-100 text-emerald-800', Arrears: 'bg-amber-100 text-amber-800', Suspended: 'bg-red-100 text-red-800'
}

const listFrom = (value?: string) => value ? value.split(',').map(item => item.trim()).filter(Boolean) : []

export default function MembersPage() {
  const { user } = useAuth()
  const canManage = [UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN].includes(user?.role!)
  const [view, setView] = useState<'affiliates' | 'workers'>('affiliates')
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFinancial, setFilterFinancial] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    const storedAffiliates = JSON.parse(localStorage.getItem('affiliates') || JSON.stringify(dummyAffiliates))
    const storedMembers = JSON.parse(localStorage.getItem('members') || JSON.stringify(dummyMembers))
    setAffiliates(storedAffiliates.filter((affiliate: Affiliate) => affiliate.active !== false))
    setMembers(storedMembers.filter((member: Member) => user?.role === UserRole.SECRETARY_GENERAL || member.branchId === user?.branchId))
  }, [user?.branchId, user?.role])

  if (!canManage) {
    return <div className="p-6"><Card><CardContent className="pt-6"><p className="text-muted-foreground">Only Secretary General and Branch Admins can manage affiliates and members.</p></CardContent></Card></div>
  }

  const filteredAffiliates = useMemo(() => affiliates.filter(affiliate => {
    const query = searchTerm.toLowerCase()
    const matchesSearch = !query || affiliate.officialName.toLowerCase().includes(query) || affiliate.acronym.toLowerCase().includes(query) || affiliate.affiliateId.toLowerCase().includes(query) || affiliate.sectors.some(sector => sector.toLowerCase().includes(query))
    return matchesSearch && (!filterStatus || affiliate.status === filterStatus) && (!filterFinancial || affiliate.financialStanding === filterFinancial)
  }), [affiliates, searchTerm, filterStatus, filterFinancial])

  const filteredMembers = useMemo(() => members.filter(member => {
    const query = searchTerm.toLowerCase()
    return (!query || member.name.toLowerCase().includes(query) || member.memberId.toLowerCase().includes(query) || member.phone.includes(searchTerm)) && (!filterGender || member.gender === filterGender)
  }), [members, searchTerm, filterGender])

  const pagedAffiliates = filteredAffiliates.slice((currentPage - 1) * perPage, currentPage * perPage)
  const pagedMembers = filteredMembers.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalPages = Math.ceil((view === 'affiliates' ? filteredAffiliates.length : filteredMembers.length) / perPage)
  const totalMembers = affiliates.reduce((total, affiliate) => total + affiliate.declaredMembership, 0)
  const goodStanding = affiliates.filter(affiliate => affiliate.financialStanding === 'Good standing').length

  const persistAffiliates = (next: Affiliate[]) => {
    setAffiliates(next)
    localStorage.setItem('affiliates', JSON.stringify(next))
  }

  const handleAffiliateSubmit = (draft: AffiliateDraft) => {
    setIsLoading(true)
    try {
      const { documentNames, ...data } = draft
      const now = new Date()
      const documents = listFrom(documentNames).map((name, index) => ({ id: `doc_${Date.now()}_${index}`, name, category: 'Other' as const, uploadedAt: now }))
      const existing = editingAffiliate
      const statusHistory = existing?.statusHistory || [{ status: data.status, reason: 'Initial affiliate registration', changedAt: now, changedBy: user?.name || 'TUCOSWA office' }]
      const nextAffiliate: Affiliate = {
        ...data, id: existing?.id || `affiliate_${Date.now()}`, active: true, documents: documents.length ? documents : existing?.documents || [], statusHistory: data.status !== existing?.status && existing ? [...statusHistory, { status: data.status, reason: 'Status updated during record edit', changedAt: now, changedBy: user?.name || 'TUCOSWA office' }] : statusHistory, createdAt: existing?.createdAt || now, updatedAt: now
      }
      persistAffiliates(existing ? affiliates.map(item => item.id === existing.id ? nextAffiliate : item) : [nextAffiliate, ...affiliates])
      setEditingAffiliate(null)
      setShowAffiliateModal(false)
    } finally { setIsLoading(false) }
  }

  const handleStatusChange = (affiliate: Affiliate, status: AffiliateStatus) => {
    const reason = window.prompt(`Reason for changing ${affiliate.acronym} to ${status}:`)
    if (!reason?.trim()) return
    const updated: Affiliate = { ...affiliate, status, updatedAt: new Date(), statusHistory: [...affiliate.statusHistory, { status, reason: reason.trim(), changedAt: new Date(), changedBy: user?.name || 'TUCOSWA office' }] }
    persistAffiliates(affiliates.map(item => item.id === affiliate.id ? updated : item))
  }

  const handleArchive = (affiliate: Affiliate) => {
    if (!window.confirm(`Archive ${affiliate.officialName}? The record will be retained but removed from the active register.`)) return
    const next = affiliates.filter(item => item.id !== affiliate.id)
    localStorage.setItem('affiliates', JSON.stringify([...next, { ...affiliate, active: false, updatedAt: new Date() }]))
    setAffiliates(next)
  }

  const exportAffiliates = () => {
    const headers = ['Affiliate ID', 'Official name', 'Acronym', 'Status', 'Financial standing', 'Declared members', 'Paid-up members', 'Sectors', 'Regions', 'Correspondence contact']
    const rows = filteredAffiliates.map(item => [item.affiliateId, item.officialName, item.acronym, item.status, item.financialStanding, item.declaredMembership, item.paidUpMembership, item.sectors.join('; '), item.regions.join('; '), item.correspondenceContact.name])
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'tucoswa-affiliates.csv'; link.click()
  }

  const exportMembers = () => {
    const headers = ['Member ID', 'Name', 'Phone', 'Gender', 'Workplace', 'Affiliate ID', 'Subscription status', 'Join date']
    const rows = filteredMembers.map(member => [member.memberId, member.name, member.phone, member.gender, member.workplace, member.affiliateId || '', member.subscriptionStatus || '', new Date(member.joinDate).toLocaleDateString()])
    const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'tucoswa-workers.csv'; link.click()
  }

  const handlePrint = () => window.print()
  const handleMemberDelete = (id: string) => {
    const next = JSON.parse(localStorage.getItem('members') || '[]').filter((member: Member) => member.id !== id)
    localStorage.setItem('members', JSON.stringify(next)); setMembers(members.filter(member => member.id !== id))
  }

  const saveMembers = (next: Member[]) => { localStorage.setItem('members', JSON.stringify(next)); setMembers(next.filter(member => user?.role === UserRole.SECRETARY_GENERAL || member.branchId === user?.branchId)) }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div><div className="flex items-center gap-3"><Building2 className="h-8 w-8 text-primary" /><h1 className="text-3xl font-bold text-foreground">Membership & Affiliates</h1></div><p className="mt-1 text-muted-foreground">Manage TUCOSWA’s affiliate unions as the primary entity, then connect workers and workplace structures.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={view === 'affiliates' ? exportAffiliates : exportMembers} className="gap-2"><Download className="h-4 w-4" />Export CSV</Button><Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" />Print</Button>{view === 'workers' && <><Button variant="outline" onClick={() => setShowBulkImport(true)} className="gap-2"><Upload className="h-4 w-4" />Bulk import</Button><Button onClick={() => setShowAddMemberModal(true)} className="gap-2"><Plus className="h-4 w-4" />Add worker</Button></>}{view === 'affiliates' && <Button onClick={() => { setEditingAffiliate(null); setShowAffiliateModal(true) }} className="gap-2"><Plus className="h-4 w-4" />Register affiliate</Button>}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Active affiliates</p><p className="mt-1 text-3xl font-bold text-primary">{affiliates.length}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Declared membership</p><p className="mt-1 text-3xl font-bold text-primary">{totalMembers.toLocaleString()}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Good-standing affiliates</p><p className="mt-1 text-3xl font-bold text-emerald-700">{goodStanding}</p></CardContent></Card><Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Linked worker records</p><p className="mt-1 text-3xl font-bold text-primary">{members.length}</p></CardContent></Card></div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border"><Button variant={view === 'affiliates' ? 'default' : 'ghost'} onClick={() => { setView('affiliates'); setSearchTerm(''); setCurrentPage(1) }} className="gap-2"><Building2 className="h-4 w-4" />Affiliate register</Button><Button variant={view === 'workers' ? 'default' : 'ghost'} onClick={() => { setView('workers'); setSearchTerm(''); setCurrentPage(1) }} className="gap-2"><UsersRound className="h-4 w-4" />Individual workers</Button></div>

      <div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={view === 'affiliates' ? 'Search by affiliate name, acronym, ID, or sector...' : 'Search by worker name, ID, or phone...'} value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setCurrentPage(1) }} /></div>{view === 'affiliates' ? <><select value={filterStatus} onChange={event => setFilterStatus(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All statuses</option><option>Active</option><option>Provisional</option><option>Suspended</option><option>Expelled</option><option>Withdrawn</option></select><select value={filterFinancial} onChange={event => setFilterFinancial(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All financial standing</option><option>Good standing</option><option>Arrears</option><option>Suspended</option></select></> : <select value={filterGender} onChange={event => setFilterGender(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">All genders</option><option>Male</option><option>Female</option><option>Other</option></select>}</div>

      {view === 'affiliates' ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Affiliate</TableHead><TableHead>Status</TableHead><TableHead>Membership</TableHead><TableHead>Sectors / regions</TableHead><TableHead>Financial</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pagedAffiliates.map(affiliate => <TableRow key={affiliate.id}><TableCell><div className="font-semibold">{affiliate.acronym}</div><div className="text-xs text-muted-foreground">{affiliate.officialName}</div><div className="mt-1 text-xs text-muted-foreground">{affiliate.affiliateId}</div></TableCell><TableCell><Badge className={statusStyles[affiliate.status]}>{affiliate.status}</Badge></TableCell><TableCell><div className="font-medium">{affiliate.declaredMembership.toLocaleString()}</div><div className="text-xs text-muted-foreground">{affiliate.paidUpMembership.toLocaleString()} paid-up · {affiliate.shopStewards} stewards</div></TableCell><TableCell><div className="max-w-56 text-sm">{affiliate.sectors.join(', ') || '—'}</div><div className="text-xs text-muted-foreground">{affiliate.regions.join(', ') || 'No regions recorded'}</div></TableCell><TableCell><Badge className={financialStyles[affiliate.financialStanding]}>{affiliate.financialStanding}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" title="Edit affiliate" onClick={() => { setEditingAffiliate(affiliate); setShowAffiliateModal(true) }}><FilePenLine className="h-4 w-4" /></Button><select aria-label={`Change status for ${affiliate.acronym}`} value={affiliate.status} onChange={event => handleStatusChange(affiliate, event.target.value as AffiliateStatus)} className="h-8 rounded-md border border-border bg-background px-1 text-xs"><option>Active</option><option>Provisional</option><option>Suspended</option><option>Expelled</option><option>Withdrawn</option></select><Button variant="ghost" size="sm" title="Archive affiliate" onClick={() => handleArchive(affiliate)} className="text-muted-foreground"><Archive className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table>{pagedAffiliates.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No affiliate records match these filters.</CardContent></Card>}</div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Member ID</TableHead><TableHead>Name</TableHead><TableHead>Affiliate</TableHead><TableHead>Gender</TableHead><TableHead>Workplace / job</TableHead><TableHead>Subscription</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{pagedMembers.map(member => { const affiliate = affiliates.find(item => item.id === member.affiliateId); return <TableRow key={member.id}><TableCell className="font-medium">{member.memberId}</TableCell><TableCell><div>{member.name}</div><div className="text-xs text-muted-foreground">{member.phone}</div></TableCell><TableCell>{affiliate?.acronym || 'Unlinked'}</TableCell><TableCell>{member.gender}</TableCell><TableCell><div>{member.workplace}</div><div className="text-xs text-muted-foreground">{member.jobCategory || '—'}</div></TableCell><TableCell>{member.subscriptionStatus || 'Not recorded'}</TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleMemberDelete(member.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow> })}</TableBody></Table>{pagedMembers.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">No worker records match these filters.</CardContent></Card>}</div>}

      {totalPages > 1 && <div className="flex items-center justify-center gap-3 py-4"><Button variant="outline" size="sm" onClick={() => setCurrentPage(page => Math.max(1, page - 1))} disabled={currentPage === 1}>Previous</Button><span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="outline" size="sm" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</Button></div>}

      <RegisterAffiliateModal open={showAffiliateModal} onOpenChange={open => { setShowAffiliateModal(open); if (!open) setEditingAffiliate(null) }} initialAffiliate={editingAffiliate} onSubmit={handleAffiliateSubmit} isLoading={isLoading} />
      <AddMemberModal open={showAddMemberModal} onOpenChange={setShowAddMemberModal} onSubmit={member => { setIsLoading(true); try { const all = JSON.parse(localStorage.getItem('members') || '[]'); const newMember: Member = { ...member, id: `member_${Date.now()}`, joinDate: new Date() }; saveMembers([...all, newMember]); setShowAddMemberModal(false) } finally { setIsLoading(false) } }} isLoading={isLoading} branchId={user?.branchId || 'branch_main'} />
      <BulkImportModal open={showBulkImport} onOpenChange={setShowBulkImport} onSubmit={newMembers => { setIsLoading(true); try { const all = JSON.parse(localStorage.getItem('members') || '[]'); const imported = newMembers.map((member, index) => ({ ...member, id: `member_${Date.now()}_${index}`, branchId: user?.branchId || 'branch_main' } as Member)); saveMembers([...all, ...imported]); setShowBulkImport(false) } finally { setIsLoading(false) } }} isLoading={isLoading} />
    </div>
  )
}
