'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth-context'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { Affiliate, AffiliateDocument, AffiliateStatus, FinancialStanding, Member, UserRole, Role, Permission } from '@/lib/types'
import {
  Plus, Trash2, Download, Upload, Printer, Building2, UsersRound,
  FilePenLine, Archive, Search, CreditCard, FileText, Link2, Bell, BarChart3,
  CheckCircle2, XCircle, ArrowRightLeft, IdCard, Award, ShieldCheck, ReceiptCent
} from 'lucide-react'
import { BulkImportModal } from '@/components/modals/bulk-import-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { RegisterAffiliateModal, AffiliateDraft } from '@/components/modals/register-affiliate-modal'
import { AffiliateAction, AffiliateActionsModal } from '@/components/modals/affiliate-actions-modal'
import { MemberRecordModal } from '@/components/modals/member-record-modal'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { canSee, recordActivityLog } from '@/lib/constants'
import { useUserIP } from '@/lib/userUserIp'
import { getAllRoles, getAllPermissions, updateUserAccount } from '@/services/auth-services'
import {
  createAffiliate, createAffiliateDocument, createAffiliateLeadership,
  createAffiliatePayment, createAffiliateNotification, createAffiliateLink,
  createAffiliateStatusHistory, createAffiliateStatusRequest, deleteAffiliateLeadership,
  createMember, createMemberTransferRequest, deleteAffiliateDocument,
  deleteAffiliateLink, getAffiliateDocuments, getAffiliateLeadership,
  getAffiliatePayments, getAffiliateStatusHistory, getAffiliateStatusRequests,
  getAllAffiliates, getAllMembers, getAffiliateLinks, getMemberTransferRequests,
  updateAffiliate, updateAffiliateDocument, updateAffiliateStatusRequest,
  updateMember, approveMemberTransfer,
  rejectMemberTransfer, uploadAffiliateDocument,
} from '@/services/affiliate-service'
import { getAllUsersWithRoles } from '@/services/auth-services'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { AppUser } from '@/lib/types'

const statusStyles: Record<AffiliateStatus, string> = { Active: 'bg-emerald-100 text-emerald-800', Provisional: 'bg-amber-100 text-amber-800', Suspended: 'bg-orange-100 text-orange-800', Expelled: 'bg-red-100 text-red-800', Withdrawn: 'bg-slate-100 text-slate-700' }
const financialStyles: Record<FinancialStanding, string> = { 'Good standing': 'bg-emerald-100 text-emerald-800', Arrears: 'bg-amber-100 text-amber-800', Suspended: 'bg-red-100 text-red-800' }
const csvDownload = (filename: string, rows: unknown[][]) => { const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = filename; link.click(); URL.revokeObjectURL(link.href) }
const textDownload = (filename: string, content: string, type = 'text/plain') => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type })); link.download = filename; link.click(); URL.revokeObjectURL(link.href) }

