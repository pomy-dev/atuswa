'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Affiliate, AffiliateStatus, FinancialStanding } from '@/lib/types'

export type AffiliateDraft = Omit<Affiliate, 'id' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'documents' | 'active'> & { documentNames?: string }

interface RegisterAffiliateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (affiliate: AffiliateDraft) => void
  initialAffiliate?: Affiliate | null
  isLoading?: boolean
}

type FormData = {
  affiliateId: string; officialName: string; acronym: string; registrationNumber: string; affiliationDate: string; foundingDate: string
  physicalAddress: string; postalAddress: string; phoneNumbers: string; email: string; website: string; socialMedia: string
  correspondenceName: string; correspondenceEmail: string; correspondencePhone: string
  presidentName: string; secretaryName: string; treasurerName: string; lastCongressDate: string; constitutionVersion: string; executiveCommitteeSize: string
  declaredMembership: string; paidUpMembership: string; femaleMembers: string; maleMembers: string; otherMembers: string; ageGroups: string; sectors: string; regions: string; shopStewards: string
  duesRate: string; paymentHistory: string; financialStanding: FinancialStanding; bankDetails: string; status: AffiliateStatus; notes: string; documentNames: string
}

const emptyForm: FormData = {
  affiliateId: '', officialName: '', acronym: '', registrationNumber: '', affiliationDate: new Date().toISOString().split('T')[0], foundingDate: '', physicalAddress: '', postalAddress: '', phoneNumbers: '', email: '', website: '', socialMedia: '',
  correspondenceName: '', correspondenceEmail: '', correspondencePhone: '', presidentName: '', secretaryName: '', treasurerName: '', lastCongressDate: '', constitutionVersion: '', executiveCommitteeSize: '0',
  declaredMembership: '0', paidUpMembership: '0', femaleMembers: '0', maleMembers: '0', otherMembers: '0', ageGroups: '', sectors: '', regions: '', shopStewards: '0', duesRate: '', paymentHistory: '', financialStanding: 'Good standing', bankDetails: '', status: 'Provisional', notes: '', documentNames: ''
}

function toForm(affiliate?: Affiliate | null): FormData {
  if (!affiliate) return emptyForm
  const leader = (position: string) => affiliate.leadership.find(item => item.position === position)?.name || ''
  return {
    affiliateId: affiliate.affiliateId, officialName: affiliate.officialName, acronym: affiliate.acronym, registrationNumber: affiliate.registrationNumber || '', affiliationDate: affiliate.affiliationDate, foundingDate: affiliate.foundingDate || '', physicalAddress: affiliate.physicalAddress, postalAddress: affiliate.postalAddress || '', phoneNumbers: affiliate.phoneNumbers.join(', '), email: affiliate.email || '', website: affiliate.website || '', socialMedia: affiliate.socialMedia || '', correspondenceName: affiliate.correspondenceContact.name, correspondenceEmail: affiliate.correspondenceContact.email || '', correspondencePhone: affiliate.correspondenceContact.phone || '', presidentName: leader('President'), secretaryName: leader('Secretary General'), treasurerName: leader('Treasurer'), lastCongressDate: affiliate.lastCongressDate || '', constitutionVersion: affiliate.constitutionVersion || '', executiveCommitteeSize: String(affiliate.executiveCommitteeSize), declaredMembership: String(affiliate.declaredMembership), paidUpMembership: String(affiliate.paidUpMembership), femaleMembers: String(affiliate.genderBreakdown.female), maleMembers: String(affiliate.genderBreakdown.male), otherMembers: String(affiliate.genderBreakdown.other), ageGroups: affiliate.ageGroups, sectors: affiliate.sectors.join(', '), regions: affiliate.regions.join(', '), shopStewards: String(affiliate.shopStewards), duesRate: affiliate.duesRate || '', paymentHistory: affiliate.paymentHistory || '', financialStanding: affiliate.financialStanding, bankDetails: affiliate.bankDetails || '', status: affiliate.status, notes: affiliate.notes || '', documentNames: affiliate.documents.map(document => document.name).join(', ')
  }
}

