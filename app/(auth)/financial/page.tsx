'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { TransactionType, Role, Permission, Branch } from '@/lib/types'
import {
  Plus, TrendingUp, TrendingDown, Trash2, Building2, FileText, RefreshCw,
  ExpandIcon, FileXIcon
} from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getAllPermissions, getAllRoles } from '@/services/auth-services'
import { canSee, recordActivityLog } from '@/lib/constants'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { AddFinancialModal } from '@/components/modals/add-financial-modal'
import { useUserIP } from '@/lib/userUserIp'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { ScopeOption, ScopeType, FinancialRecordPayload } from '@/lib/types'
import { getAllBranches } from '@/services/branch-service'
import { createFinancialRecord, deleteFinancialRecord, getFinancialRecords, getFinancialReceiptUrl } from '@/services/financial-service'
import { toast } from 'sonner'
import Link from 'next/link'
import { Spinner } from '@/components/ui/spinner'

interface FinancialRecordWithResolvedUrl extends FinancialRecordPayload {
  resolved_receipt_url?: string;
}

export default function FinancialPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()

  const [showAddFinancialModal, setShowAddFinancialModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all')
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>('all')
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all')
  const [, setActiveScope] = useState<ScopeType>('tucoswa')
  const [branches, setBranches] = useState<Branch[]>([])
  const [affiliates, setAffiliates] = useState<ScopeOption[]>([])
  const [members, setMembers] = useState<ScopeOption[]>([])

  const isHQRole = (role?: string) => {
    const normalizedRole = role?.toLowerCase().replace(/[_-]+/g, ' ').trim() ?? ''
    const compactRole = normalizedRole.replace(/\s+/g, '')

    return (
      /\b(accountant|accounting|finance|financial|sg)\b/.test(normalizedRole) ||
      compactRole.includes('secretarygeneral')
    )
  }

  const isHQ = isHQRole(user?.role)
  const [records, setRecords] = useState<FinancialRecordWithResolvedUrl[]>([])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const loadRecords = async () => {
      setIsLoading(true)
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        let loadedRecords = await getFinancialRecords(supabase, {
          ...(!isHQ ? { branch_id: user.branchId } : selectedBranchId !== 'all' ? { branch_id: selectedBranchId } : {}),
          ...(selectedAffiliateId !== 'all' ? { affiliate_id: selectedAffiliateId } : {}),
          ...(selectedMemberId !== 'all' ? { member_id: selectedMemberId } : {}),
          ...(filterType !== 'all'
            ? { transaction_type: filterType === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE }
            : {}),
          ...(startDate ? { start_date: startDate } : {}),
          ...(endDate ? { end_date: endDate } : {}),
        })

        const recordsWithResolvedUrls = await Promise.all(loadedRecords.map(async (record) => {
          if (!record.receipt_url) return record
          try {
            const resolvedUrl = await getFinancialReceiptUrl(supabase, record.receipt_url)
            return { ...record, resolved_receipt_url: resolvedUrl }
          } catch (error) {
            console.error(`Unable to resolve receipt URL for record ${record.id}:`, error)
            return record
          }
        }))

        if (!cancelled) setRecords(recordsWithResolvedUrls)
      } catch (error) {
        console.error('Unable to load financial records:', error)
        if (!cancelled) toast.error('Unable to load financial records.')
      } finally {
        setIsLoading(false)
        if (!cancelled) setIsLoading(false)
      }
    }
    void loadRecords()
    return () => { cancelled = true }
  }, [user, isHQ, selectedBranchId, selectedAffiliateId, selectedMemberId, filterType, startDate, endDate])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const loadScopeOptions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const [branchRows, affiliateResult, memberResult] = await Promise.all([
        getAllBranches(supabase),
        supabase.from('affiliates').select('id, official_name, acronym').order('official_name'),
        (() => {
          let query = supabase.from('members').select('id, name, branch_id, affiliate_id').order('name')
          if (!isHQ && user.branchId) query = query.eq('branch_id', user.branchId)
          return query
        })(),
      ])

      if (affiliateResult.error) throw affiliateResult.error
      if (memberResult.error) throw memberResult.error
      if (cancelled) return

      setBranches(branchRows.map((branch: any) => ({
        ...branch,
        name: branch.name ?? branch.branch_name ?? '',
        isActive: branch.is_active ?? branch.isActive ?? true,
        contactEmail: branch.contact_email ?? branch.contactEmail,
        adminId: branch.admin_id ?? branch.adminId,
        createdAt: branch.created_at ? new Date(branch.created_at) : branch.createdAt ?? new Date(),
      })))
      setAffiliates((affiliateResult.data ?? []).map((affiliate) => ({
        id: affiliate.id,
        name: affiliate.acronym ? `${affiliate.acronym} — ${affiliate.official_name}` : affiliate.official_name,
        type: 'affiliate' as const,
      })))
      setMembers((memberResult.data ?? []).map((member) => ({
        id: member.id,
        name: member.name,
        type: 'member' as const,
      })))
    }

    void loadScopeOptions().catch((error: unknown) => {
      console.error('Unable to load financial scope options:', error)
      if (!cancelled) toast.error('Unable to load branches, affiliates, or members.')
    })
    return () => { cancelled = true }
  }, [user, isHQ])

  // Load roles & permissions
  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) throw error
      if (!session) return

      const [loadedRoles, loadedPermissions] = await Promise.all([
        getAllRoles(supabase, session),
        getAllPermissions(supabase, session),
      ])

      if (!cancelled) {
        setRoles(loadedRoles ?? [])
        setPermissions(loadedPermissions ?? [])
      }
    }

    void load().catch((err) => console.error('Unable to load roles and permissions:', err))
    return () => {
      cancelled = true
    }
  }, [user])

  // Access control
  if (canSee(user?.role ?? '', roles.map((r) => r.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Only Secretary General, HQ Accountants and authorised Treasurers can manage financial
              records.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---------- Derived data ----------
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Type
      const matchType =
        filterType === 'all' ||
        (filterType === 'income' && r.type === TransactionType.INCOME) ||
        (filterType === 'expense' && r.type === TransactionType.EXPENSE)

      // Date
      const recordDate = new Date(r.date)
      let matchDate = true
      if (startDate) matchDate = matchDate && recordDate >= new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        matchDate = matchDate && recordDate <= end
      }

      // Scope filters (HQ only sees everything; others already limited)
      const matchBranch =
        selectedBranchId === 'all' || r.branch_id === selectedBranchId
      const matchAffiliate =
        selectedAffiliateId === 'all' || r.affiliate_id === selectedAffiliateId
      const matchMember = selectedMemberId === 'all' || r.member_id === selectedMemberId

      return matchType && matchDate && matchBranch && matchAffiliate && matchMember
    })
  }, [
    records,
    filterType,
    startDate,
    endDate,
    selectedBranchId,
    selectedAffiliateId,
    selectedMemberId,
  ])

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sortOrder === 'asc' ? diff : -diff
    })
  }, [filteredRecords, sortOrder])

  const stats = useMemo(() => {
    const income = filteredRecords
      .filter((r) => r.type === TransactionType.INCOME)
      .reduce((sum, r) => sum + r.amount, 0)
    const expense = filteredRecords
      .filter((r) => r.type === TransactionType.EXPENSE)
      .reduce((sum, r) => sum + r.amount, 0)
    return { income, expense, balance: income - expense, count: filteredRecords.length }
  }, [filteredRecords])

  // Mini-views / breakdown by body (HQ)
  const bodySummaries = useMemo(() => {
    if (!isHQ) return []

    const byBranch: Record<string, { income: number; expense: number; name: string }> = {}

    records.forEach((r) => {
      const key = r.branch_id || 'unknown'
      if (!byBranch[key]) {
        byBranch[key] = {
          income: 0,
          expense: 0,
          name: branches.find((b) => b.id === key)?.name || key,
        }
      }
      if (r.type === TransactionType.INCOME) byBranch[key].income += r.amount
      else byBranch[key].expense += r.amount
    })

    return Object.entries(byBranch).map(([id, data]) => ({
      id,
      name: data.name,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    }))
  }, [records, isHQ, branches])

  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredRecords.forEach((r) => {
      const key =
        r.type === TransactionType.INCOME
          ? r.source || 'Other Income'
          : r.category || 'Other Expense'
      map[key] = (map[key] || 0) + r.amount
    })
    return Object.entries(map).map(([name, amount]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      amount,
    }))
  }, [filteredRecords])

  // ---------- Handlers ----------
  const handleDelete = async (id: string) => {
    const target = records.find((r) => r.id === id)
    if (!confirm(`Are you sure you wanna delete ${target?.type} ${target?.category}`)) return;
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteFinancialRecord(supabase, id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (target) {
        toast.success(`Financial record ${target.category} - ${target.type}`)
        recordActivityLog(
          'Delete',
          `Deleted financial record – ${target.type}, E${target.amount}`,
          user?.id,
          user?.name,
          ip!
        )
      }
    } catch (error) {
      console.error('Unable to delete financial record:', error)
      toast.error(`Failed to delete financial record. ${error}`)
    }
  }

  const resetFilters = () => {
    setFilterType('all')
    setSortOrder('desc')
    setStartDate('')
    setEndDate('')
    setSelectedBranchId('all')
    setSelectedAffiliateId('all')
    setSelectedMemberId('all')
  }

  const generateStatement = () => {
    const statement = {
      generatedAt: new Date().toISOString(),
      generatedBy: user?.name,
      scope: {
        branch: selectedBranchId,
        affiliate: selectedAffiliateId,
        member: selectedMemberId,
        type: filterType,
        startDate,
        endDate,
      },
      summary: stats,
      transactions: sortedRecords,
    }

    // Simple download as JSON – replace with PDF/CSV generation later
    const blob = new Blob([JSON.stringify(statement, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial-statement-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)

    recordActivityLog(
      'Generate',
      `Generated financial statement (${stats.count} transactions)`,
      user?.id,
      user?.name,
      ip!
    )
  }

  const formatAmount = (value: number) =>
    `E${(value / 1000).toFixed(value >= 1000 ? 0 : 1)}K`

  // ---------- Render ----------
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Workspace</h1>
          <p className="text-muted-foreground mt-1">
            {isHQ
              ? 'TUCOSWA Headquarters – overview of all branches, affiliates and members'
              : `Branch financial records • ${user?.branchId || 'Current branch'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateStatement} className="gap-2">
            <FileText className="w-4 h-4" />
            Generate Statement
          </Button>
          <Button onClick={() => setShowAddFinancialModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(stats.income)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredRecords.filter((r) => r.type === TransactionType.INCOME).length} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatAmount(stats.expense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredRecords.filter((r) => r.type === TransactionType.EXPENSE).length} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {formatAmount(stats.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">After filters applied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground mt-1">Matching current filters</p>
          </CardContent>
        </Card>
      </div>

      {/* HQ Mini-views – body summaries */}
      {isHQ && bodySummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Financial Standing by Body
            </CardTitle>
            <CardDescription>
              Quick overview of branches (and later affiliates). Click a row or use filters below to
              drill down.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bodySummaries.map((body) => (
                <div
                  key={body.id}
                  className="rounded-lg border p-4 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedBranchId(body.id)
                    setActiveScope('branch')
                  }}
                >
                  <div className="font-medium mb-2">{body.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Income</div>
                      <div className="text-green-600 font-semibold">
                        {formatAmount(body.income)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Expense</div>
                      <div className="text-red-600 font-semibold">
                        {formatAmount(body.expense)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Balance</div>
                      <div
                        className={`font-semibold ${body.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {formatAmount(body.balance)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution by Category / Source</CardTitle>
            <CardDescription>Based on currently filtered transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (typeof value === 'number') {
                      return [formatAmount(value), name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="amount" name="Amount" fill="#80658F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters + History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {sortedRecords.length} of {records.length} transactions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset filters
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filter bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={filterType}
                onValueChange={(v: 'all' | 'income' | 'expense' | null) => setFilterType(v!)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            {isHQ && (
              <div className="space-y-1.5">
                <Label className="text-xs">Branch</Label>
                <Select value={selectedBranchId} onValueChange={(v) => setSelectedBranchId(v!)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Affiliate</Label>
              <Select value={selectedAffiliateId} onValueChange={(v) => setSelectedAffiliateId(v!)}>
                <SelectTrigger>
                  <SelectValue placeholder="All affiliates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Affiliates</SelectItem>
                  {affiliates.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Member</Label>
              <Select value={selectedMemberId} onValueChange={(v) => setSelectedMemberId(v!)}>
                <SelectTrigger>
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sort</Label>
              <Select
                value={sortOrder}
                onValueChange={(v: 'asc' | 'desc' | null) => setSortOrder(v ?? 'desc')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {isLoading ?
            (
              <div className="flex flex-wrap items-center text-center justify-center py-12 text-muted-foreground">
                <Spinner className='h-6 w-6' />{"  "} Loading...
              </div>
            )
            : (isLoading && sortedRecords.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground">
                {records.length === 0
                  ? 'No financial records yet. Create the first one.'
                  : 'No transactions match the current filters.'}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category / Source</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(record.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              record.type === TransactionType.INCOME ? 'default' : 'secondary'
                            }
                          >
                            {record.type === TransactionType.INCOME ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[240px] truncate">
                          {record.description}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.source || record.category || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground hover:text-muted-foreground">
                          {record.receipt_url && record.resolved_receipt_url ?
                            <Link href={record.resolved_receipt_url} target='_blank' rel='noopener noreferrer'>
                              <ExpandIcon className='h-4 w-4 text-muted-foreground' />
                            </Link> :
                            <FileXIcon className='h-4 w-4 text-destructive' />
                          }
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold ${record.type === TransactionType.INCOME
                            ? 'text-green-600'
                            : 'text-red-600'
                            }`}
                        >
                          {record.type === TransactionType.INCOME ? '+' : '-'}
                          {formatAmount(record.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <AddFinancialModal
        open={showAddFinancialModal}
        onOpenChange={setShowAddFinancialModal}
        isHQ={isHQ}
        branches={branches}
        affiliates={affiliates}
        members={members}
        defaultBranchId={selectedBranchId !== 'all' ? selectedBranchId : undefined}
        userId={user?.id!}
        onSubmit={async (record) => {
          setIsLoading(true)
          try {
            const supabase = getSupabaseBrowserClient()
            if (!supabase) throw new Error('Supabase is not configured.')
            const createdRecord = await createFinancialRecord(
              supabase,
              {
                ...record,
                branch_id: record.branch_id || (isHQ
                  ? selectedBranchId !== 'all' ? selectedBranchId : undefined
                  : user?.branchId),
              },
              user?.id
            )
            const newRecord: FinancialRecordWithResolvedUrl = createdRecord.receipt_url
              ? {
                ...createdRecord,
                resolved_receipt_url: await getFinancialReceiptUrl(supabase, createdRecord.receipt_url),
              }
              : createdRecord
            setRecords((prev) => [newRecord, ...prev])

            if (newRecord) {
              recordActivityLog(
                'Record',
                `Recorded ${newRecord.type} of E${newRecord.amount}`,
                user?.id,
                user?.name,
                ip ?? ''
              )
              toast.success('Financial record saved.')
            }
            setShowAddFinancialModal(false)
          } catch (error) {
            console.error('Unable to create financial record:', error)
            toast.error(error instanceof Error ? error.message : 'Unable to save financial record.')
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
