'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { Project, ProjectStatus, Role, Permission } from '@/lib/types'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { canSee, recordActivityLog } from '@/lib/constants'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getAllRoles, getAllPermissions } from '@/services/auth-services'
import { AddProjectModal } from '@/components/modals/add-project-modal'
import { useUserIP } from '@/lib/userUserIp'
import { toast } from 'sonner'
import { createProject, deleteProject, getAllProjects, updateProject } from '@/services/project-service'

export default function ProjectsPage() {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: ProjectStatus.PLANNING
  })

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])

  const loadProjects = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) throw new Error('Supabase is not configured.')
    const rows = await getAllProjects(supabase)
    setProjects(rows.filter(project => user?.role === 'sg' || project.branch_id === user?.branchId))
  }

  useEffect(() => {
    if (!user) return
    loadProjects().catch(error => toast.error(error instanceof Error ? error.message : 'Unable to load projects.'))
  }, [user])

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

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [ProjectStatus.STARTING]: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    [ProjectStatus.ONGOING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [ProjectStatus.IN_PROGRESS]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [ProjectStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400',
    [ProjectStatus.FINISHED]: 'bg-green-500/20 text-green-700 dark:text-green-400',
  }

  const handleAddProject = async () => {
    if (!formData.title || !formData.description || !user) return
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const newProject = await createProject(supabase, {
        title: formData.title, description: formData.description, status: formData.status,
        branch_id: user.branchId, coordinator: '', budget: 0, timeline: '', start_date: new Date(),
        created_by: user.id, created_at: new Date(),
      } as Project)
      setProjects(current => [newProject, ...current])
      toast.success('Project created.')
    setFormData({ title: '', description: '', status: ProjectStatus.PLANNING })
    setShowForm(false)
      recordActivityLog('Initialized', `Initialized project - ${newProject.title}`, user.id, user.name, ip!)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create project.') }
  }

  const handleUpdateStatus = async (id: string, newStatus: ProjectStatus) => {
    const project = projects.find(item => item.id === id)
    if (!project) return
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const updated = await updateProject(supabase, id, { ...project, status: newStatus })
      setProjects(current => current.map(item => item.id === id ? updated : item))
      toast.success('Project status updated.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update project status.') }
  }

  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteProject(supabase, id)
      const deleted = projects.find(project => project.id === id)
      setProjects(current => current.filter(project => project.id !== id))
      toast.success('Project deleted.')
      recordActivityLog('Cancel', `Cancelled & removed project - ${deleted?.title}`, user?.id, user?.name, ip!)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to delete project.') }
  }

  const statusOptions = [
    ProjectStatus.PLANNING,
    ProjectStatus.ONGOING,
    ProjectStatus.COMPLETED,
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage union projects and initiatives</p>
        </div>
        <Button onClick={() => setShowAddProjectModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                placeholder="e.g., Skills Training Initiative"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Project description and objectives"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddProject}>Create Project</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No projects found
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/projects/${project.id}`} className="text-lg font-semibold text-primary hover:underline">
                        {project.title}
                      </Link>
                      <Badge className={statusColors[project.status]}>
                        {project.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Started: {new Date(project?.start_date!).toLocaleDateString()}</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Update Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(status => (
                      <Button
                        key={status}
                        variant={project.status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateStatus(project.id, status)}
                      >
                        {status.replace(/_/g, ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AddProjectModal
        open={showAddProjectModal}
        onOpenChange={setShowAddProjectModal}
        onSubmit={(project) => {
          setIsLoading(true)
          const run = async () => {
            try {
              const supabase = getSupabaseBrowserClient()
              if (!supabase || !user) throw new Error('Supabase is not configured.')
              const newProject = await createProject(supabase, { ...project, branch_id: user.branchId, created_by: user.id, start_date: new Date(), created_at: new Date() } as Project)
              setProjects(current => [newProject, ...current])
              setShowAddProjectModal(false)
              toast.success('Project created.')
            } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create project.') }
            finally { setIsLoading(false) }
          }
          void run()
        }}
        isLoading={isLoading}
        branchId={user?.branchId || 'branch_main'}
      />
    </div>
  )
}
