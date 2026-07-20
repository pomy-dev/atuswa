'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, FinancialRecord, TransactionType } from '@/lib/types'
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AddFinancialModal } from '@/components/modals/add-financial-modal'

export default function FinancialPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<FinancialRecord[]>(() =>
    JSON.parse(localStorage.getItem('financialRecords') || '[]').filter((r: FinancialRecord) =>
      user?.role === UserRole.SECRETARY_GENERAL || r.branchId === user?.branchId
    )
  )
  const [showAddFinancialModal, setShowAddFinancialModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Can only access if Secretary General or Treasurer
  if (![UserRole.SECRETARY_GENERAL, UserRole.TREASURER].includes(user?.role!)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Only Secretary General and Treasurers can manage financial records.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = useMemo(() => {
    const income = records.filter(r => r.type === TransactionType.INCOME).reduce((sum, r) => sum + r.amount, 0)
    const expense = records.filter(r => r.type === TransactionType.EXPENSE).reduce((sum, r) => sum + r.amount, 0)
    return { income, expense, balance: income - expense }
  }, [records])

  const chartData = useMemo(() => {
    const incomeBySource: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}

    records.forEach(r => {
      if (r.type === TransactionType.INCOME && r.source) {
        incomeBySource[r.source] = (incomeBySource[r.source] || 0) + r.amount
      } else if (r.type === TransactionType.EXPENSE && r.category) {
        expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + r.amount
      }
    })

    return Object.entries({ ...incomeBySource, ...expenseByCategory }).map(([key, value]) => ({
      name: key.replace(/_/g, ' ').charAt(0).toUpperCase() + key.slice(1),
      amount: value
    }))
  }, [records])

  const handleDelete = (id: string) => {
    const allRecords = JSON.parse(localStorage.getItem('financialRecords') || '[]')
    const updated = allRecords.filter((r: FinancialRecord) => r.id !== id)
    localStorage.setItem('financialRecords', JSON.stringify(updated))
    setRecords(records.filter(r => r.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>
          <p className="text-muted-foreground mt-1">Track income and expenses</p>
        </div>
        <Button onClick={() => setShowAddFinancialModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Record
        </Button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">E{(stats.income / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">E{(stats.expense / 1000).toFixed(0)}K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              E{(stats.balance / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#5837a6ff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>{records.length} total transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {records.length === 0 ? (
              <p className="text-muted-foreground text-sm">No financial records yet</p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={record.type === TransactionType.INCOME ? 'default' : 'secondary'}>
                        {record.type === TransactionType.INCOME ? 'Income' : 'Expense'}
                      </Badge>
                      <span className="font-semibold">{record.description}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {record.source || record.category} • {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-lg ${record.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                      {record.type === TransactionType.INCOME ? '+' : '-'}E{(record.amount / 1000).toFixed(0)}K
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AddFinancialModal
        open={showAddFinancialModal}
        onOpenChange={setShowAddFinancialModal}
        onSubmit={(record) => {
          setIsLoading(true)
          try {
            const allRecords = JSON.parse(localStorage.getItem('financialRecords') || '[]')
            const newRecord: FinancialRecord = {
              id: `record_${Date.now()}`,
              branchId: user?.branchId || 'branch_main',
              type: record.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
              amount: record.amount,
              source: record.type === 'income' ? (record.category as any) : undefined,
              category: record.type === 'expense' ? (record.category as any) : undefined,
              description: record.description,
              date: new Date(record.date),
              createdBy: user?.name || ""
            }
            const updated = [...allRecords, newRecord]
            localStorage.setItem('financialRecords', JSON.stringify(updated))
            setRecords(r => [...r, newRecord])
            setShowAddFinancialModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