export default function MembersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isSecretaryGeneral = user?.role.toLowerCase().replaceAll('_', ' ').trim() === 'secretary general'
  const { ip } = useUserIP()
  const [users, setUsers] = useState<AppUser[]>([])
  const [view, setView] = useState<'affiliates' | 'workers'>('affiliates')
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [affiliateAction, setAffiliateAction] = useState<AffiliateAction | null>(null)
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null)
  const [showAffiliateModal, setShowAffiliateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [showApprovals, setShowApprovals] = useState(false)
  const [statusRequests, setStatusRequests] = useState<any[]>([])
  const [transferRequests, setTransferRequests] = useState<any[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFinancial, setFilterFinancial] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const perPage = 10

  useEffect(() => {
    if (!user) return;

    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const [loadedRoles, loadedPermissions] = await Promise.all([
        getAllRoles(supabase, session),
        getAllPermissions(supabase, session),
      ])

      if (!cancelled) {
        setRoles(loadedRoles ?? [])
        setPermissions(loadedPermissions ?? [])
      }
    }

    const loadAllSystemUsers = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) return

        const loadedUsers = await getAllUsersWithRoles(supabase, session)

        if (!cancelled) {
          setUsers(loadedUsers!)
        }
      } catch (error) {
        toast.success(`Failed to load users: ${error}`)
      }
    }

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })
    void loadAllSystemUsers().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user]);

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const loadData = async () => {
      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const [affiliateRows, memberRows, statusRows, transferRows] = await Promise.all([
          getAllAffiliates(supabase, { active: true }), getAllMembers(supabase),
          getAffiliateStatusRequests(supabase, { status: 'Pending' }),
          getMemberTransferRequests(supabase, { status: 'Pending' }),
        ])
        const loadedAffiliates = await Promise.all(affiliateRows.map(async affiliate => {
          const [leadership, documents, status_history] = await Promise.all([
            getAffiliateLeadership(supabase, affiliate.id), getAffiliateDocuments(supabase, affiliate.id),
            getAffiliateStatusHistory(supabase, affiliate.id),
          ])
          return { ...affiliate, leadership, documents, status_history }
        }))
        if (cancelled) return
        setAffiliates(loadedAffiliates as Affiliate[])
        setMembers(memberRows.filter(member => isSecretaryGeneral || member.branch_id === user.branchId).map((member: any) => ({ ...member, dob: member.date_of_birth ?? '', jobCategory: member.job_category, subscriptionStatus: member.subscription_status, tucoswaStatus: member.tucoswa_status })) as Member[])
        setStatusRequests(statusRows.map((row: any) => ({ ...row, affiliateId: row.affiliate_id, affiliateName: affiliateRows.find(a => a.id === row.affiliate_id)?.acronym, currentStatus: affiliateRows.find(a => a.id === row.affiliate_id)?.status, requestedStatus: row.requested_status, requestedBy: row.requested_by })))
        setTransferRequests(transferRows.map((row: any) => ({ ...row, memberId: row.member_id, memberName: memberRows.find(m => m.id === row.member_id)?.name, fromAffiliateId: row.from_affiliate_id, toAffiliateId: row.to_affiliate_id })))
      } catch (error) { console.error('Unable to load members and affiliates:', error) }
      finally { if (!cancelled) setIsLoading(false) }
    }
    void loadData()
    return () => { cancelled = true }
  }, [user?.branchId, user?.role, isSecretaryGeneral])

  useEffect(() => {
    if (!selectedAffiliate) { setAffiliateLinks([]); return }
    void getAffiliateLinks(supabase(), selectedAffiliate.id).then(setAffiliateLinks).catch(error => console.error('Unable to load affiliate links:', error))
  }, [selectedAffiliate?.id])

  if (canSee(user?.role ?? '', roles.map(role => role.id))) return (
    <div className="p-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Only Secretary General and Branch Admins can manage affiliates and members.</p>
        </CardContent>
      </Card>
    </div>
  )

  const filteredAffiliates = useMemo(() =>
    affiliates.filter(affiliate => {
      const query = searchTerm.toLowerCase();
      return (
        !query || affiliate.official_name.toLowerCase().includes(query)
        || affiliate.acronym.toLowerCase().includes(query)
        || affiliate.affiliate_id.toLowerCase().includes(query)
        || affiliate.sectors.some(sector => sector.toLowerCase().includes(query)))
        && (!filterStatus || affiliate.status === filterStatus)
        && (!filterFinancial || affiliate.financial_standing === filterFinancial)
    }),
    [affiliates, searchTerm, filterStatus, filterFinancial]
  )

  const filteredMembers = useMemo(() => members.filter(member => {
    const query = searchTerm.toLowerCase();
    return (
      !query || member.name.toLowerCase().includes(query)
      || member.member_id.toLowerCase().includes(query)
      || member.phone.includes(searchTerm))
      && (!filterGender || member.gender === filterGender)
  }
  ), [members, searchTerm, filterGender])
  const pagedAffiliates = filteredAffiliates.slice((currentPage - 1) * perPage, currentPage * perPage)
  const pagedMembers = filteredMembers.slice((currentPage - 1) * perPage, currentPage * perPage)
  const totalPages = Math.ceil((view === 'affiliates' ? filteredAffiliates.length : filteredMembers.length) / perPage)
  const totalMembers = affiliates.reduce((total, affiliate) => total + affiliate.declared_membership, 0)
  const goodStanding = affiliates.filter(affiliate => affiliate.financial_standing === 'Good standing').length

  const supabase = () => {
    const client = getSupabaseBrowserClient()
    if (!client) throw new Error('Supabase is not configured.')
    return client
  }
  const persistAffiliates = (next: Affiliate[]) => setAffiliates(next)
  const persistMembers = (next: Member[]) => setMembers(next.filter(member => isSecretaryGeneral || member.branch_id === user?.branchId))

  const handleAffiliateSubmit = async (draft: AffiliateDraft) => {
    setIsLoading(true);
    try {
      const { documentFiles = [], ...data } = draft;
      const existing = editingAffiliate;
      const client = supabase()
      const payload: any = {
        affiliate_id: data.affiliate_id, official_name: data.official_name, acronym: data.acronym,
        registration_number: data.registration_number || null, affiliation_date: data.affiliation_date,
        founding_date: data.founding_date || null, physical_address: data.physical_address,
        postal_address: data.postal_address || null, phone_numbers: data.phone_numbers,
        email: data.email || null, website: data.website || null, social_media: data.social_media || null,
        correspondence_contact: data.correspondence_contact,
        last_congress_date: data.last_congress_date || null,
        constitution_version: data.constitution_version || null, executive_committee_size: data.executive_committee_size,
        declared_membership: data.declared_membership, paid_up_membership: data.paid_up_membership,
        gender_breakdown: data.gender_breakdown, age_groups: data.age_groups || null, sectors: data.sectors,
        regions: data.regions, shop_stewards: data.shop_stewards, dues_rate: data.dues_rate || null,
        payment_history: data.payment_history || null, financial_standing: data.financial_standing,
        bank_details: data.bank_details || null, status: data.status, notes: data.notes || null, active: true,
        updated_at: new Date().toISOString(),
      }
      const saved = existing ? await updateAffiliate(client, existing.id, payload) : await createAffiliate(client, payload)
      const id = saved.id
      if (!existing || JSON.stringify(existing.leadership) !== JSON.stringify(data.leadership)) {
        if (existing) await Promise.all(existing.leadership.map(item => deleteAffiliateLeadership(client, (item as any).id)))
        await Promise.all(data.leadership.map(item => createAffiliateLeadership(client, { ...item, affiliate_id: id } as any)))
      }
      if (!existing) await createAffiliateStatusHistory(client, { affiliate_id: id, status: data.status, reason: 'Initial affiliate registration', changed_by: user?.name })
      if (documentFiles.length) await Promise.all(documentFiles.map(file => uploadAffiliateDocument(client, id, file)))
      const [leadership, documents, status_history] = await Promise.all([getAffiliateLeadership(client, id), getAffiliateDocuments(client, id), getAffiliateStatusHistory(client, id)])
      const complete = { ...saved, leadership, documents, status_history } as Affiliate
      persistAffiliates(existing ? affiliates.map(item => item.id === id ? complete : item) : [complete, ...affiliates])

      setEditingAffiliate(null);
      setShowAffiliateModal(false)

      if (complete) {
        toast.success(`${draft.acronym} created successfully.`)
        recordActivityLog('Record', `Recorded Affiliate - ${draft.acronym}`, user?.id, user?.name, ip!)
      }
    } catch (error) {
      console.error('Unable to save affiliate:', error);
      toast.error(error instanceof Error ? error.message : 'Unable to save affiliate.')
    } finally { setIsLoading(false) }
  }

  const requestStatusChange = async (affiliate: Affiliate, requestedStatus: AffiliateStatus) => {
    if (requestedStatus === affiliate.status) return;
    const reason = window.prompt(`Reason for requesting ${requestedStatus} for ${affiliate.acronym}:`);
    if (!reason?.trim()) return;
    try {
      const row = await createAffiliateStatusRequest(supabase(), { affiliate_id: affiliate.id, requested_status: requestedStatus, reason: reason.trim(), requested_by: user?.name, status: 'Pending' } as any)
      setStatusRequests(previous => [...previous, { ...row, affiliateId: affiliate.id, affiliateName: affiliate.acronym, currentStatus: affiliate.status, requestedStatus, requestedBy: user?.name }])
      toast.success('Status change submitted for approval. The current status remains unchanged until approved.')
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to submit status request.') }
  }

  const decideStatus = async (request: any, decision: 'Approved' | 'Rejected') => {
    try {
      const client = supabase()
      await updateAffiliateStatusRequest(client, request.id, { status: decision, reviewed_by: user?.name, reviewed_at: new Date().toISOString() } as any)
      if (decision === 'Approved') {
        await updateAffiliate(client, request.affiliate_id ?? request.affiliateId, { status: request.requested_status ?? request.requestedStatus, updated_at: new Date().toISOString() } as any)
        await createAffiliateStatusHistory(client, { affiliate_id: request.affiliate_id ?? request.affiliateId, status: request.requested_status ?? request.requestedStatus, reason: request.reason, changed_by: user?.name } as any)
      }
      setStatusRequests(previous => previous.filter(item => item.id !== request.id))
      await reloadAffiliate(request.affiliate_id ?? request.affiliateId)
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to process status request.') }
  }

  const reloadAffiliate = async (id: string) => {
    const client = supabase()
    const row: any = await getAllAffiliates(client, { id }).then(rows => rows[0])
    if (!row) return
    const [leadership, documents, status_history] = await Promise.all([getAffiliateLeadership(client, id), getAffiliateDocuments(client, id), getAffiliateStatusHistory(client, id)])
    setAffiliates(previous => previous.map(item => item.id === id ? { ...row, leadership, documents, status_history } : item))
  }

  const archiveAffiliate = async (affiliate: Affiliate) => {
    if (!window.confirm(`Archive ${affiliate.official_name}?`)) return;
    await updateAffiliate(supabase(), affiliate.id, { active: false, updated_at: new Date().toISOString() } as any)
    setAffiliates(affiliates.filter(item => item.id !== affiliate.id))

    recordActivityLog('Archive', `Archived Affiliate - ${affiliate.official_name}`, user?.id, user?.name, ip!)
  }

  const exportAffiliates = () => {
    const source = affiliates;
    csvDownload('tucoswa-affiliates.csv', [['Affiliate ID', 'Official name', 'Acronym', 'Status', 'Financial standing', 'Declared members', 'Paid-up members', 'Sectors', 'Regions'],
    ...source.map((item: Affiliate) => [item.affiliate_id, item.official_name, item.acronym, item.status, item.financial_standing, item.declared_membership, item.paid_up_membership, item.sectors.join('; '), item.regions.join('; ')])])
  }

  const generateReport = async (affiliate: Affiliate, reportType: string) => {
    const [payments, links] = await Promise.all([getAffiliatePayments(supabase(), affiliate.id), getAffiliateLinks(supabase(), affiliate.id)])
    const report = [
      `TUCOSWA ${reportType}`,
      `Generated: ${new Date().toLocaleString()}`, '',
      `Affiliate: ${affiliate.official_name} (${affiliate.acronym})`,
      `Affiliate ID: ${affiliate.affiliate_id}`,
      `Status: ${affiliate.status}`,
      `Financial standing: ${affiliate.financial_standing}`,
      `Declared membership: ${affiliate.declared_membership}`,
      `Paid-up membership: ${affiliate.paid_up_membership}`,
      `Women / men / other: ${affiliate.gender_breakdown.female} / ${affiliate.gender_breakdown.male} / ${affiliate.gender_breakdown.other}`,
      `Sectors: ${affiliate.sectors.join(', ')}`,
      `Regions: ${affiliate.regions.join(', ')}`,
      `Shop stewards: ${affiliate.shop_stewards}`,
      `Payments recorded: ${payments.length}`,
      `Linked records: ${links.length}`, '',
      'Notes:', affiliate.notes || 'None'].join('\n');
    textDownload(`${affiliate.acronym.toLowerCase()}-${reportType.toLowerCase().replaceAll(' ', '-')}.txt`, report)
  }

  const invoice = async (affiliate: Affiliate) => {
    const payments = await getAffiliatePayments(supabase(), affiliate.id);
    const monthlyRate = Number.parseFloat((affiliate.dues_rate || '').replace(/[^0-9.]/g, '')) || 0;
    const estimatedArrears = Math.max(0, affiliate.declared_membership - affiliate.paid_up_membership) * monthlyRate;
    textDownload(`${affiliate.acronym.toLowerCase()}-invoice.txt`, `TUCOSWA AFFILIATION INVOICE\n${affiliate.official_name}\nIssued: ${new Date().toLocaleDateString()}\nDeclared membership: ${affiliate.declared_membership}\nDues rate: ${affiliate.dues_rate || 'Not recorded'}\nPayments recorded: ${payments.length}\nEstimated arrears: E${estimatedArrears.toFixed(2)}\nNote: Estimate is based on the declared/paid-up membership gap; finance should verify before issuing.`)
  }
  const certificate = (affiliate: Affiliate) => textDownload(`${affiliate.acronym.toLowerCase()}-good-standing.txt`, `TUCOSWA GOOD-STANDING CERTIFICATE\n\nThis certifies that ${affiliate.official_name} (${affiliate.acronym}) is recorded as ${affiliate.financial_standing} as of ${new Date().toLocaleDateString()}.\n\nSecretary General: ${user?.name || 'TUCOSWA office'}`)

  const handleAffiliateAction = async (payload: Record<string, string>) => {
    if (!selectedAffiliate || !affiliateAction) return;
    const { data: { session }, error } = await supabase().auth.getSession()
    if (error) throw error
    if (!session) return

    const now = new Date();
    if (affiliateAction === 'payment') {
      await createAffiliatePayment(supabase(), { affiliate_id: selectedAffiliate.id, amount: Number(payload.amount), payment_date: payload.period || null, reference: payload.reference || null, notes: payload.fileName ? `Receipt: ${payload.fileName}` : null, recorded_by: user?.name } as any)
      await updateAffiliate(supabase(), selectedAffiliate.id, { payment_history: `${selectedAffiliate.payment_history || ''} ${payload.period}: E${payload.amount} (${payload.reference || 'no reference'}).`, financial_standing: 'Good standing', updated_at: new Date() })
      await reloadAffiliate(selectedAffiliate.id)
      toast.success('Payment recorded and financial standing updated.')
      recordActivityLog('Record', `Payment recorded & update standing balance`, user?.id, user?.name, ip!)
    } else if (affiliateAction === 'document') {
      const document: AffiliateDocument = {
        id: `doc_${Date.now()}`,
        name: payload.name || payload.fileName || 'Untitled document',
        category: payload.category as AffiliateDocument['category'],
        version: payload.version,
        uploaded_at: now,
      }
      const saved = await createAffiliateDocument(supabase(), { ...document, affiliate_id: selectedAffiliate.id } as any)
      setAffiliates(previous => previous.map(item => item.id === selectedAffiliate.id ? { ...item, documents: [...item.documents, saved as AffiliateDocument] } : item))
    } else if (affiliateAction === 'notify') {
      await createAffiliateNotification(supabase(), { affiliate_id: selectedAffiliate.id, subject: payload.subject, message: payload.message, status: 'Queued', queued_by: user?.name } as any)
      toast.success('Notification queued for delivery.')
    } else if (affiliateAction === 'link') {
      let updatedUser;
      await createAffiliateLink(supabase(),
        {
          affiliate_id: selectedAffiliate.id,
          link_type: payload.linkType,
          target_id: payload.targetId,
          relation: payload.relation,
          linked_by: user?.name
        } as any)

      if (payload.linkType.toLowerCase() === "Admin".toLowerCase()) {
        updatedUser = await updateUserAccount(supabase(), session, {
          user_id: payload.targetId,
          affiliate_id: selectedAffiliate.id
        })
      }
      updatedUser ? toast.success(`${users.find(u => u.id === payload.targetId)?.full_name} linked as Admin to affiliate.`) : toast.success('Record linked to affiliate.')
    } else if (affiliateAction === 'report') generateReport(selectedAffiliate, payload.reportType);
    setAffiliateAction(null)
    await reloadAffiliate(selectedAffiliate.id)
  }
  const documentAction = async (action: 'archive' | 'share', document: AffiliateDocument) => { if (!selectedAffiliate) return; if (action === 'share') { const text = `${selectedAffiliate.acronym}: ${document.name}${document.version ? ` (${document.version})` : ''}`; navigator.clipboard?.writeText(text); alert('Document reference copied for sharing.') } else { await updateAffiliateDocument(supabase(), document.id, { archived_at: new Date().toISOString(), archived_by: user?.name } as any); setAffiliates(previous => previous.map(item => item.id === selectedAffiliate.id ? { ...item, documents: item.documents.filter(doc => doc.id !== document.id) } : item)) } }

  const unlinkRecord = async (link: any) => {
    // setIsLoading(true)
    const { data: { session }, error } = await supabase().auth.getSession()
    try {
      if (link.link_type.toLowerCase() === "admin".toLowerCase()) {
        const updatedUser = await updateUserAccount(supabase(), session, {
          user_id: link.target_id,
          affiliate_id: "Null"
        })
      }
      await deleteAffiliateLink(supabase(), link.id)
      toast.success('Record unlinked from affiliate.')

      recordActivityLog('Unlink', `Unlinked record - ${link?.link_type}`, user?.id, user?.name, ip!)
    } catch (err) {
      toast.error(`Failed to unlink record: ${err}`)
    }
  }

  const requestTransfer = async (member: Member, affiliateId: string, reason: string) => {
    try {
      const row = await createMemberTransferRequest(supabase(), { member_id: member.id, from_branch_id: member.branch_id ?? null, from_affiliate_id: member.affiliate_id ?? null, to_affiliate_id: affiliateId, reason, requested_by: user?.name, status: 'Pending' } as any)
      setTransferRequests(previous => [...previous, { ...row, memberId: member.id, memberName: member.name, fromAffiliateId: member.affiliate_id, toAffiliateId: affiliateId }])
      alert('Transfer submitted for approval.')
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to request transfer.') }

    recordActivityLog('Transfer', `Tranfered member - ${member.name}`, user?.id, user?.name, ip!)
  }

  const decideTransfer = async (request: any, decision: 'Approved' | 'Rejected') => {
    try {
      const client = supabase()
      if (decision === 'Approved') {
        await approveMemberTransfer(client, request.id, user?.name || 'TUCOSWA office')
        recordActivityLog('Approved', 'Approved member transfer', user?.id, user?.name, ip!)
      } else await rejectMemberTransfer(client, request.id, user?.name || 'TUCOSWA office')
      setTransferRequests(previous => previous.filter(item => item.id !== request.id))
      const freshMembers = await getAllMembers(client)
      persistMembers(freshMembers)
    } catch (error) { alert(error instanceof Error ? error.message : 'Unable to process transfer.') }
  }

  const saveMember = async (member: Member) => {
    const saved = await updateMember(supabase(), member.id, {
      name: member.name, email: member.email, phone: member.phone,
      date_of_birth: member.dob, workplace: member.workplace,
      job_category: member.job_category, gender: member.gender,
      address: member.address, subscription_status: member.subscription_status,
      tucoswa_status: member.tucoswa_status
    } as any)
    persistMembers(members.map(item => item.id === saved.id ? { ...item, ...member } : item))

    recordActivityLog('Add', `Added member`, user?.id, user?.name, ip!)
  }

  const credential = (member: Member, kind: 'card' | 'certificate') => {
    const affiliate = affiliates.find(item => item.id === member.affiliate_id);
    textDownload(
      `${member.member_id}-${kind}.txt`,
      `TUCOSWA ${kind.toUpperCase()}\n\n
      Member: ${member.name}\nMember ID: ${member.member_id}\n
      Affiliate: ${affiliate?.official_name || 'Unlinked'}\n
      Workplace: ${member.workplace}\n
      Status: ${member.tucoswa_status || 'Active'}\n
      Issued: ${new Date().toLocaleDateString()}`
    )
  }

  const markMemberDeleted = async (id: string) => {
    await updateMember(supabase(), id, { tucoswa_status: 'Resigned' } as any)
    persistMembers(members.map(item => item.id === id ? { ...item, tucoswa_status: 'Resigned' } : item))

    recordActivityLog('Mark as Deleted', `Marked member as deleted`, user?.id, user?.name, ip!)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Membership & Affiliates</h1>
          </div>
          <p className="mt-1 text-muted-foreground">Affiliates are the primary entity. Workers, branches, shop stewards, employers, finance, documents, and notices can be linked and audited from here.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={view === 'affiliates'
            ? exportAffiliates
            : () => csvDownload('tucoswa-workers.csv', [['Member ID', 'Name', 'Affiliate', 'Status', 'Subscription'],
            ...filteredMembers.map(member => [member.member_id, member.name,
            affiliates.find(item => item.id === member.affiliate_id)?.acronym || 'Unlinked',
            member.tucoswa_status || 'Active',
            member.subscription_status || 'Not recorded'])
            ])} className="gap-2">
            <Download className="h-4 w-4" />Export
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />Print
          </Button>
          <Button variant={statusRequests.length + transferRequests.length ? 'default' : 'outline'} onClick={() => setShowApprovals(true)} className="gap-2">
            <ShieldCheck className="h-4 w-4" />Approvals ({statusRequests.length + transferRequests.length})
          </Button>
          {view === 'workers' ? <>
            <Button variant="outline" onClick={() => setShowBulkImport(true)} className="gap-2">
              <Upload className="h-4 w-4" />Bulk import
            </Button>
            <Button onClick={() => setShowAddMemberModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />Add worker
            </Button>
          </>
            :
            <Button onClick={() => { setEditingAffiliate(null); setShowAffiliateModal(true) }} className="gap-2">
              <Plus className="h-4 w-4" />Register affiliate</Button>
          }
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Active affiliates</p>
            <p className="mt-1 text-3xl font-bold text-primary">{affiliates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Declared membership</p>
            <p className="mt-1 text-3xl font-bold text-primary">{totalMembers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Good-standing affiliates</p>
            <p className="mt-1 text-3xl font-bold text-emerald-700">{goodStanding}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Pending approvals</p>
            <p className="mt-1 text-3xl font-bold text-primary">{statusRequests.length + transferRequests.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        <Button variant={view === 'affiliates' ? 'default' : 'ghost'} onClick={() => { setView('affiliates'); setSearchTerm(''); setCurrentPage(1) }} className="gap-2">
          <Building2 className="h-4 w-4" />Affiliate register</Button>
        <Button variant={view === 'workers' ? 'default' : 'ghost'} onClick={() => { setView('workers'); setSearchTerm(''); setCurrentPage(1) }} className="gap-2">
          <UsersRound className="h-4 w-4" />Individual workers
        </Button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={view === 'affiliates' ? 'Search by affiliate, acronym, ID, or sector...' : 'Search by worker name, ID, or phone...'} value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setCurrentPage(1) }} />
        </div>
        {view === 'affiliates' ? <>
          <select value={filterStatus} onChange={event =>
            setFilterStatus(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Provisional</option>
            <option>Suspended</option>
            <option>Expelled</option>
            <option>Withdrawn</option>
          </select>

          <select value={filterFinancial}
            onChange={event => setFilterFinancial(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">All financial standing</option>
            <option>Good standing</option>
            <option>Arrears</option>
            <option>Suspended</option>
          </select>
        </>
          :
          <select value={filterGender} onChange={event => setFilterGender(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <option value="">All genders</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        }
      </div>

      {view === 'affiliates' ? <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Affiliate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Membership</TableHead>
              <TableHead>Financial</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pagedAffiliates.map(affiliate =>
              <TableRow key={affiliate.id} className="cursor-pointer" onClick={() => router.push(`/affiliate/${affiliate.id}`)}>
                <TableCell>
                  <div className="font-semibold">{affiliate.acronym}</div>
                  <div className="text-xs text-muted-foreground">{affiliate.official_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{affiliate.affiliate_id} · {affiliate.sectors.join(', ') || 'No sectors'}</div>
                </TableCell>

                <TableCell>
                  <Badge className={statusStyles[affiliate.status]}>{affiliate.status}</Badge>
                </TableCell>

                <TableCell>
                  <div className="font-medium">
                    {affiliate.declared_membership.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {affiliate.paid_up_membership.toLocaleString()} paid-up · {affiliate.shop_stewards} stewards
                  </div>
                </TableCell>

                <TableCell>
                  <Badge className={financialStyles[affiliate.financial_standing]}>{affiliate.financial_standing}</Badge>
                  <div className="mt-1 text-xs text-muted-foreground">{affiliate.documents.length} documents</div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap justify-end gap-1" onClick={event => event.stopPropagation()}>
                    <Button variant="ghost" size="sm" title="Edit affiliate" onClick={() => { setEditingAffiliate(affiliate); setShowAffiliateModal(true) }}>
                      <FilePenLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Record payment" onClick={() => { setSelectedAffiliate(affiliate); setAffiliateAction('payment') }}><CreditCard className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Documents" onClick={() => { setSelectedAffiliate(affiliate); setAffiliateAction('document') }}><FileText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Link records" onClick={() => { setSelectedAffiliate(affiliate); setAffiliateAction('link') }}><Link2 className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Queue notification" onClick={() => { setSelectedAffiliate(affiliate); setAffiliateAction('notify') }}><Bell className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Generate report" onClick={() => { setSelectedAffiliate(affiliate); setAffiliateAction('report') }}><BarChart3 className="h-4 w-4" /></Button>

                    <select aria-label={`Request status change for ${affiliate.acronym}`}
                      value={affiliate.status}
                      onChange={event => requestStatusChange(affiliate, event.target.value as AffiliateStatus)}
                      className="h-8 rounded-md border border-border bg-background px-1 text-xs">
                      <option>Active</option>
                      <option>Provisional</option>
                      <option>Suspended</option>
                      <option>Expelled</option>
                      <option>Withdrawn</option>
                    </select>
                    <Button variant="ghost" size="sm" title="Generate invoice" onClick={() => invoice(affiliate)}><ReceiptCent className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Good-standing certificate" onClick={() => certificate(affiliate)}><Award className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" title="Archive affiliate" onClick={() => archiveAffiliate(affiliate)} className="text-muted-foreground"><Archive className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-center py-10 text-center text-muted-foreground">
              <Spinner className='h-4 w-4' />&nbsp;Loading...</CardContent>
          </Card>
        ) :
          (!isLoading && pagedAffiliates.length === 0) && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">No affiliate records match these filters.</CardContent>
            </Card>
          )}
      </div>
        :
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Affiliate</TableHead>
                <TableHead>Workplace / job</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedMembers.map(member => {
                const affiliate = affiliates.find(item => item.id === member.affiliate_id);
                return <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.member_id}</TableCell>
                  <TableCell>
                    <div>{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.phone}</div>
                  </TableCell>
                  <TableCell>{affiliate?.acronym || 'Unlinked'}</TableCell>
                  <TableCell>
                    <div>{member.workplace}</div>
                    <div className="text-xs text-muted-foreground">{member.job_category || '—'}</div>
                  </TableCell>
                  <TableCell>
                    <div>{member.tucoswa_status || 'Active'}</div>
                    <div className="text-xs text-muted-foreground">{member.subscription_status || 'Subscription not recorded'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" title="Update worker" onClick={() => setSelectedMember(member)}>
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Membership card" onClick={() => credential(member, 'card')}>
                        <IdCard className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Mark resigned / deceased / transferred"
                        onClick={() => {
                          const next = window.prompt('Enter new status: Active, Resigned, Deceased, or Transferred',
                            member.tucoswa_status || 'Active');
                          if (next && ['Active', 'Resigned', 'Deceased', 'Transferred'].includes(next)) saveMember({ ...member, tucoswa_status: next as Member['tucoswa_status'] })
                        }}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" title="Soft-delete worker record"
                        onClick={() => markMemberDeleted(member.id)}
                        className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              })}
            </TableBody>
          </Table>

          {pagedMembers.length === 0 && <Card>
            <CardContent className="py-10 text-center text-muted-foreground">No worker records match these filters.</CardContent></Card>
          }
        </div>}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Button variant="outline" size="sm"
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
      )}

      <RegisterAffiliateModal open={showAffiliateModal}
        onOpenChange={open => {
          setShowAffiliateModal(open);
          if (!open) setEditingAffiliate(null)
        }}
        initialAffiliate={editingAffiliate}
        onSubmit={handleAffiliateSubmit}
        isLoading={isLoading}
      />

      <AffiliateActionsModal open={Boolean(affiliateAction)}
        action={affiliateAction} affiliate={selectedAffiliate}
        affiliates={affiliates} links={affiliateLinks}
        users={users}
        onOpenChange={open => {
          if (!open) { setAffiliateAction(null); setSelectedAffiliate(null) }
        }}
        onSubmit={handleAffiliateAction}
        onDocumentAction={documentAction}
        onLinkAction={(_, link) => unlinkRecord(link)}
      />

      <MemberRecordModal open={Boolean(selectedMember)}
        member={selectedMember}
        affiliates={affiliates}
        onOpenChange={open => { if (!open) setSelectedMember(null) }}
        onSave={saveMember}
        onTransfer={requestTransfer}
        onCredential={credential}
      />

      <AddMemberModal open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onSubmit={async (member: any) => {
          setIsLoading(true);
          try {
            const created = await createMember(supabase(), { member_id: member.member_id, name: member.name, email: member.email, phone: member.phone, gender: member.gender, date_of_birth: member.dob, workplace: member.workplace, branch_id: member.branch_id || user?.branchId || null, address: member.address, next_of_kin: member.next_of_kin, next_of_kin_phone: member.next_of_kin_phone, tucoswa_status: 'Active', join_date: new Date().toISOString().slice(0, 10) } as any)
            persistMembers([created, ...members]);
            setShowAddMemberModal(false)
          } catch (error) { alert(error instanceof Error ? error.message : 'Unable to add member.') }
          finally { setIsLoading(false) }
        }}
        isLoading={isLoading}
        branchId={user?.branchId || 'branch_main'}
      />

      <BulkImportModal open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSubmit={
          async newMembers => {
            setIsLoading(true);
            try {
              const created = await Promise.all(newMembers.map(member => createMember(supabase(), { member_id: member.member_id ?? (member as any).memberId, name: member.name, email: member.email || '', phone: member.phone || '', gender: member.gender || 'Other', date_of_birth: (member as any).dob ?? null, workplace: member.workplace || '', branch_id: user?.branchId || null, address: member.address || '', next_of_kin: member.next_of_kin || (member as any).nextOfKin || '', next_of_kin_phone: member.next_of_kin_phone || '', tucoswa_status: 'Active' } as any)))
              persistMembers([...created, ...members]);
              setShowBulkImport(false)
            } catch (error) { alert(error instanceof Error ? error.message : 'Unable to import members.') }
            finally { setIsLoading(false) }
          }} isLoading={isLoading} />

      <Dialog open={showApprovals} onOpenChange={setShowApprovals}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approval workflow</DialogTitle>
            <DialogDescription>Status changes and affiliate transfers remain pending until approved.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {statusRequests.length > 0 &&
              <section>
                <h3 className="font-semibold">Affiliate status requests</h3>
                <div className="mt-2 space-y-2">
                  {statusRequests.map(request => <div key={request.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{request.affiliateName}: {request.currentStatus} <ArrowRightLeft className="mx-1 inline h-3 w-3" /> {request.requestedStatus}</p>
                        <p className="text-sm text-muted-foreground">{request.reason} · requested by {request.requestedBy}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decideStatus(request, 'Approved')}>
                          <CheckCircle2 className="mr-1 h-4 w-4" />Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => decideStatus(request, 'Rejected')}>
                          <XCircle className="mr-1 h-4 w-4" />Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </section>}

            {transferRequests.length > 0 && <section>
              <h3 className="font-semibold">Worker transfer requests</h3>
              <div className="mt-2 space-y-2">
                {transferRequests.map(request =>
                  <div key={request.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{request.memberName} · {affiliates.find(item => item.id === request.fromAffiliateId)?.acronym || 'Unlinked'} <ArrowRightLeft className="mx-1 inline h-3 w-3" /> {affiliates.find(item => item.id === request.toAffiliateId)?.acronym || request.toAffiliateId}</p>
                        <p className="text-sm text-muted-foreground">{request.reason} · requested by {request.requestedBy}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decideTransfer(request, 'Approved')}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => decideTransfer(request, 'Rejected')}>Reject</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>}

            {!statusRequests.length && !transferRequests.length && <p className="py-6 text-center text-muted-foreground">No pending approvals.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
