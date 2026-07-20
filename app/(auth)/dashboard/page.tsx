'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Briefcase, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
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

  const COLORS = ['hsl(var(--color-accent))', 'hsl(var(--color-primary))', 'hsl(var(--color-secondary))']

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Atuswá Union Management System</p>
      </div>

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
                <Bar dataKey="income" fill="hsl(var(--color-accent))" name="Income" />
                <Bar dataKey="expense" fill="hsl(var(--color-primary))" name="Expense" />
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
  )
}
