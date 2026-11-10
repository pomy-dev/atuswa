'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight,
  CircleDollarSign, Clock3, FileText, FolderKanban, Headphones, MapPin,
  ShieldCheck, Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Illustrative portal content. Replace with affiliate-scoped Supabase queries
// once affiliate accounts are linked to an affiliate record.
const affiliate = {
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

const membership = { declared: 4820, paid: 4315, women: 2910, men: 1840, other: 70, stewards: 84 }
const dues = [
  { month: 'Aug', amount: 108750 }, { month: 'Sep', amount: 108750 },
  { month: 'Oct', amount: 108750 }, { month: 'Nov', amount: 108750 },
]
const events = [
  { date: '18 Nov', title: 'Affiliate Secretaries Forum', place: 'TUCOSWA House, Mbabane', kind: 'Meeting' },
  { date: '02 Dec', title: 'Annual Labour Conference', place: 'Ezulwini Convention Centre', kind: 'Conference' },
  { date: '10 Dec', title: 'Membership Data Clinic', place: 'Online', kind: 'Workshop' },
]
const projects = [
  { title: 'Teachers’ Workplace Rights Programme', status: 'In progress', progress: 68, lead: 'SNAT + TUCOSWA' },
  { title: 'Young Workers Leadership Network', status: 'Planning', progress: 22, lead: 'SNAT' },
]
const documents = [
  { name: 'SNAT Constitution', type: 'Constitution', date: '12 Sep 2026' },
  { name: '2026 Membership Return', type: 'Membership', date: '28 Oct 2026' },
  { name: 'Audited Financial Statements', type: 'Financial', date: '14 Aug 2026' },
]
const cases = [
  { id: 'HD-2026-0148', title: 'Collective bargaining support', status: 'In progress', updated: '5 Nov' },
  { id: 'HD-2026-0122', title: 'Workplace safety referral', status: 'Awaiting update', updated: '29 Oct' },
]

const money = (amount: number) => `E${amount.toLocaleString('en-SZ')}`

export default function AffiliateDashboardPage() {
  const [section, setSection] = useState('Overview')
  const sections = ['Overview', 'Membership', 'Dues & finance', 'Programmes', 'Documents', 'Support']
  const maxDues = Math.max(...dues.map(item => item.amount))

  return (
    <div className="min-h-full bg-muted/20 p-4 md:p-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-sm">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div>
              <div className="mb-4 flex items-center gap-2 text-sm text-emerald-100"><ShieldCheck className="h-4 w-4" /> Affiliate workspace <span className="text-white/40">·</span> {affiliate.affiliateCode}</div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl">{affiliate.name}</h1>
              <p className="mt-2 text-sm text-white/70">Your membership, affiliation, programmes and support in one place.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="border-emerald-300/30 bg-emerald-300/15 text-emerald-100 hover:bg-emerald-300/15"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />{affiliate.status}</Badge>
                <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">{affiliate.standing}</Badge>
              </div>
            </div>
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-white/15 bg-white/[0.06] p-4 md:min-w-64">
              <div><p className="text-xs uppercase tracking-wide text-white/55">Affiliation contact</p><p className="mt-2 font-medium">{affiliate.contact}</p><p className="mt-1 text-sm text-white/65">{affiliate.email}</p><p className="text-sm text-white/65">{affiliate.phone}</p></div>
              <p className="flex items-center gap-1.5 text-xs text-white/55"><MapPin className="h-3.5 w-3.5" />{affiliate.address}</p>
            </div>
          </div>
        </section>

        <nav className="flex gap-1 overflow-x-auto border-b" aria-label="Affiliate dashboard sections">
          {sections.map(item => <button key={item} onClick={() => setSection(item)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition ${section === item ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{item}</button>)}
        </nav>

        {section === 'Overview' && <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Users} label="Declared members" value={membership.declared.toLocaleString()} helper={`${membership.paid.toLocaleString()} paid-up`} detail="89% paid-up" />
            <Metric icon={CircleDollarSign} label="Dues recorded · 2026" value={money(1_087_500)} helper="Last payment: 4 Nov 2026" detail="Up to date" />
            <Metric icon={FolderKanban} label="Active programmes" value="2" helper="1 in progress · 1 planning" detail="View programmes" />
            <Metric icon={Headphones} label="Open support cases" value="2" helper="Most recent update: 5 Nov" detail="View support" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2"><div><CardTitle className="text-base">Membership snapshot</CardTitle><p className="mt-1 text-sm text-muted-foreground">A quick view of your latest affiliate return</p></div><Button variant="outline" size="sm" onClick={() => setSection('Membership')}>View details <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader>
              <CardContent className="space-y-5 pt-3">
                <div><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">Paid-up membership</span><span className="font-medium">{membership.paid.toLocaleString()} / {membership.declared.toLocaleString()}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round(membership.paid / membership.declared * 100)}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">505 members still need to be included in the paid-up return.</p></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><MiniStat label="Women" value={membership.women.toLocaleString()} /><MiniStat label="Men" value={membership.men.toLocaleString()} /><MiniStat label="Other" value={membership.other.toLocaleString()} /><MiniStat label="Shop stewards" value={membership.stewards.toString()} /></div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-2"><CardTitle className="text-base">Recent dues</CardTitle><p className="text-sm text-muted-foreground">Monthly affiliate subscription</p></CardHeader>
              <CardContent><div className="flex h-28 items-end justify-between gap-3 px-1">{dues.map(item => <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full max-w-12 rounded-t-md bg-emerald-600/80" style={{ height: `${Math.max(15, item.amount / maxDues * 72)}%` }} /><span className="text-xs text-muted-foreground">{item.month}</span></div>)}</div><div className="mt-4 flex items-center justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Latest payment</span><span className="font-medium">{money(108750)} · 4 Nov</span></div></CardContent>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><div><CardTitle className="text-base">Upcoming events</CardTitle><p className="mt-1 text-sm text-muted-foreground">Dates and activities for your affiliate</p></div><Button variant="ghost" size="sm" onClick={() => setSection('Programmes')}>See all <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader><CardContent className="divide-y">{events.slice(0, 2).map(event => <div key={event.title} className="flex gap-4 py-3"><div className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><CalendarDays className="mb-0.5 h-4 w-4" /><span className="text-[10px] font-semibold">{event.date}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{event.title}</p><Badge variant="secondary" className="text-[10px]">{event.kind}</Badge></div><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{event.place}</p></div></div>)}</CardContent></Card>
            <Card className="rounded-2xl"><CardHeader className="flex flex-row items-center justify-between pb-2"><div><CardTitle className="text-base">Recent documents</CardTitle><p className="mt-1 text-sm text-muted-foreground">Shared with your affiliate</p></div><Button variant="ghost" size="sm" onClick={() => setSection('Documents')}>Browse <ChevronRight className="ml-1 h-4 w-4" /></Button></CardHeader><CardContent className="divide-y">{documents.slice(0, 2).map(doc => <div key={doc.name} className="flex items-center gap-3 py-3"><div className="rounded-lg bg-muted p-2"><FileText className="h-4 w-4 text-muted-foreground" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{doc.name}</p><p className="mt-1 text-xs text-muted-foreground">{doc.type} · Added {doc.date}</p></div><Button variant="ghost" size="icon" aria-label={`Open ${doc.name}`}><ChevronRight className="h-4 w-4" /></Button></div>)}</CardContent></Card>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm"><p className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4" />Affiliate record last updated {affiliate.updated}</p><Button variant="outline" size="sm" onClick={() => setSection('Support')}>Contact TUCOSWA <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
        </>}

        {section === 'Membership' && <Panel title="Membership & leadership" intro="Your current affiliate return and registered contacts."><div className="grid gap-4 sm:grid-cols-3"><MiniStat label="Declared members" value="4,820" /><MiniStat label="Paid-up members" value="4,315" /><MiniStat label="Executive committee" value="11 members" /></div><div className="grid gap-3 md:grid-cols-2"><Info label="Women / Men / Other" value="2,910 / 1,840 / 70" /><Info label="Shop stewards" value="84" /><Info label="Regions represented" value="Hhohho, Manzini, Lubombo, Shiselweni" /><Info label="Sectors" value="Education, public service" /><Info label="Last congress" value="12 September 2025" /><Info label="Constitution version" value="2023 revision" /></div><p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">This sample dashboard uses illustrative figures. Connect the portal to the affiliate record to show verified returns.</p></Panel>}
        {section === 'Dues & finance' && <Panel title="Dues & financial standing" intro="Subscription payments recorded against your affiliation."><div className="grid gap-4 sm:grid-cols-3"><MiniStat label="2026 payments" value="E1,087,500" /><MiniStat label="Monthly rate" value="E25 / member" /><MiniStat label="Standing" value="Good standing" /></div><div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Reference</th><th className="p-3 font-medium">Amount</th><th className="p-3 font-medium">Status</th></tr></thead><tbody className="divide-y">{['4 Nov 2026','3 Oct 2026','5 Sep 2026','6 Aug 2026'].map((date,i)=><tr key={date}><td className="p-3">{date}</td><td className="p-3">TUC-SNAT-26-{String(104-i).padStart(3,'0')}</td><td className="p-3">E108,750</td><td className="p-3"><Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Received</Badge></td></tr>)}</tbody></table></div></Panel>}
        {section === 'Programmes' && <Panel title="Programmes & events" intro="Work involving your affiliate and upcoming opportunities."><div className="grid gap-4 lg:grid-cols-2">{projects.map(project=><div key={project.title} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{project.title}</p><p className="mt-1 text-xs text-muted-foreground">{project.lead}</p></div><Badge variant={project.status==='In progress'?'default':'secondary'}>{project.status}</Badge></div><div className="mt-4 h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${project.progress}%`}} /></div><p className="mt-2 text-right text-xs text-muted-foreground">{project.progress}% complete</p></div>)}</div><div className="mt-5 divide-y rounded-xl border">{events.map(event=><div key={event.title} className="flex items-center gap-3 p-4"><CalendarDays className="h-5 w-5 text-primary"/><div className="flex-1"><p className="text-sm font-medium">{event.title}</p><p className="mt-1 text-xs text-muted-foreground">{event.date} · {event.place}</p></div><Badge variant="outline">{event.kind}</Badge></div>)}</div></Panel>}
        {section === 'Documents' && <Panel title="Affiliate documents" intro="Constitutions, returns and records shared with your organisation."><div className="divide-y rounded-xl border">{documents.map(doc=><div key={doc.name} className="flex items-center gap-3 p-4"><FileText className="h-5 w-5 text-primary"/><div className="flex-1"><p className="text-sm font-medium">{doc.name}</p><p className="mt-1 text-xs text-muted-foreground">{doc.type} · Added {doc.date}</p></div><Button variant="outline" size="sm">View</Button></div>)}</div></Panel>}
        {section === 'Support' && <Panel title="Support cases" intro="Follow requests submitted by your affiliate to TUCOSWA."><div className="divide-y rounded-xl border">{cases.map(item=><div key={item.id} className="flex flex-wrap items-center gap-3 p-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{item.title}</p><Badge variant={item.status==='In progress'?'default':'secondary'}>{item.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.id} · Updated {item.updated}</p></div><Button variant="outline" size="sm">View case</Button></div>)}</div><div className="mt-4 rounded-xl bg-muted/60 p-4"><p className="text-sm font-medium">Need assistance?</p><p className="mt-1 text-sm text-muted-foreground">Reach the TUCOSWA helpdesk at helpdesk@tucoswa.org.sz or +268 2404 6810.</p><Button className="mt-3" size="sm"><Link href="/helpdesk">Open helpdesk</Link></Button></div></Panel>}
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, helper, detail }: { icon: typeof Users; label: string; value: string; helper: string; detail: string }) {
  const positive = detail === 'Up to date'
  return <Card className="rounded-2xl"><CardContent className="p-5"><div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{helper}</p><p className={`mt-3 flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-700' : 'text-muted-foreground'}`}>{positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{detail}</p></CardContent></Card>
}
function MiniStat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div> }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div> }
function Panel({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <Card className="rounded-2xl"><CardHeader><CardTitle>{title}</CardTitle><p className="text-sm text-muted-foreground">{intro}</p></CardHeader><CardContent className="space-y-5">{children}</CardContent></Card> }
