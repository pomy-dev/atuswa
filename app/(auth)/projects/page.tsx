'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Project, ProjectStatus, Role, Permission } from '@/lib/types'
import { Plus, Calendar, MoreVertical, Trash2, ExternalLink } from 'lucide-react'
import { canSee, recordActivityLog } from '@/lib/constants'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getAllRoles, getAllPermissions } from '@/services/auth-services'
import { AddProjectModal } from '@/components/modals/add-project-modal'
import { useUserIP } from '@/lib/userUserIp'
import { toast } from 'sonner'
import { createProject, deleteProject, getAllProjects } from '@/services/project-service'
import { Spinner } from '@/components/ui/spinner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { FullScreenLoader } from '@/components/fullScreenLoader'

type FilterType = 'all' | 'planning' | 'ongoing' | 'completed'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const [projects, setProjects] = useState<Project[]>([])
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  const loadProjects = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    const rows = await getAllProjects(supabase)
    setProjects(rows.filter(project => user?.role === 'Secretary General' || project.branch_id === user?.branchId))
  }

  useEffect(() => {
    if (!user) return
    loadProjects().catch(error => toast.error(error instanceof Error ? error.message : 'Unable to load projects.'))
  }, [user])

  useEffect(() => {
    if (!user) return

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
  }, [user])

  // Can only access if authorized
  if (canSee(user?.role ?? '', roles.map(role => role.id))) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don&apos;t have permission to view projects.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isPlanning = (status: ProjectStatus) =>
    status === ProjectStatus.PLANNING || status === ProjectStatus.STARTING

  const isOngoing = (status: ProjectStatus) =>
    status === ProjectStatus.ONGOING || status === ProjectStatus.IN_PROGRESS

  const isCompleted = (status: ProjectStatus) =>
    status === ProjectStatus.COMPLETED || status === ProjectStatus.FINISHED

  const stats = useMemo(() => {
    const total = projects.length
    const planning = projects.filter(p => isPlanning(p.status)).length
    const ongoing = projects.filter(p => isOngoing(p.status)).length
    const completed = projects.filter(p => isCompleted(p.status)).length
    return { total, planning, ongoing, completed }
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'all') return projects
    if (activeFilter === 'planning') return projects.filter(p => isPlanning(p.status))
    if (activeFilter === 'ongoing') return projects.filter(p => isOngoing(p.status))
    return projects.filter(p => isCompleted(p.status))
  }, [projects, activeFilter])

  const getStatusBorderColor = (status: ProjectStatus) => {
    if (isPlanning(status)) return 'border-l-blue-500'
    if (isOngoing(status)) return 'border-l-amber-500'
    if (isCompleted(status)) return 'border-l-emerald-500'
    return 'border-l-muted-foreground'
  }

  const getStatusBadgeClass = (status: ProjectStatus) => {
    if (isPlanning(status)) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20'
    if (isOngoing(status)) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20'
    if (isCompleted(status)) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
    return 'bg-muted text-muted-foreground'
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure to delete the project? This action is irreversible!")) return
    try {
      setIsDeleting(true)
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteProject(supabase, id)
      const deleted = projects.find(project => project.id === id)
      setProjects(current => current.filter(project => project.id !== id))
      toast.success('Project deleted.')
      recordActivityLog('Cancel', `Cancelled & removed project - ${deleted?.title}`, user?.id, user?.name, ip!)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete project.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filterCards: { key: FilterType; label: string; value: number; accent: string }[] = [
    { key: 'all', label: 'Total Projects', value: stats.total, accent: 'border-t-primary' },
    { key: 'planning', label: 'Under-Planning', value: stats.planning, accent: 'border-t-blue-500' },
    { key: 'ongoing', label: 'On-Going Projects', value: stats.ongoing, accent: 'border-t-amber-500' },
    { key: 'completed', label: 'Completed Projects', value: stats.completed, accent: 'border-t-emerald-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage union projects and initiatives</p>
        </div>
        <Button onClick={() => setShowAddProjectModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats + Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterCards.map(card => (
          <button
            key={card.key}
            type="button"
            onClick={() => setActiveFilter(card.key)}
            className={cn(
              'text-left rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'border-t-4',
              card.accent,
              activeFilter === card.key
                ? 'ring-2 ring-primary/30 bg-primary/5'
                : 'hover:bg-muted/40'
            )}
          >
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{card.value}</p>
          </button>
        ))}
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Spinner className="h-5 w-5" />
            <span>Loading projects...</span>
          </div>
        ) : (!isLoading && filteredProjects.length === 0) ? (
          <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center text-muted-foreground">
            {activeFilter === 'all'
              ? 'No projects found'
              : `No ${filterCards.find(c => c.key === activeFilter)?.label.toLowerCase()} found`}
          </div>
        ) : (
          filteredProjects.map(project => (
            <div
              key={project.id}
              className={cn(
                'group flex w-full items-center gap-4 rounded-lg bg-card px-5 py-4 shadow-sm transition-shadow hover:shadow-md',
                'border-l-4 border-y-0 border-r-0',
                getStatusBorderColor(project.status)
              )}
            >
              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="truncate text-base font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    {project.title}
                  </Link>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 capitalize font-medium', getStatusBadgeClass(project.status))}
                  >
                    {project.status?.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </div>

                {project.description && (
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    Started:{' '}
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Open project actions"
                  className={buttonVariants({
                    variant: 'ghost',
                    size: 'icon',
                    className: 'h-8 w-8 shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100',
                  })}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem>
                    <Link href={`/projects/${project.id}`} className="flex flex-wrap cursor-pointer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View project
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      <AddProjectModal
        open={showAddProjectModal}
        onOpenChange={setShowAddProjectModal}
        onSubmit={project => {
          setIsLoading(true)
          const run = async () => {
            try {
              const supabase = getSupabaseBrowserClient()
              if (!supabase || !user) throw new Error('Supabase is not configured.')
              const newProject = await createProject(supabase, {
                ...project,
                branch_id: user.branchId || undefined,
                status: ProjectStatus.PLANNING,
                created_by: user.id,
                start_date: new Date(),
                created_at: new Date(),
              } as Project)
              setProjects(current => [newProject, ...current])
              setShowAddProjectModal(false)
              toast.success(`Project ${newProject.title} created.`)
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Unable to create project.')
            } finally {
              setIsLoading(false)
            }
          }
          void run()
        }}
        isLoading={isLoading}
      />

      <FullScreenLoader isLoading={isDeleting} />
    </div>
  )
}