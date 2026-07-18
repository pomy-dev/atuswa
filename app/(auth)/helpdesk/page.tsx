'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, HelpDeskCase, HelpDeskStatus } from '@/lib/types'
import { FileCaseModal } from '@/components/modals/file-case-modal'
import { Plus, Users } from 'lucide-react'

export default function HelpdeskPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<HelpDeskCase[]>(() =>
    JSON.parse(localStorage.getItem('helpDeskCases') || '[]').filter((c: HelpDeskCase) =>
      user?.role === UserRole.SECRETARY_GENERAL || c.branchId === user?.branchId
    )
  )
  const [showFileModal, setShowFileModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Can only access if authorized
  const canFileCase = [
    UserRole.SECRETARY_GENERAL,
    UserRole.BRANCH_ADMIN,
    'board_member' // For board members
  ].includes(user?.role!)

  if (!canFileCase) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don&apos;t have permission to file helpdesk cases.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = useMemo(() => {
    return {
      total: cases.length,
      pending: cases.filter(c => c.status === HelpDeskStatus.PENDING).length,
      inProgress: cases.filter(c => c.status === HelpDeskStatus.IN_PROGRESS).length,
      completed: cases.filter(c => c.status === HelpDeskStatus.COMPLETED).length
    }
  }, [cases])

  const statusColors: Record<HelpDeskStatus, string> = {
    [HelpDeskStatus.PENDING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [HelpDeskStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [HelpDeskStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400'
  }

  const handleFileCase = async (caseData: Partial<HelpDeskCase>) => {
    setIsLoading(true)
    try {
      const newCase: HelpDeskCase = {
        id: `case_${Date.now()}`,
        branchId: user!.branchId,
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
      setCases([...cases, newCase])
      setShowFileModal(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    const allCases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
    const updated = allCases.filter((c: HelpDeskCase) => c.id !== id)
    localStorage.setItem('helpDeskCases', JSON.stringify(updated))
    setCases(cases.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Helpdesk</h1>
          <p className="text-muted-foreground mt-1">Manage member support cases</p>
        </div>
        <Button onClick={() => setShowFileModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          File New Case
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* File Case Modal */}
      <FileCaseModal
        open={showFileModal}
        onOpenChange={setShowFileModal}
        onSubmit={handleFileCase}
        isLoading={isLoading}
      />

      {/* Cases List */}
      <div className="space-y-4">
        {cases.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No cases found
            </CardContent>
          </Card>
        ) : (
          cases.map((caseItem) => (
            <Card
              key={caseItem.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/helpdesk/${caseItem.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{caseItem.title}</h3>
                      <Badge className={statusColors[caseItem.status]}>
                        {caseItem.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1 mb-4">
                      <p>Member: {caseItem.memberName}</p>
                      <p>Phone: {caseItem.memberPhone}</p>
                      <p className="mt-2 line-clamp-2">{caseItem.description}</p>
                    </div>

                    {/* Handlers */}
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        {caseItem.handlers?.map((handler, idx) => (
                          <span key={idx} className="text-xs bg-secondary/50 px-2 py-1 rounded">
                            {handler.userName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-xs text-muted-foreground">
                      <p>Filed by: {caseItem.createdByName} · {new Date(caseItem.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(caseItem.id)
                    }}
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
