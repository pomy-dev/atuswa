'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { getAllRoles, getAllPermissions } from '@/services/auth-services'
import { recordActivityLog, canSee } from '@/lib/constants'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { HelpDeskCase, HelpDeskStatus, Role, Permission } from '@/lib/types'
import { FileCaseModal } from '@/components/modals/file-case-modal'
import { Plus, Users } from 'lucide-react'
import { useUserIP } from '@/lib/userUserIp'
import { createHelpdeskCase, deleteHelpdeskCase, getHelpdeskCases } from '@/services/help-desk-service'

export default function HelpdeskPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const router = useRouter()
  const [cases, setCases] = useState<HelpDeskCase[]>([])
  const [showFileModal, setShowFileModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadCases().catch((loadError: unknown) => {
      console.error('Unable to load helpdesk cases:', loadError)
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load cases.')
    })
    return () => { cancelled = true }
  }, [user, roles])

  useEffect(() => {
    if (!user) return;

    let cancelled = false

    const loadRolesAndPermissions = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')

      const { data: { session }, error } = await supabase.auth.getSession()
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

    void loadRolesAndPermissions().catch((error: unknown) => {
      console.error('Unable to load roles and permissions:', error)
    })

    return () => {
      cancelled = true
    }
  }, [user]);

  const stats = useMemo(() => {
    return {
      total: cases.length,
      pending: cases.filter(c => c.status === HelpDeskStatus.PENDING).length,
      inProgress: cases.filter(c => c.status === HelpDeskStatus.IN_PROGRESS).length,
      completed: cases.filter(c => c.status === HelpDeskStatus.COMPLETED).length
    }
  }, [cases])

  if (canSee(user?.role ?? '', roles.map(role => role.id))) {
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

  const loadCases = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    const loadedCases = await getHelpdeskCases(supabase)
    setCases(loadedCases.filter(c =>
      roles.find((r) => r.name === user?.role) || c.branch_id === user?.branchId
    ))
  }

  const statusColors: Record<HelpDeskStatus, string> = {
    [HelpDeskStatus.PENDING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [HelpDeskStatus.IN_PROGRESS]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [HelpDeskStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400'
  }

  const handleFileCase = async (caseData: Partial<HelpDeskCase>) => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const newCase = await createHelpdeskCase(supabase, {
        branch_id: user?.branchId,
        affiliate_id: null,
        title: caseData.title!,
        member_name: caseData.member_name!,
        member_phone: caseData.member_phone!,
        member_email: caseData.member_email!,
        description: caseData.description!,
      })
      setCases(current => [{
        ...newCase,
        handlers: [],
        documents: [],
        notes: [],
        created_at: new Date(newCase.created_at),
        updated_at: new Date(newCase.updated_at),
      } as HelpDeskCase, ...current])
      setShowFileModal(false)
    } catch (submitError) {
      console.error('Unable to file helpdesk case:', submitError)
      setError(submitError instanceof Error ? submitError.message : 'Unable to file case.')
    } finally {
      setIsLoading(false)
      await loadCases()
    }
  }

  const handleDelete = async (id: string) => {
    const caseDeleted = cases.find(c => c.id === id)?.title
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteHelpdeskCase(supabase, id)
      recordActivityLog('Delete', `Deleted case - ${caseDeleted}`, user?.id, user?.name, ip!)
      setCases(current => current.filter(c => c.id !== id))
      setError(null)
    } catch (deleteError) {
      console.error('Unable to delete helpdesk case:', deleteError)
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete case.')
    } finally {
      await loadCases()
    }
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

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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
                      <p>Member: {caseItem.member_name}</p>
                      <p>Phone: {caseItem.member_phone}</p>
                      <p className="mt-2 line-clamp-2">{caseItem.description}</p>
                    </div>

                    {/* Handlers */}
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex items-center gap-2">
                        {caseItem.handlers?.map((handler, idx) => (
                          <span key={idx} className="text-xs bg-secondary/50 px-2 py-1 rounded">
                            {handler.user_name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="text-xs text-muted-foreground">
                      <p>Filed by: {caseItem.created_by_name} · {new Date(caseItem.created_at).toLocaleDateString()}</p>
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
