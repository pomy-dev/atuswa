'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HelpDeskCase, HelpDeskStatus, CaseNote } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { CaseHandlers } from '@/components/helpdesk/case-handlers'
import { CaseNotes } from '@/components/helpdesk/case-notes'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const caseId = params.id as string

  const [caseData, setCaseData] = useState<HelpDeskCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<HelpDeskStatus | ''>('')

  // useEffect(() => {
  //   const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
  //   const found = cases.find((c: HelpDeskCase) => c.id === caseId)
  //   setCaseData(found || null)
  //   if (found) {
  //     setNewStatus(found.status)
  //   }
  //   setIsLoading(false)
  // }, [caseId])

  useEffect(() => {
    const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
    let found = cases.find((c: HelpDeskCase) => c.id === caseId)

    if (found) {
      // Normalize missing arrays
      found = {
        ...found,
        handlers: found.handlers || [],
        notes: found.notes || []
      }
      setNewStatus(found.status)
    }

    setCaseData(found || null)
    setIsLoading(false)
  }, [caseId])

  const handleAddNote = (content: string) => {
    if (!caseData) return

    const newNote: CaseNote = {
      id: `note_${Date.now()}`,
      content,
      createdBy: user!.id,
      createdByName: user!.name,
      createdAt: new Date()
    }

    const updated = {
      ...caseData,
      notes: [...caseData.notes, newNote],
      updatedAt: new Date()
    }

    setCaseData(updated)
    const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
    const index = cases.findIndex((c: HelpDeskCase) => c.id === caseId)
    cases[index] = updated
    localStorage.setItem('helpDeskCases', JSON.stringify(cases))
  }

  // const handleStatusChange = (status: string) => {
  //   if (!caseData) return
  //   const statusEnum = status as HelpDeskStatus

  //   const updated = {
  //     ...caseData,
  //     status: statusEnum,
  //     handlers: [
  //       ...caseData?.handlers,
  //       {
  //         userId: user!.id,
  //         userName: user!.name,
  //         handledAt: new Date(),
  //         action: `Status updated to ${statusEnum.replace('_', ' ')}`
  //       }
  //     ],
  //     updatedAt: new Date()
  //   }

  //   setCaseData(updated)
  //   setNewStatus(statusEnum)
  //   const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
  //   const index = cases.findIndex((c: HelpDeskCase) => c.id === caseId)
  //   cases[index] = updated
  //   localStorage.setItem('helpDeskCases', JSON.stringify(cases))
  // }

  const handleStatusChange = (status: string) => {
    if (!caseData || !user) return

    const statusEnum = status as HelpDeskStatus

    const updated = {
      ...caseData,
      status: statusEnum,
      handlers: [
        ...(caseData.handlers || []),   // ← Safe spread with fallback
        {
          userId: user.id,
          userName: user.name,
          handledAt: new Date(),
          action: `Status updated to ${statusEnum.replace('_', ' ')}`
        }
      ],
      updatedAt: new Date()
    }

    setCaseData(updated)
    setNewStatus(statusEnum)

    // Update localStorage
    // const cases = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
    // const index = cases.findIndex((c: HelpDeskStatus) => c.id === caseId)

    const cases: HelpDeskCase[] = JSON.parse(localStorage.getItem('helpDeskCases') || '[]')
    const index = cases.findIndex((c: HelpDeskCase) => c.id === caseId)

    if (index !== -1) {
      cases[index] = updated
      localStorage.setItem('helpDeskCases', JSON.stringify(cases))
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!caseData) {
    return <div className="p-6">Case not found</div>
  }

  const statusColors = {
    [HelpDeskStatus.PENDING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [HelpDeskStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [HelpDeskStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.title}</h1>
            <p className="text-sm text-muted-foreground">Case ID: {caseData.id}</p>
          </div>
        </div>
        <Badge className={statusColors[caseData.status]}>
          {caseData.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Case Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Case Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member</label>
                <p className="text-foreground">{caseData.memberName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{caseData.memberPhone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{caseData.memberEmail}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground whitespace-pre-wrap">{caseData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(caseData.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-sm">{caseData.createdByName}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Status Update */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value={HelpDeskStatus.PENDING}>Pending</option>
                <option value={HelpDeskStatus.IN_PROGRESS}>In Progress</option>
                <option value={HelpDeskStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          </Card>

          {/* Case Notes */}
          <CaseNotes
            notes={caseData.notes}
            onAddNote={handleAddNote}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CaseHandlers handlers={caseData.handlers} />
        </div>
      </div>
    </div>
  )
}
