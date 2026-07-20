'use client'

import { useState, useRef } from 'react'
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
  const [mounted, setMounted] = useState(false)
  const [statistics, setStatistics] = useState({
    members: 0,
    projects: 0,
    branches: 3,
    cases: 0
  })
  const [ongoingProjects, setOngoingProjects] = useState<any[]>([])
  const [publishedArticles, setPublishedArticles] = useState<any[]>([])
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [eventFilterBranch, setEventFilterBranch] = useState<string | null>('all')
  const aboutSectionRef = useRef<HTMLDivElement>(null)

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)

  useState(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const members = JSON.parse(localStorage.getItem('members') || '[]')
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const cases = JSON.parse(localStorage.getItem('helpdesk_cases') || '[]')
      const articles = JSON.parse(localStorage.getItem('articles') || '[]')
      const events = JSON.parse(localStorage.getItem('events') || '[]')
      const branches = JSON.parse(localStorage.getItem('branches') || '[]')

      const ongoing = projects.filter((p: any) => p.status === 'ongoing')
      const published = articles.filter((a: any) => a.published)

      setOngoingProjects(ongoing)
      setPublishedArticles(published)
      setAllEvents(events)
      setBranches(branches)

      setStatistics({
        members: members.length,
        projects: ongoing.length,
        branches: branches.length || 3,
        cases: cases.filter((c: any) => c.status !== 'completed').length
      })
    }
  })

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
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Upcoming Events</h2>

            {/* Filter Controls */}
            <Card className="bg-muted/30 border-muted">
              <CardContent className="pt-6">
                <div className='flex  flex-wrap gap-4'>
                  <Label>Filter by Branch</Label>
                  <Select value={eventFilterBranch} onValueChange={setEventFilterBranch}>
                    <SelectTrigger>
                      <SelectValue />
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

            {/* Events List */}
            <div className="grid gap-6">
              {allEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No events scheduled yet
                  </CardContent>
                </Card>
              ) : (
                allEvents
                  .filter(event => eventFilterBranch === 'all' || event.branchId === eventFilterBranch)
                  .map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition overflow-hidden">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle>{event.title}</CardTitle>
                            <CardDescription className="mt-2">{event.notes}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {event.location}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
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
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
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
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Articles & Resources</h2>
            {publishedArticles.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                <p>No articles published yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {publishedArticles.map(article => (
                  <Card key={article.id} className="hover:shadow-lg transition overflow-hidden flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          <CardDescription className="mt-2">{article.category}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-4">{article.content}</p>
                    </CardContent>
                    <div className="px-6 pb-4 border-t pt-4">
                      <p className="text-xs text-muted-foreground">
                        Published on {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
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

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Atuswá Union. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
