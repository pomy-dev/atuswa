'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, BookOpen, CheckCircle, Clock, Handshake, Heart, Mail, MapPin, Megaphone, MessageCircle, Scale, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import Twitter from '@/public/twitter.png'
import Facebook from '@/public/facebook.png'
import { Member, HelpDeskCase } from '@/lib/types'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { FileCaseModal } from '@/components/modals/file-case-modal'

export default function PublicWebsite() {
  const [statistics, setStatistics] = useState({
    members: 0,
    projects: 0,
    branches: 3,
    cases: 0
  });

  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const aboutSectionRef = useRef<HTMLDivElement>(null)

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)

  // Load data from localStorage ONLY on client after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const members = JSON.parse(localStorage.getItem('members') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const cases = JSON.parse(localStorage.getItem('helpdesk_cases') || '[]');
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const branchesData = JSON.parse(localStorage.getItem('branches') || '[]');

    const ongoing = projects.filter((p: any) => p.status === 'ongoing' || p.status === 'in_progress');

    const published = articles.filter((a: any) => a.published === true);

    setPublishedArticles(published);

    setStatistics({
      members: members.length,
      projects: ongoing.length,
      branches: branchesData.length || 3,
      cases: cases.filter((c: any) => c.status !== 'completed' && c.status !== 'resolved').length
    });
  }, []);

  const handleFileCase = async (caseData: Partial<HelpDeskCase>) => {
    setIsLoading(true)
    try {
      const newCase: HelpDeskCase = {
        id: `case_${Date.now()}`,
        // branchId: user!.branchId,
        title: caseData.title!,
        memberName: caseData.memberName!,
        memberPhone: caseData.memberPhone!,
        memberEmail: caseData.memberEmail!,
        description: caseData.description!,
        status: caseData.status!,
        handlers: caseData.handlers!,
        documents: [],
        notes: [],
        createdBy: caseData.createdBy!,
        createdByName: caseData.createdByName!,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const allCases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
      const updated = [...allCases, newCase]
      localStorage.setItem('helpDeskCases', JSON.stringify(updated))
      setShowFileModal(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafb] text-slate-900">
      <div className="bg-[#173f5f] px-4 py-2 text-center text-xs font-semibold tracking-[0.18em] text-white/90">
        TUCOSWA · TRADE UNION CONGRESS OF SWAZILAND
      </div>

      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e96b3b] text-xl font-black text-white shadow-lg shadow-orange-900/10">T</span>
            <span>
              <span className="block text-lg font-black tracking-tight text-[#173f5f]">TUCOSWA</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">One voice. One movement.</span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#about" className="transition hover:text-[#e96b3b]">Our movement</a>
            <a href="#priorities" className="transition hover:text-[#e96b3b]">Priorities</a>
            <a href="#updates" className="transition hover:text-[#e96b3b]">Updates</a>
            <a href="#contact" className="transition hover:text-[#e96b3b]">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" className="hidden text-[#173f5f] sm:inline-flex" onClick={() => window.location.href = '/login'}>Member login</Button>
            <Button type="button" className="bg-[#e96b3b] text-white shadow-lg shadow-orange-900/15 hover:bg-[#d9582b]" onClick={() => setShowAddMemberModal(true)}>Join the movement</Button>
          </div>
        </div>
      </nav>

      <main id="top">
        <section className="relative isolate overflow-hidden bg-[#173f5f] text-white">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#e96b3b]/30 blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-[#2a9d8f]/20 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-[#f4c95d]" /> A united labour centre for Eswatini
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Work has dignity.<br /><span className="text-[#f4c95d]">Workers have power.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-200 sm:text-xl">TUCOSWA brings workers and unions together to advance social justice, democratic participation, decent work, and a stronger voice for working families across Swaziland.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button size="lg" className="gap-2 bg-[#e96b3b] px-6 text-white hover:bg-[#d9582b]" onClick={() => setShowAddMemberModal(true)}><UsersRound className="h-4 w-4" /> Become a member</Button>
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white" onClick={() => aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>Discover our work <ArrowRight className="h-4 w-4" /></Button>
              </div>
              <div className="mt-12 grid max-w-lg grid-cols-3 gap-5 border-t border-white/15 pt-6">
                <div><div className="text-3xl font-black text-[#f4c95d]">{statistics.members || '—'}</div><div className="mt-1 text-xs uppercase tracking-wider text-slate-300">Members</div></div>
                <div><div className="text-3xl font-black text-[#f4c95d]">{statistics.branches || '3'}</div><div className="mt-1 text-xs uppercase tracking-wider text-slate-300">Regions</div></div>
                <div><div className="text-3xl font-black text-[#f4c95d]">{statistics.projects || '—'}</div><div className="mt-1 text-xs uppercase tracking-wider text-slate-300">Active efforts</div></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] border border-[#f4c95d]/30 rotate-3" />
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-white/10 bg-slate-800 shadow-2xl shadow-black/30 transition duration-700 hover:-translate-y-2 hover:rotate-1">
                <img src="/tucoswa-solidarity.jpg" alt="Workers standing together in solidarity in Eswatini" className="aspect-[4/3] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f2d46] via-[#0f2d46]/70 to-transparent p-6 pt-20">
                  <p className="max-w-sm text-sm font-semibold leading-6 text-white">“In unity we are guaranteed strength.”</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#f4c95d]">The TUCOSWA spirit</p>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-[#f4c95d] px-5 py-4 text-[#173f5f] shadow-xl sm:block">
                <div className="text-2xl font-black">01</div><div className="text-[10px] font-black uppercase tracking-widest">One federation</div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" ref={aboutSectionRef} className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e96b3b]">Our movement</p>
              <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight text-[#173f5f] sm:text-5xl">Built from unity. Focused on justice.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Formed in 2012 through the coming together of major union centres, TUCOSWA exists to strengthen workers’ collective voice and defend the rights of every worker in Swaziland.</p>
              <p className="mt-5 text-base leading-7 text-slate-500">Our work connects workplace organising with the wider pursuit of dignity, equality, democracy, and accountable institutions.</p>
              <Button variant="outline" className="mt-7 gap-2 border-[#173f5f]/20 text-[#173f5f] hover:bg-[#173f5f] hover:text-white" onClick={() => setShowFileModal(true)}>Raise a workplace concern <ArrowRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Handshake, title: 'Unity across unions', copy: 'A shared platform that brings workers together across sectors and regions.' },
                { icon: Scale, title: 'Social justice', copy: 'Advocating for fair treatment, decent work, and the dignity of working families.' },
                { icon: Megaphone, title: 'A stronger voice', copy: 'Turning workers’ lived experience into collective advocacy and public action.' },
                { icon: ShieldCheck, title: 'Rights at work', copy: 'Standing for freedom of association, organising, and safe, fair workplaces.' }
              ].map(({ icon: Icon, title, copy }, index) => (
                <div key={title} className={`group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-500 hover:-translate-y-1 hover:border-[#e96b3b]/40 hover:shadow-xl ${index === 1 ? 'sm:translate-y-8' : ''}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#173f5f]/8 text-[#173f5f] transition group-hover:bg-[#e96b3b] group-hover:text-white"><Icon className="h-5 w-5" /></div>
                  <h3 className="mt-6 text-xl font-black text-[#173f5f]">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-500">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="priorities" className="bg-[#eef3f5] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#e96b3b]">What we stand for</p><h2 className="mt-4 text-4xl font-black tracking-tight text-[#173f5f] sm:text-5xl">A movement that organises, educates, and acts.</h2></div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[{ number: '01', title: 'Organise', copy: 'Build strong, democratic structures where members can participate and lead.' }, { number: '02', title: 'Educate', copy: 'Equip shop stewards and workers with the knowledge to defend rights and shape policy.' }, { number: '03', title: 'Act', copy: 'Advocate for reforms that protect freedom of association, equality, and decent work.' }].map(item => (
                <div key={item.number} className="relative overflow-hidden rounded-3xl bg-[#173f5f] p-8 text-white shadow-xl transition duration-500 hover:-translate-y-2">
                  <span className="absolute -right-3 -top-8 text-[9rem] font-black leading-none text-white/5">{item.number}</span><div className="relative"><span className="text-sm font-black text-[#f4c95d]">{item.number}</span><h3 className="mt-10 text-3xl font-black">{item.title}</h3><p className="mt-4 leading-7 text-slate-300">{item.copy}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid gap-6 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-8">
              <img src="/eswatini-workers.jpg" alt="Workers in a textile workplace in Eswatini" className="h-full min-h-64 w-full rounded-2xl object-cover" />
              <div className="flex flex-col justify-center p-2 md:p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#e96b3b]">Democracy is workplace work</p><h3 className="mt-4 text-3xl font-black leading-tight text-[#173f5f]">Accountability grows when workers have a seat at the table.</h3><p className="mt-5 leading-7 text-slate-600">TUCOSWA’s organising and education work is designed to bring decision-making closer to members — strengthening local shop stewards councils, participation, gender equality, and accountable union structures.</p><div className="mt-7 flex items-center gap-3 text-sm font-bold text-[#173f5f]"><BookOpen className="h-5 w-5 text-[#e96b3b]" /> Education, participation, action</div></div>
            </div>
          </div>
        </section>

        <section id="updates" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#e96b3b]">Stay connected</p><h2 className="mt-4 text-4xl font-black tracking-tight text-[#173f5f]">From the movement</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Follow union news, events, and member-led action from across Eswatini.</p></div>
          {publishedArticles.length > 0 ? <div className="mt-10 grid gap-6 md:grid-cols-3">{publishedArticles.slice(0, 3).map(article => <ArticleCard key={article.id} article={article} onReadMore={setSelectedArticle} />)}</div> : <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Sparkles className="mx-auto h-7 w-7 text-[#e96b3b]" /><h3 className="mt-4 text-xl font-black text-[#173f5f]">News and resources are on the way</h3><p className="mx-auto mt-2 max-w-md text-slate-500">This space will carry the latest updates, statements, and resources from the movement.</p></div>}
        </section>

        <section id="contact" className="bg-[#e96b3b] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-white/75">Your voice matters</p><h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">Stand with workers. Strengthen the movement.</h2></div><div className="flex flex-wrap gap-3"><Button size="lg" className="bg-[#173f5f] px-6 text-white hover:bg-[#0e2c43]" onClick={() => setShowAddMemberModal(true)}>Join TUCOSWA <ArrowRight className="ml-2 h-4 w-4" /></Button><Button size="lg" variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white hover:text-[#e96b3b]" onClick={() => setShowFileModal(true)}>File a grievance</Button></div></div>
        </section>
      </main>

      {/* add member modal */}
      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onSubmit={(member) => {
          setIsLoading(true)
          try {
            const allMembers = JSON.parse(localStorage.getItem('members') || '[]')
            const newMember: Member = {
              ...member,
              id: `member_${Date.now()}`,
              joinDate: new Date()
            }
            const updated = [...allMembers, newMember]
            localStorage.setItem('members', JSON.stringify(updated))
            setShowAddMemberModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />

      {/* File Case Modal */}
      <FileCaseModal
        open={showFileModal}
        onOpenChange={setShowFileModal}
        onSubmit={handleFileCase}
        isLoading={isLoading}
      />

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p className="font-semibold text-[#173f5f]">TUCOSWA · Trade Union Congress of Eswatini</p>
          <p className="mt-2 text-xs">A public-facing concept informed by reporting from ITUC, ITUC-Africa, and TUC Aid. Imagery: ITUC-Africa and United Nations Eswatini.</p>
        </div>
      </footer>
    </div>
  )

  // ========================= Full Article Modals ========================= //
  function ArticleModal({ article, onClose }: { article: any; onClose: () => void }) {
    if (!article) return null;

    return (
      <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-background max-w-4xl w-full rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b flex items-start justify-between sticky top-0 bg-background z-10">
            <div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                  {article.category}
                </span>
                <span>{new Date(article.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
                {article.createdBy && <span>By {article.createdBy}</span>}
              </div>
              <h1 className="text-3xl font-bold leading-tight">{article.title}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
              ✕
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            {/* Featured Image */}
            {article.featuredImage && (
              <div className="space-y-3 -mx-2">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full rounded-xl max-h-[500px] object-stretch"
                />
                {article.featuredImageCaption && (
                  <p className="text-center text-sm text-muted-foreground italic px-2">
                    {article.featuredImageCaption}
                  </p>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className="prose dark:prose-invert max-w-none text-foreground leading-relaxed">
              {article.content.split('\n\n').map((paragraph: string, idx: number) => (
                <p key={idx} className="mb-4">{paragraph}</p>
              ))}
            </div>

            {/* Attached Files */}
            {article.attachedFiles && article.attachedFiles.length > 0 && (
              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  📎 Attached Files ({article.attachedFiles.length})
                </h4>
                <div className="grid gap-3">
                  {article.attachedFiles.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      download={file.name}
                      className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 group transition"
                    >
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate group-hover:text-primary">{file.name}</p>
                        {file.caption && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{file.caption}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-muted/30 text-center text-sm text-muted-foreground">
            TUCOSWA • Empowering Workers
          </div>
        </div>
      </div>
    );
  }

  function FeaturedArticle({ article, onReadMore }: { article: any; onReadMore: (a: any) => void }) {
    return (
      <Card className="overflow-hidden group cursor-pointer" onClick={() => onReadMore(article)}>
        <div className="md:flex">
          {article.featuredImage && (
            <div className="md:w-5/12 relative">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover aspect-video md:aspect-auto"
              />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 text-xs font-medium bg-black/70 text-white rounded-full">
                  {article.category}
                </span>
              </div>
            </div>
          )}
          <div className="p-8 md:w-7/12 flex flex-col">
            <div className="text-sm text-muted-foreground mb-3">
              {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4 group-hover:text-primary transition">
              {article.title}
            </h2>

            <p className="text-muted-foreground line-clamp-4 mb-auto">
              {article.content}
            </p>

            <Button className="mt-6 w-fit" variant="default">
              Read Full Article →
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  function ArticleCard({ article, onReadMore }: { article: any; onReadMore: (a: any) => void }) {
    return (
      <Card
        className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
        onClick={() => onReadMore(article)}
      >
        {article.featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3">
              <span className="text-xs px-2.5 py-1 bg-black/70 text-white rounded-full">
                {article.category}
              </span>
            </div>
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          <p className="text-xs text-muted-foreground mb-2">
            {new Date(article.createdAt).toLocaleDateString()}
          </p>

          <h3 className="font-semibold text-lg leading-tight mb-3 line-clamp-3 group-hover:text-primary transition">
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
            {article.content}
          </p>
        </div>
      </Card>
    );
  }

  // =============================== Event Modals ========================== //
  // Featured Event
  function FeaturedEvent({ event, onReadMore }: { event: any; onReadMore: (e: any) => void }) {
    return (
      <Card className="overflow-hidden group cursor-pointer" onClick={() => onReadMore(event)}>
        <div className="md:flex">
          {event.images && (
            <div className="md:w-3/10 relative">
              <img
                src={event.images[0]?.url}
                alt={event.title}
                className="w-full object-stretch aspect-video md:aspect-auto"
              />
            </div>
          )}
          <div className="p-8 md:w-5/10 flex flex-col">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </div>
              <div>{event.location}</div>
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4 group-hover:text-primary transition">
              {event.title}
            </h2>

            <p className="text-muted-foreground line-clamp-4 mb-auto">
              {event.notes || event.description || "Join us for this important event."}
            </p>

            <Button className="mt-6 w-fit">View Full Details →</Button>
          </div>
        </div>
      </Card>
    );
  }

  // Event Card
  function EventCard({ event, onReadMore }: { event: any; onReadMore: (e: any) => void }) {
    return (
      <Card
        className="overflow-hidden group hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
        onClick={() => onReadMore(event)}
      >
        {event.featuredImage && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.featuredImage}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          <h3 className="font-semibold text-lg leading-tight mb-3 line-clamp-3 group-hover:text-primary transition">
            {event.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
            {event.notes || event.description}
          </p>

          {event.location && (
            <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
              📍 {event.location}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // Full Event Modal
  function EventModal({ event, onClose }: { event: any; onClose: () => void }) {
    if (!event) return null;

    return (
      <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
        <div className="bg-background max-w-3xl w-full rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b sticky top-0 bg-background z-10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 text-sm mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                  Event
                </span>
                <span>{new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}</span>
              </div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
          </div>

          <div className="overflow-y-auto p-6 space-y-8">
            {/* Image */}
            {event.featuredImage && (
              <div className="space-y-3">
                <img
                  src={event.featuredImage}
                  alt={event.title}
                  className="w-full rounded-xl max-h-[420px] object-cover"
                />
                {event.imageCaption && (
                  <p className="text-center text-sm text-muted-foreground italic">
                    {event.imageCaption}
                  </p>
                )}
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">📍 Location</p>
                <p className="font-medium">{event.location || 'TBA'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">🕒 Date & Time</p>
                <p className="font-medium">{new Date(event.date).toLocaleString()}</p>
              </div>
            </div>

            {/* Description / Notes */}
            <div className="prose dark:prose-invert">
              <h4 className="font-semibold text-lg mb-3">About This Event</h4>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                {event.notes || event.description || "No additional details provided."}
              </p>
            </div>

            {/* Attached Files */}
            {event.attachedFiles && event.attachedFiles.length > 0 && (
              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-4">📎 Supporting Documents</h4>
                <div className="space-y-3">
                  {event.attachedFiles.map((file: any, idx: number) => (
                    <a
                      key={idx}
                      href={file.url}
                      download={file.name}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">📄</div>
                        <div>
                          <p className="font-medium group-hover:text-primary">{file.name}</p>
                          {file.caption && <p className="text-sm text-muted-foreground">{file.caption}</p>}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Download</Button>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Buttons */}
          <div className="p-6 border-t bg-muted/30">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                  window.open(`mailto:?subject=${event.title}&body=${text}`, '_blank')
                }}
                title="Share via Email"
              >
                <Mail className="w-3 h-3" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
                }}
                title="Share via WhatsApp"
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodeURIComponent(text)}`, '_blank')
                }}
                title="Share on Facebook"
              >
                <img src={Facebook.src} alt='F' className="w-3 h-3" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `Join us for ${event.title} on ${new Date(event.date).toLocaleString()} at ${event.location}`
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
                }}
                title="Share on Twitter"
              >
                <img src={Twitter.src} alt='X' className="w-3 h-3" />
                Twitter
              </Button>
            </div>
            {event.stakeholders && event.stakeholders.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <strong>{event.stakeholders.length}</strong> people invited
              </p>
            )}
          </div >
        </div >
      </div >
    );
  }
}
