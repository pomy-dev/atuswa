'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, Heart } from 'lucide-react'
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

  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showFileModal, setShowFileModal] = useState(false)

  useState(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const members = JSON.parse(localStorage.getItem('members') || '[]')
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const cases = JSON.parse(localStorage.getItem('helpdesk_cases') || '[]')

      setStatistics({
        members: members.length,
        projects: projects.filter((p: any) => p.status === 'ongoing').length,
        branches: 3,
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
                {/* scroll to about us section */}
                <Button size="lg" variant="outline">Learn More</Button>

                {/* show case-file modal */}
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
            <div className="grid gap-6">
              {[
                { title: 'Annual General Meeting', date: 'July 2024', desc: 'Annual gathering for all members' },
                { title: 'Worker Rights Workshop', date: 'August 2024', desc: 'Training on labor laws and rights' },
                { title: 'Community Service Day', date: 'September 2024', desc: 'Volunteering and community outreach' }
              ].map((event) => (
                <Card key={event.title} className="hover:shadow-lg transition">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{event.date}</CardDescription>
                      </div>
                      <Button size="sm" variant="ghost" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{event.desc}</p>
                  </CardContent>
                </Card>
              ))}
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

        {/* OTHER TABS - Placeholder */}
        {['articles', 'projects'].includes(activeTab) && (
          <div className="text-center py-12">
            <p className="text-2xl font-bold mb-4">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section
            </p>
            <p className="text-muted-foreground">
              Content for {activeTab} will be displayed here
            </p>
          </div>
        )}
      </div>

      {/* About */}
      <div className="max-w-7xl mx-auto px-4 py-12">
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