const splitList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)
const numberValue = (value: string) => Number.parseInt(value, 10) || 0

export function RegisterAffiliateModal({ open, onOpenChange, onSubmit, initialAffiliate, isLoading }: RegisterAffiliateModalProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm)

  useEffect(() => {
    if (open) setFormData(toForm(initialAffiliate))
  }, [open, initialAffiliate])

  const update = (key: keyof FormData, value: string) => setFormData(previous => ({ ...previous, [key]: value }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.officialName.trim() || !formData.acronym.trim() || !formData.physicalAddress.trim() || !formData.correspondenceName.trim()) {
      alert('Please complete the official name, acronym, physical address, and correspondence contact.')
      return
    }

    const leadership = [
      { position: 'President', name: formData.presidentName },
      { position: 'Secretary General', name: formData.secretaryName },
      { position: 'Treasurer', name: formData.treasurerName }
    ].filter(item => item.name.trim())

    onSubmit({
      affiliateId: formData.affiliateId.trim() || `TUC-AFF-${Date.now().toString().slice(-4)}`,
      officialName: formData.officialName.trim(), acronym: formData.acronym.trim().toUpperCase(), registrationNumber: formData.registrationNumber.trim(), affiliationDate: formData.affiliationDate, foundingDate: formData.foundingDate, physicalAddress: formData.physicalAddress.trim(), postalAddress: formData.postalAddress.trim(), phoneNumbers: splitList(formData.phoneNumbers), email: formData.email.trim(), website: formData.website.trim(), socialMedia: formData.socialMedia.trim(), correspondenceContact: { name: formData.correspondenceName.trim(), email: formData.correspondenceEmail.trim(), phone: formData.correspondencePhone.trim() }, leadership, lastCongressDate: formData.lastCongressDate, constitutionVersion: formData.constitutionVersion.trim(), executiveCommitteeSize: numberValue(formData.executiveCommitteeSize), declaredMembership: numberValue(formData.declaredMembership), paidUpMembership: numberValue(formData.paidUpMembership), genderBreakdown: { female: numberValue(formData.femaleMembers), male: numberValue(formData.maleMembers), other: numberValue(formData.otherMembers) }, ageGroups: formData.ageGroups.trim(), sectors: splitList(formData.sectors), regions: splitList(formData.regions), shopStewards: numberValue(formData.shopStewards), duesRate: formData.duesRate.trim(), paymentHistory: formData.paymentHistory.trim(), financialStanding: formData.financialStanding, bankDetails: formData.bankDetails.trim(), status: formData.status, notes: formData.notes.trim(), documentNames: formData.documentNames.trim()
    })
    onOpenChange(false)
  }

  const field = (key: keyof FormData, label: string, props: ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5"><Label htmlFor={key}>{label}</Label><Input id={key} value={formData[key] as string} onChange={event => update(key, event.target.value)} {...props} /></div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{initialAffiliate ? 'Update affiliate record' : 'Register affiliate union'}</DialogTitle><DialogDescription>Capture the affiliate’s identity, governance, membership, financial standing, and supporting records.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-7">
          <section className="space-y-4"><div><h3 className="font-semibold text-foreground">Identification</h3><p className="text-sm text-muted-foreground">The master record for a TUCOSWA affiliate.</p></div><div className="grid gap-4 md:grid-cols-3">{field('affiliateId', 'Unique affiliate ID', { placeholder: 'Generated if blank' })}{field('officialName', 'Official name *', { required: true, className: 'md:col-span-2' })}{field('acronym', 'Acronym *', { required: true })}{field('registrationNumber', 'Registration / incorporation number')}{field('affiliationDate', 'Date affiliated', { type: 'date' })}{field('foundingDate', 'Date founded / legally registered', { type: 'date' })}</div></section>
          <section className="space-y-4"><h3 className="font-semibold text-foreground">Contact & administration</h3><div className="grid gap-4 md:grid-cols-2">{field('physicalAddress', 'Physical address *', { required: true })}{field('postalAddress', 'Postal address')}{field('phoneNumbers', 'Phone numbers', { placeholder: '+268 2404 0000, +268 7600 0000' })}{field('email', 'General email', { type: 'email' })}{field('website', 'Website')}{field('socialMedia', 'Social media handles')}</div><div className="rounded-xl border border-border bg-muted/30 p-4"><p className="mb-3 text-sm font-semibold">Official correspondence contact</p><div className="grid gap-4 md:grid-cols-3">{field('correspondenceName', 'Name *', { required: true })}{field('correspondenceEmail', 'Email', { type: 'email' })}{field('correspondencePhone', 'Phone', { type: 'tel' })}</div></div></section>
          <section className="space-y-4"><h3 className="font-semibold text-foreground">Leadership & governance</h3><div className="grid gap-4 md:grid-cols-3">{field('presidentName', 'President')}{field('secretaryName', 'Secretary General')}{field('treasurerName', 'Treasurer')}{field('lastCongressDate', 'Last congress / AGM', { type: 'date' })}{field('constitutionVersion', 'Constitution / rules version')}{field('executiveCommitteeSize', 'National executive members', { type: 'number', min: 0 })}</div></section>
          <section className="space-y-4"><h3 className="font-semibold text-foreground">Membership & sectors</h3><div className="grid gap-4 md:grid-cols-4">{field('declaredMembership', 'Declared membership', { type: 'number', min: 0 })}{field('paidUpMembership', 'Paid-up membership', { type: 'number', min: 0 })}{field('femaleMembers', 'Women members', { type: 'number', min: 0 })}{field('maleMembers', 'Men members', { type: 'number', min: 0 })}{field('otherMembers', 'Other / undisclosed', { type: 'number', min: 0 })}{field('shopStewards', 'Shop stewards', { type: 'number', min: 0 })}{field('ageGroups', 'Age-group breakdown', { placeholder: '18–30: 100; 31–50: 250; 51+: 50', className: 'md:col-span-2' })}{field('sectors', 'Sectors covered', { placeholder: 'Education, manufacturing, public service', className: 'md:col-span-2' })}{field('regions', 'Regions / branches', { placeholder: 'Hhohho, Manzini, Lubombo, Shiselweni', className: 'md:col-span-2' })}</div></section>
          <section className="space-y-4"><h3 className="font-semibold text-foreground">Financial & compliance</h3><div className="grid gap-4 md:grid-cols-2">{field('duesRate', 'Subscription / dues rate')}{field('paymentHistory', 'Payment history', { placeholder: 'Current through September 2026' })}{field('bankDetails', 'Bank details / payment reference')}{field('documentNames', 'Document register', { placeholder: 'Constitution.pdf, registration certificate.pdf' })}</div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="financialStanding">Financial standing</Label><select id="financialStanding" value={formData.financialStanding} onChange={event => update('financialStanding', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Good standing</option><option>Arrears</option><option>Suspended</option></select></div><div className="space-y-1.5"><Label htmlFor="status">Affiliation status</Label><select id="status" value={formData.status} onChange={event => update('status', event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Provisional</option><option>Active</option><option>Suspended</option><option>Expelled</option><option>Withdrawn</option></select></div></div></section>
          <section className="space-y-2"><Label htmlFor="notes">Restricted internal notes</Label><Textarea id="notes" value={formData.notes} onChange={event => update('notes', event.target.value)} placeholder="Compliance notes, follow-ups, or internal comments" /></section>
          <div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={isLoading}>{isLoading && <Spinner className="mr-2 h-4 w-4" />}{initialAffiliate ? 'Save affiliate' : 'Register affiliate'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
