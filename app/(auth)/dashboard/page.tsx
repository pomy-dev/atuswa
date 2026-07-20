'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Briefcase, AlertCircle, Plus, Trash2, CheckCircle, Clock, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [articles, setArticles] = useState<any[]>([])
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'General',
    published: false,
    featuredImage: null as any,
    featuredImageCaption: '',
    attachedFiles: [] as any[]
  })

  useMemo(() => {
    const stored = JSON.parse(localStorage.getItem('articles') || '[]')
    setArticles(stored)
  }, [activeTab === 'articles'])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setArticleForm(prev => ({
        ...prev,
        featuredImage: ev.target?.result as string
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setArticleForm(prev => ({
          ...prev,
          attachedFiles: [...prev.attachedFiles, {
            name: file.name,
            url: ev.target?.result as string,
            caption: ''
          }]
        }))
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleAddArticle = () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      alert('Please fill in all fields')
      return
    }

    const newArticle = {
      id: `article_${Date.now()}`,
      title: articleForm.title,
      content: articleForm.content,
      category: articleForm.category,
      published: articleForm.published,
      featuredImage: articleForm.featuredImage,
      featuredImageCaption: articleForm.featuredImageCaption,
      attachedFiles: articleForm.attachedFiles,
      createdBy: user?.name,
      createdAt: new Date().toISOString()
    }

    const allArticles = [...articles, newArticle]
    localStorage.setItem('articles', JSON.stringify(allArticles))
    setArticles(allArticles)
    setArticleForm({ title: '', content: '', category: 'General', published: false, featuredImage: null, featuredImageCaption: '', attachedFiles: [] })
    setShowArticleForm(false)
  }

  const handleDeleteArticle = (id: string) => {
    const updated = articles.filter(a => a.id !== id)
    localStorage.setItem('articles', JSON.stringify(updated))
    setArticles(updated)
  }

  const stats = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('members') || '[]')
    const financialRecords = JSON.parse(localStorage.getItem('financialRecords') || '[]')
    const projects = JSON.parse(localStorage.getItem('projects') || '[]')
    const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')

    const totalMembers = members.length
    const totalIncome = financialRecords
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + r.amount, 0)
    const totalExpense = financialRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((sum: number, r: any) => sum + r.amount, 0)
    const balance = totalIncome - totalExpense
    const activeProjects = projects.filter((p: any) => p.status === 'in_progress').length
    const openCases = cases.filter((c: any) => c.status !== 'resolved').length

    return { totalMembers, totalIncome, totalExpense, balance, activeProjects, openCases }
  }, [])

  const chartData = useMemo(() => {
    const financialRecords = JSON.parse(localStorage.getItem('financialRecords') || '[]')
    const monthlyData = {
      'Jan': { income: 0, expense: 0 },
      'Feb': { income: 0, expense: 0 },
      'Mar': { income: 0, expense: 0 },
      'Apr': { income: 0, expense: 0 },
      'May': { income: 0, expense: 0 },
      'Jun': { income: 0, expense: 0 },
      'Jul': { income: 0, expense: 0 }
    }

    financialRecords.forEach((record: any) => {
      const date = new Date(record.date)
      const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
      if (monthlyData[month as keyof typeof monthlyData]) {
        if (record.type === 'income') {
          monthlyData[month as keyof typeof monthlyData].income += record.amount
        } else {
          monthlyData[month as keyof typeof monthlyData].expense += record.amount
        }
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense
    }))
  }, [])

  const branchData = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('members') || '[]')
    const branches = JSON.parse(localStorage.getItem('branches') || '[]')

    return branches.map((branch: any) => ({
      name: branch.name,
      value: members.filter((m: any) => m.branchId === branch.id).length
    }))
  }, [])

  const COLORS = ['#1c0facff', '#f633ef', '#f98220']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to Atuswá Union Management System</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'articles'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Articles & Content
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members across all branches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">E{(stats.balance / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-semibold">+E{(stats.totalIncome / 1000).toFixed(0)}K</span> income
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertCircle className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly financial overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#476bf9ff" name="Income" />
                <Bar dataKey="expense" fill="#f84c57ff" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members by Branch</CardTitle>
            <CardDescription>Distribution across regions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={branchData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#f6be17ff"
                  dataKey="value"
                >
                  {branchData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Quick overview of active modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
              <Users className="w-6 h-6 text-accent mb-2" />
              <span className="text-sm font-semibold">Members</span>
              <span className="text-xs text-muted-foreground mt-1">Active</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
              <DollarSign className="w-6 h-6 text-accent mb-2" />
              <span className="text-sm font-semibold">Financial</span>
              <span className="text-xs text-muted-foreground mt-1">Tracked</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
              <Briefcase className="w-6 h-6 text-accent mb-2" />
              <span className="text-sm font-semibold">Projects</span>
              <span className="text-xs text-muted-foreground mt-1">{stats.activeProjects} Active</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
              <AlertCircle className="w-6 h-6 text-accent mb-2" />
              <span className="text-sm font-semibold">Helpdesk</span>
              <span className="text-xs text-muted-foreground mt-1">{stats.openCases} Open</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-card rounded-lg border border-border">
              <Badge variant="secondary" className="mb-2">v1.0</Badge>
              <span className="text-sm font-semibold">System</span>
              <span className="text-xs text-muted-foreground mt-1">Online</span>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      )}

      {/* ARTICLES TAB */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Articles & Content</h2>
              <p className="text-muted-foreground mt-1">Manage articles that appear on the website</p>
            </div>
            <Button onClick={() => setShowArticleForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </div>

          {showArticleForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Article</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Article Title *</Label>
                  <Input
                    id="title"
                    placeholder="Article title"
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Article content..."
                    value={articleForm.content}
                    onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  >
                    <option value="General">General</option>
                    <option value="News">News</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Guide">Guide</option>
                    <option value="Resources">Resources</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="featuredImage">Featured Image</Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label>
                        <Button type="button" variant="outline" className="w-full">
                          Choose Image
                        </Button>
                        <input
                          id="featuredImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {articleForm.featuredImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setArticleForm({ ...articleForm, featuredImage: null })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  {articleForm.featuredImage && (
                    <div className="mt-2">
                      <img src={articleForm.featuredImage} alt="Featured" className="w-full h-40 object-cover rounded" />
                    </div>
                  )}
                </div>

                {articleForm.featuredImage && (
                  <div>
                    <Label htmlFor="imageCaption">Image Caption</Label>
                    <Input
                      id="imageCaption"
                      placeholder="Add a caption for the featured image"
                      value={articleForm.featuredImageCaption}
                      onChange={(e) => setArticleForm({ ...articleForm, featuredImageCaption: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label>Attach Files</Label>
                  <label>
                    <Button type="button" variant="outline" className="w-full">
                      Upload Files
                    </Button>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {articleForm.attachedFiles.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Attached Files ({articleForm.attachedFiles.length})</Label>
                    <div className="space-y-2">
                      {articleForm.attachedFiles.map((file, idx) => (
                        <div key={idx} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setArticleForm(prev => ({
                                ...prev,
                                attachedFiles: prev.attachedFiles.filter((_, i) => i !== idx)
                              }))}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Add caption for this file"
                            value={file.caption}
                            onChange={(e) => {
                              const updated = [...articleForm.attachedFiles]
                              updated[idx].caption = e.target.value
                              setArticleForm(prev => ({ ...prev, attachedFiles: updated }))
                            }}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={articleForm.published}
                    onChange={(e) => setArticleForm({ ...articleForm, published: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="published" className="cursor-pointer">Publish to website</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddArticle}>Create Article</Button>
                  <Button variant="outline" onClick={() => setShowArticleForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles List */}
          <div className="grid gap-4">
            {articles.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No articles yet. Create your first article to get started!
                </CardContent>
              </Card>
            ) : (
              articles.map(article => (
                <Card key={article.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          {article.published ? (
                            <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="w-3 h-3" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="px-2 py-1 bg-muted rounded">{article.category}</span>
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                          <span>By {article.createdBy}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{article.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
