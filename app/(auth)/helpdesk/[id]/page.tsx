'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { HelpDeskCase, HelpDeskStatus } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CaseHandlers } from '@/components/helpdesk/case-handlers'
import { CaseNotes } from '@/components/helpdesk/case-notes'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { addHelpdeskCaseNote, getHelpdeskCaseById, updateHelpdeskCaseStatus } from '@/services/help-desk-service'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const caseId = params.id as string

  const [caseData, setCaseData] = useState<HelpDeskCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState<HelpDeskStatus | ''>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const found = await getHelpdeskCaseById(supabase, caseId)
      if (!cancelled) {
        setCaseData(found)
        setNewStatus(found.status)
      }
    }
    void load().catch((loadError: unknown) => {
      console.error('Unable to load helpdesk case:', loadError)
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load case.')
    }).finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [caseId])

  const handleAddNote = async (content: string) => {
    if (!caseData || !user) return
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const note = await addHelpdeskCaseNote(supabase, caseId, { content, created_by: user.id, created_by_name: user.name })
      setCaseData(current => current ? { ...current, notes: [...current.notes, { ...note, created_at: new Date(note.created_at) }] } : current)
      setError(null)
    } catch (noteError) {
      console.error('Unable to add helpdesk note:', noteError)
      setError(noteError instanceof Error ? noteError.message : 'Unable to add note.')
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!caseData || !user) return
    const statusEnum = status as HelpDeskStatus
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await updateHelpdeskCaseStatus(supabase, caseId, statusEnum, { id: user.id, name: user.name })
      setCaseData(current => current ? { ...current, status: statusEnum, handlers: [...current.handlers, {
        user_id: user.id, user_name: user.name, handled_at: new Date(),
        action: `Status updated to ${statusEnum.replace('_', ' ')}`,
      }] } : current)
      setNewStatus(statusEnum)
      setError(null)
    } catch (statusError) {
      console.error('Unable to update helpdesk case:', statusError)
      setError(statusError instanceof Error ? statusError.message : 'Unable to update status.')
    }
  }
  if (isLoading) {
    return <div className="p-6">Loading...</div>
  }

  if (!caseData) {
    return <div className="p-6">{error || 'Case not found'}</div>
  }

  const statusColors = {
    [HelpDeskStatus.PENDING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [HelpDeskStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [HelpDeskStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400'
  }

  return (
    <div className="p-6 space-y-6">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
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
                <p className="text-foreground">{caseData.member_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{caseData.member_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{caseData.member_email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-foreground whitespace-pre-wrap">{caseData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(caseData.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="text-sm">{caseData.created_by_name}</p>
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
