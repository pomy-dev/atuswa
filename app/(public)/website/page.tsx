'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Heart, CheckCircle, Clock, AlertCircle, Mail, MessageCircle } from 'lucide-react'
import Twitter from '@/public/twitter.png'
import Facebook from '@/public/facebook.png'
import { Member, HelpDeskCase } from '@/lib/types'
import Logo from '@/public/atuswa-logo.png'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { FileCaseModal } from '@/components/modals/file-case-modal'

export default function PublicWebsite() {
  const [activeTab, setActiveTab] = useState('home')
  const [statistics, setStatistics] = useState({
    members: 0,
    projects: 0,
    branches: 3,
    cases: 0
  });

  const [ongoingProjects, setOngoingProjects] = useState<any[]>([]);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const [eventFilterBranch, setEventFilterBranch] = useState<string | null>('all')
  const aboutSectionRef = useRef<HTMLDivElement>(null)

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Load data from localStorage ONLY on client after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setMounted(true);

    const members = JSON.parse(localStorage.getItem('members') || '[]');
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const cases = JSON.parse(localStorage.getItem('helpdesk_cases') || '[]');
    const articles = JSON.parse(localStorage.getItem('articles') || '[]');
    const events = JSON.parse(localStorage.getItem('events') || '[]');
    const branchesData = JSON.parse(localStorage.getItem('branches') || '[]');

    const ongoing = projects.filter((p: any) => p.status === 'ongoing' || p.status === 'in_progress');

    const published = articles.filter((a: any) => a.published === true);

    setOngoingProjects(ongoing);
    setPublishedArticles(published);
    setAllEvents(events);
    setBranches(branchesData);

    setStatistics({
      members: members.length,
      projects: ongoing.length,
      branches: branchesData.length || 3,
      cases: cases.filter((c: any) => c.status !== 'completed' && c.status !== 'resolved').length
    });
  }, []);

  const filteredEvents = allEvents
    .filter(event =>
      eventFilterBranch === 'all' || event.branchId === eventFilterBranch
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Upcoming first

  // console.log(filteredEvents[0])

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

  const tabs = ['home', 'events', 'articles', 'projects']

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header/Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center text-2xl font-bold text-primary gap-4">
              <img src={Logo.src} alt="atuswa" className='h-10 w-10 object-fit-stretch border-radius-10' />
              Atuswá Union
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap transition ${activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <Button type='button' onClick={() => window.location.href = '/login'}>Login</Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl p-12 text-center">
              <h1 className="text-5xl font-bold mb-4">Atuswá Union</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Empowering workers through solidarity, advocacy, and collective action for better working conditions and social justice.
              </p>
              <div className="flex gap-4 justify-center">
                <Button type='button' onClick={() => setShowAddMemberModal(true)} size="lg" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Join Us
                </Button>
                <Button size="lg" variant="outline" onClick={() => aboutSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}>Learn More</Button>

                <button onClick={() => setShowFileModal(true)} className='bg-muted text-muted-foreground hover:bg-accent px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition'>Grievances</button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{statistics.members}</div>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{statistics.branches}</div>
                  <p className="text-sm text-muted-foreground">Branches</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{statistics.projects}</div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </CardContent>
              </Card>
            </div>

            {/* Values Section */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Solidarity', desc: 'Standing together for collective strength' },
                { title: 'Justice', desc: 'Fighting for fair treatment and rights' },
                { title: 'Advocacy', desc: 'Giving voice to worker concerns' }
              ].map((item) => (
                <Card key={item.title}>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold">Upcoming Events</h2>
                <p className="text-muted-foreground mt-1">Stay updated with our union activities and gatherings</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {allEvents.length} event{allEvents.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Branch Filter */}
            <Card className="bg-muted/30 border-muted">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <Label className="whitespace-nowrap">Filter by Branch:</Label>
                  <Select value={eventFilterBranch || 'all'} onValueChange={setEventFilterBranch}>
                    <SelectTrigger className="w-72">
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-16 bg-muted/30 rounded-xl text-muted-foreground">
                <p className="text-lg">No events found.</p>
                <p className="mt-2">Try changing the branch filter.</p>
              </div>
            ) : (
              <>
                {/* Featured Event */}
                {filteredEvents[0] && (
                  <FeaturedEvent event={filteredEvents[0]} onReadMore={setSelectedEvent} />
                )}

                {/* Other Events Grid */}
                {filteredEvents.length > 1 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-6">More Events</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEvents.slice(1).map(event => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onReadMore={setSelectedEvent}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* HELPDESK TAB */}
        {activeTab === 'helpdesk' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Grievances</h2>
            <p className="text-muted-foreground">File your case and make your voice heard</p>
            <div className="grid gap-4">
              {/* form filling - with input and preview for supporting images and docs */}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Ongoing Projects</h2>
            {ongoingProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No ongoing projects at the moment</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {ongoingProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{project.title}</CardTitle>
                          <CardDescription className="mt-2">{project.description}</CardDescription>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {project.budget && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-semibold">E{project.budget?.toLocaleString()}</span>
                          </div>
                        )}
                        {project.startDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Start Date:</span>
                            <span className="font-semibold">{new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {project.phases && project.phases.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Phases ({project.phases.length}):</p>
                            <div className="space-y-2">
                              {project.phases.map((phase: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span>{typeof phase === 'string' ? phase : phase.name || phase}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ARTICLES TAB */}
        {activeTab === 'articles' && (
          <div className="space-y-10">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold">Articles & Resources</h2>
                <p className="text-muted-foreground mt-1">Latest updates, news, and important resources from Atuswá Union</p>
              </div>
              <div className="text-sm text-muted-foreground">
                {publishedArticles.length} article{publishedArticles.length !== 1 ? 's' : ''}
              </div>
            </div>

            {publishedArticles.length === 0 ? (
              <div className="text-muted-foreground text-center py-16 bg-muted/30 rounded-xl">
                <p className="text-lg">No articles published yet.</p>
                <p className="mt-2">Check back soon for important updates and resources.</p>
              </div>
            ) : (
              <>
                {/* Featured Article (Largest & Most Prominent) */}
                {publishedArticles[0] && (
                  <FeaturedArticle article={publishedArticles[0]} onReadMore={setSelectedArticle} />
                )}

                {/* All Articles Grid */}
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    More Articles
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publishedArticles.slice(1).map(article => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onReadMore={setSelectedArticle}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* About Us Section */}
      <div ref={aboutSectionRef} className="max-w-7xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">About Atuswá Union</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn about our mission, values, and commitment to workers' rights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Atuswá Union is dedicated to empowering workers through collective action, solidarity, and advocacy. We stand united in the fight for fair wages, safe working conditions, and the protection of fundamental labor rights.
              </p>
              <p>
                Our mission extends beyond the workplace – we are committed to building stronger communities where workers have a voice and dignity is assured.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We envision a future where all workers enjoy fair treatment, equitable compensation, and a safe environment. A future where collective strength ensures justice and dignity for everyone.
              </p>
              <p>
                Through solidarity and unity, we strive to create lasting social change that benefits workers and their families across all sectors and industries.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold mb-2">Solidarity</h4>
                <p className="text-sm text-muted-foreground">We stand together, united in purpose and action, supporting one another in our struggle for workers' rights.</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold mb-2">Justice</h4>
                <p className="text-sm text-muted-foreground">We fight tirelessly for fair treatment, equitable wages, and the protection of fundamental human and labor rights.</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-bold mb-2">Advocacy</h4>
                <p className="text-sm text-muted-foreground">We amplify the voices of workers, ensuring their concerns are heard and their rights are respected at all levels.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Contact Information</h4>
              <p className="text-sm text-muted-foreground mb-1">Email: info@atuswa.org</p>
              <p className="text-sm text-muted-foreground mb-1">Phone: +1 (555) 123-4567</p>
              <p className="text-sm text-muted-foreground">Website: www.atuswa.com</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Office Hours</h4>
              <p className="text-sm text-muted-foreground mb-1">Monday - Friday: 9:00 AM - 5:00 PM</p>
              <p className="text-sm text-muted-foreground mb-1">Saturday: 10:00 AM - 2:00 PM</p>
              <p className="text-sm text-muted-foreground">Sunday: Closed</p>
            </div>
          </div>
        </div>
      </div>

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

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Atuswá Union. All rights reserved.</p>
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
            Atuswá Union • Empowering Workers
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
