'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Share2, Users, TrendingUp, Heart } from 'lucide-react'

export default function PublicWebsite() {
  const [activeTab, setActiveTab] = useState('home')
  const [mounted, setMounted] = useState(false)
  const [statistics, setStatistics] = useState({
    members: 0,
    projects: 0,
    branches: 3,
    cases: 0,
    totalIncome: 0
  })

  useState(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const members = JSON.parse(localStorage.getItem('members') || '[]')
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const cases = JSON.parse(localStorage.getItem('helpdesk_cases') || '[]')
      const financial = JSON.parse(localStorage.getItem('financial_records') || '[]')

      setStatistics({
        members: members.length,
        projects: projects.filter((p: any) => p.status === 'ongoing').length,
        branches: 3,
        cases: cases.filter((c: any) => c.status !== 'completed').length,
        totalIncome: financial.filter((f: any) => f.type === 'income').reduce((sum: number, f: any) => sum + f.amount, 0)
      })
    }
  })

  const tabs = ['home', 'events', 'articles', 'projects', 'financial', 'members', 'helpdesk']

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header/Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-primary">Atuswá Union</div>
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
                <Button size="lg" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Join Us
                </Button>
                <Button size="lg" variant="outline">Learn More</Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid md:grid-cols-5 gap-4">
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
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">E{(statistics.totalIncome / 1000).toFixed(0)}K</div>
                  <p className="text-sm text-muted-foreground">Total Income</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-primary">{statistics.cases}</div>
                  <p className="text-sm text-muted-foreground">Open Cases</p>
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
            <h2 className="text-3xl font-bold">Support Cases</h2>
            <p className="text-muted-foreground">View open support cases and their status</p>
            <div className="grid gap-4">
              {[
                { title: 'Salary Payment Dispute', status: 'in_progress', handlers: 2 },
                { title: 'Workplace Safety Concern', status: 'pending', handlers: 1 }
              ].map((caseItem) => (
                <Card key={caseItem.title}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{caseItem.handlers} handler(s)</Badge>
                          <Badge className={caseItem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}>
                            {caseItem.status === 'pending' ? 'Pending' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* OTHER TABS - Placeholder */}
        {['articles', 'projects', 'financial', 'members'].includes(activeTab) && (
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

      {/* Footer */}
      <footer className="bg-muted mt-12 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Atuswá Union. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
