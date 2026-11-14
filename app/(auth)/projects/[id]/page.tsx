'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import {
  Project,
  ProjectStatus,
  ProjectPhase,
  ProjectTeamMember,
  ProjectResource,
} from '@/lib/types'
import { recordActivityLog } from '@/lib/constants'
import { useUserIP } from '@/lib/userUserIp'
import {
  ArrowLeft, Plus,
  Trash2,
  Users,
  Download,
  Loader,
  Save,
  Calendar,
  Package,
  ImageIcon,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  createProjectPhase,
  createProjectResource,
  addProjectTeamMember,
  createProjectFile,
  deleteProjectPhase,
  deleteProjectResource,
  removeProjectTeamMember,
  deleteProjectFile,
  getProjectById,
  getProjectFiles,
  getProjectPhases,
  getProjectResources,
  getProjectTeamMembers,
  updateProject,
  updateProjectPhase,
} from '@/services/project-service'
import type { ProjectFile } from '@/lib/types'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type Params = Promise<{ id: string }>

type PhaseDraft = {
  start_date: string
  end_date: string
  description: string
}

type AvailableUser = {
  id: string
  name: string
  email?: string
}

export default function ProjectDetailPage({ params }: { params: Params }) {
  const { user } = useAuth()
  const { ip } = useUserIP()
  const [project, setProject] = useState<Project | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'phases' | 'team' | 'resources'>('overview')
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newTeamMember, setNewTeamMember] = useState({ userId: '', role: '' })
  const [newResource, setNewResource] = useState({ name: '', quantity: 1, unit: '', cost: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null)
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseDraft>>({})
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])

  const { id } = React.use(params)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const [row, phases, team, resources, files] = await Promise.all([
          getProjectById(supabase, id),
          getProjectPhases(supabase, id),
          getProjectTeamMembers(supabase, id),
          getProjectResources(supabase, id),
          getProjectFiles(supabase, id),
        ])
        if (cancelled) return

        const mappedPhases = phases.map((p: any) => ({
          ...p,
          start_date: new Date(p.start_date),
          end_date: p.end_date ? new Date(p.end_date) : undefined,
        }))

        setProject({
          ...row,
          phases: mappedPhases,
          teamMembers: team as unknown as Project['teamMembers'],
          resources: resources.map(r => ({ ...r, usedDate: r.used_date } as unknown as ProjectResource)),
          images: files
            .filter(f => f.file_kind === 'image')
            .map(f => ({
              id: f.id,
              name: f.name,
              url: f.url,
              size: f.size_bytes,
              uploadedAt: new Date(f.uploaded_at),
            })),
          documents: files
            .filter(f => f.file_kind === 'document')
            .map(f => ({
              id: f.id,
              name: f.name,
              url: f.url,
              size: f.size_bytes,
              uploadedAt: new Date(f.uploaded_at),
            })),
        })

        // Seed local drafts for phase fields that save together
        const drafts: Record<string, PhaseDraft> = {}
        mappedPhases.forEach((p: ProjectPhase) => {
          drafts[p.id] = {
            start_date:
              p.start_date instanceof Date ? p.start_date.toISOString().split('T')[0] : '',
            end_date:
              p.end_date instanceof Date ? p.end_date.toISOString().split('T')[0] : '',
            description: p.description || '',
          }
        })
        setPhaseDrafts(drafts)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load project.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  // Load users for team member select
  // Adjust table/columns to match your schema (profiles / users / members, etc.)
  useEffect(() => {
    let cancelled = false
    const loadUsers = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) return
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name', { ascending: true })
        if (error) throw error
        if (!cancelled) {
          setAvailableUsers(
            (data ?? []).map((u: any) => ({
              id: u.id,
              name: u.name || u.email || u.id,
              email: u.email,
            }))
          )
        }
      } catch (err) {
        console.error('Unable to load users for team select:', err)
      }
    }
    void loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      toast.success(success)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Project action failed.')
    }
  }

  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const updated = await updateProject(supabase, project.id,
        { ...project, status: newStatus })
      setProject(current => (current ? { ...current, ...updated } : current))
    }, 'Project status updated.')
  }

  // ─── Phases ───────────────────────────────────────────────
  const addPhase = async () => {
    if (!project || !newPhaseName.trim()) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const newPhasePayload: ProjectPhase = {
        project_id: project.id,
        name: newPhaseName.trim(),
        description: '',
        start_date: new Date(),
        status: ProjectStatus.PLANNING,
      } as ProjectPhase
      const saved = await createProjectPhase(supabase, newPhasePayload)
      const normalized = {
        ...saved,
        start_date: new Date(saved.start_date),
        end_date: saved.end_date ? new Date(saved.end_date) : undefined,
      }
      setProject(current =>
        current
          ? { ...current, phases: [...(current.phases ?? []), normalized] }
          : current
      )
      setPhaseDrafts(prev => ({
        ...prev,
        [saved.id]: {
          start_date: normalized.start_date.toISOString().split('T')[0],
          end_date: '',
          description: '',
        },
      }))
      setNewPhaseName('')
    }, 'Phase added.')
  }

  const updatePhaseDraft = (phaseId: string, patch: Partial<PhaseDraft>) => {
    setPhaseDrafts(prev => ({
      ...prev,
      [phaseId]: { ...prev[phaseId], ...patch },
    }))
  }

  const isPhaseDirty = (phase: ProjectPhase) => {
    const draft = phaseDrafts[phase.id]
    if (!draft) return false
    const originalStart =
      phase.start_date instanceof Date ? phase.start_date.toISOString().split('T')[0] : ''
    const originalEnd =
      phase.end_date instanceof Date ? phase.end_date.toISOString().split('T')[0] : ''
    return (
      draft.start_date !== originalStart ||
      draft.end_date !== originalEnd ||
      (draft.description || '') !== (phase.description || '')
    )
  }

  const savePhaseDetails = async (phaseId: string) => {
    if (!project) return
    const phase = project.phases?.find(item => item.id === phaseId)
    const draft = phaseDrafts[phaseId]
    if (!phase || !draft) return

    setSavingPhaseId(phaseId)
    try {
      await runAction(async () => {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const payload: ProjectPhase = {
          ...phase,
          start_date: draft.start_date ? new Date(draft.start_date) : phase.start_date,
          end_date: draft.end_date ? new Date(draft.end_date) : undefined,
          description: draft.description,
        }
        const saved = await updateProjectPhase(supabase, phaseId, payload)
        setProject(current =>
          current
            ? {
              ...current,
              phases: current.phases?.map(item =>
                item.id === phaseId
                  ? {
                    ...saved,
                    start_date: new Date(saved.start_date),
                    end_date: saved.end_date ? new Date(saved.end_date) : undefined,
                  }
                  : item
              ),
            }
            : current
        )
      }, 'Phase details saved.')
    } finally {
      setSavingPhaseId(null)
    }
  }

  const updatePhaseStatus = async (phaseId: string, status: ProjectStatus) => {
    if (!project) return
    const phase = project.phases?.find(item => item.id === phaseId)
    if (!phase) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const payload: ProjectPhase = { ...phase, status }
      const saved = await updateProjectPhase(supabase, phaseId, payload)
      setProject(current =>
        current
          ? {
            ...current,
            phases: current.phases?.map(item =>
              item.id === phaseId
                ? {
                  ...saved,
                  start_date: new Date(saved.start_date),
                  end_date: saved.end_date ? new Date(saved.end_date) : undefined,
                }
                : item
            ),
          }
          : current
      )
    }, 'Phase status updated.')
  }

  const deletePhase = async (phaseId: string) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteProjectPhase(supabase, phaseId)
      setProject(current =>
        current
          ? { ...current, phases: current.phases?.filter(p => p.id !== phaseId) }
          : current
      )
      setPhaseDrafts(prev => {
        const next = { ...prev }
        delete next[phaseId]
        return next
      })
    }, 'Phase deleted.')
  }

  // ─── Team ─────────────────────────────────────────────────
  const alreadyAssignedIds = useMemo(
    () => new Set((project?.teamMembers ?? []).map(m => m.user_id)),
    [project?.teamMembers]
  )

  const selectableUsers = useMemo(
    () => availableUsers.filter(u => !alreadyAssignedIds.has(u.id)),
    [availableUsers, alreadyAssignedIds]
  )

  const getUserLabel = (userId: string) => {
    const found = availableUsers.find(u => u.id === userId)
    return found ? found.name : userId
  }

  const addTeamMember = async () => {
    if (!project || !newTeamMember.userId || !newTeamMember.role.trim()) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const member = await addProjectTeamMember(supabase, {
        project_id: project.id,
        user_id: newTeamMember.userId,
        role: newTeamMember.role.trim(),
        assigned_date: new Date().toISOString(),
      } as ProjectTeamMember)
      setProject(current =>
        current
          ? { ...current, teamMembers: [...(current.teamMembers ?? []), member] }
          : current
      )
      recordActivityLog(
        'Assign',
        `Affiliated member - ${member.role} to project ${project.title}`,
        user?.id,
        user?.name,
        ip!
      )
      setNewTeamMember({ userId: '', role: '' })
    }, 'Team member added.')
  }

  const removeTeamMember = async (memberId: string) => {
    if (!project) return
    const member = project.teamMembers?.find(m => m.id === memberId)?.role
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await removeProjectTeamMember(supabase, memberId)
      setProject(current =>
        current
          ? {
            ...current,
            teamMembers: current.teamMembers?.filter(m => m.id !== memberId),
          }
          : current
      )
      recordActivityLog(
        'Remove',
        `Removed member ${member} from project ${project.title}`,
        user?.id,
        user?.name,
        ip!
      )
    }, 'Team member removed.')
  }

  // ─── Resources ────────────────────────────────────────────
  const addResource = async () => {
    if (!project || !newResource.name) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const saved = await createProjectResource(supabase, {
        id: '',
        project_id: project.id,
        ...newResource,
        unit: newResource.unit || 'unit',
        used_date: new Date(),
      })
      setProject(current =>
        current
          ? {
            ...current,
            resources: [
              ...(current.resources ?? []),
              { ...saved, usedDate: saved.used_date } as unknown as ProjectResource,
            ],
          }
          : current
      )
      setNewResource({ name: '', quantity: 1, unit: '', cost: 0 })
    }, 'Resource added.')
  }

  const removeResource = async (resId: string) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      await deleteProjectResource(supabase, resId)
      setProject(current =>
        current
          ? { ...current, resources: current.resources?.filter(r => r.id !== resId) }
          : current
      )
    }, 'Resource deleted.')
  }

  // ─── Files ────────────────────────────────────────────────
  const handleFileUpload = (type: 'image' | 'document') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return

    const files = Array.from(e.target.files)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      for (const [index, file] of files.entries()) {
        const path = `${project.id}/${crypto.randomUUID()}-${file.name}`
        const { error } = await supabase.storage.from('projects').upload(path, file)
        if (error) throw error
        const { data } = supabase.storage.from('projects').getPublicUrl(path)
        const saved = await createProjectFile(supabase, {
          project_id: project.id,
          file_kind: type,
          name: file.name,
          url: data.publicUrl,
          size_bytes: file.size,
        } as ProjectFile)
        const normalized = {
          id: saved.id,
          name: saved.name,
          url: saved.url,
          size: saved.size_bytes,
          uploadedAt: saved.uploaded_at,
        }
        setProject(current =>
          current
            ? {
              ...current,
              [type === 'image' ? 'images' : 'documents']: [
                ...(current[type === 'image' ? 'images' : 'documents'] ?? []),
                normalized,
              ],
            }
            : current
        )
        setUploadProgress(Math.round(((index + 1) / files.length) * 100))
      }
      toast.success('Files uploaded.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload files.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
    e.target.value = ''
  }

  const handleDeleteFile = async (type: 'image' | 'document', fileId: string) => {
    if (!project) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) throw new Error('Supabase is not configured.')
      const file = await supabase.from('project_files').select('url').eq('id', fileId).single()
      if (file.error) throw file.error
      const path = file.data.url.split('/projects/')[1]
      if (path) await supabase.storage.from('projects').remove([decodeURIComponent(path)])
      await deleteProjectFile(supabase, fileId)
      setProject(current =>
        current
          ? {
            ...current,
            [type === 'image' ? 'images' : 'documents']: current[
              type === 'image' ? 'images' : 'documents'
            ]?.filter(item => item.id !== fileId),
          }
          : current
      )
    }, 'File deleted.')
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Spinner className="h-5 w-5" />
        <span>Loading project…</span>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto max-w-5xl py-12 text-center">
        <p className="text-lg text-muted-foreground">Project not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    )
  }

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.STARTING]: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    [ProjectStatus.PLANNING]: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
    [ProjectStatus.ONGOING]: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    [ProjectStatus.IN_PROGRESS]: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
    [ProjectStatus.COMPLETED]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    [ProjectStatus.FINISHED]: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'phases' as const, label: 'Phases' },
    { key: 'team' as const, label: 'Team' },
    { key: 'resources' as const, label: 'Resources' },
  ]

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8 px-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-sm text-muted-foreground">
            Coordinator: {project.coordinator || '—'} · Branch: {project.branch_id || '—'}
          </p>
        </div>
        <Badge variant="outline" className={cn('w-fit capitalize', statusColors[project.status])}>
          {project.status?.replace(/_/g, ' ').toLowerCase()}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b pb-px">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSection(tab.key)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              activeSection === tab.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {activeSection === tab.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Budget
                </p>
                <p className="mt-1 text-2xl font-bold">
                  E{project?.budget?.toLocaleString() ?? '0'}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <p className="mt-1 text-xl font-semibold">{project.timeline || '—'}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {[ProjectStatus.PLANNING, ProjectStatus.ONGOING, ProjectStatus.COMPLETED].map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={project.status === s ? 'default' : 'outline'}
                      onClick={() => handleStatusUpdate(s)}
                      className="capitalize"
                    >
                      {s.replace(/_/g, ' ').toLowerCase()}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Images */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                Images ({(project.images ?? []).length})
              </CardTitle>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => document.getElementById('project-image')?.click()}
                >
                  {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
                <input
                  id="project-image"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload('image')}
                  disabled={isUploading}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isUploading && uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {(project.images ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No images uploaded yet</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {(project.images ?? []).map(img => (
                    <div
                      key={img.id}
                      className="group relative overflow-hidden rounded-lg border bg-muted/30"
                    >
                      <img src={img.url} alt={img.name} className="h-32 w-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 transition group-hover:opacity-100"
                        onClick={() => handleDeleteFile('image', img.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="p-2">
                        <p className="truncate text-xs font-medium" title={img.name}>
                          {img.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(img.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Documents ({(project.documents ?? []).length})
              </CardTitle>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => document.getElementById('project-doc')?.click()}
                >
                  {isUploading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
                <input
                  id="project-doc"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload('document')}
                  disabled={isUploading}
                />
              </div>
            </CardHeader>
            <CardContent>
              {(project.documents ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {(project.documents ?? []).map(doc => (
                    <div
                      key={doc.id}
                      className="group flex items-center justify-between rounded-lg border px-4 py-3 transition hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={doc.name}>
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.size / 1024).toFixed(0)} KB ·{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-3 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteFile('document', doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── PHASES ─── */}
      {activeSection === 'phases' && (
        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row">
              <Input
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
                placeholder="New phase name"
                className="flex-1"
                onKeyDown={e => e.key === 'Enter' && addPhase()}
              />
              <Button onClick={addPhase} disabled={!newPhaseName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Phase
              </Button>
            </CardContent>
          </Card>

          {(project.phases ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              No phases yet. Add one above to get started.
            </div>
          ) : (
            (project.phases ?? []).map(phase => {
              const draft = phaseDrafts[phase.id] ?? {
                start_date: '',
                end_date: '',
                description: '',
              }
              const dirty = isPhaseDirty(phase)

              return (
                <Card key={phase.id} className="border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-lg">{phase.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        Phase details
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deletePhase(phase.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Status — saves immediately */}
                    <div className="space-y-2">
                      <Label>Phase Status</Label>
                      <Select
                        value={phase.status}
                        onValueChange={value => {
                          if (value) updatePhaseStatus(phase.id, value as ProjectStatus)
                        }}
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ProjectStatus.STARTING}>Starting</SelectItem>
                          <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                          <SelectItem value={ProjectStatus.FINISHED}>Finished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dates + description — draft, save together */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`start-${phase.id}`}>Start Date</Label>
                        <Input
                          id={`start-${phase.id}`}
                          type="date"
                          value={draft.start_date}
                          onChange={e =>
                            updatePhaseDraft(phase.id, { start_date: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`end-${phase.id}`}>End Date</Label>
                        <Input
                          id={`end-${phase.id}`}
                          type="date"
                          value={draft.end_date}
                          onChange={e =>
                            updatePhaseDraft(phase.id, { end_date: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`desc-${phase.id}`}>Description / Notes</Label>
                      <Textarea
                        id={`desc-${phase.id}`}
                        value={draft.description}
                        onChange={e =>
                          updatePhaseDraft(phase.id, { description: e.target.value })
                        }
                        placeholder="Phase details, progress notes…"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t pt-4">
                      {dirty && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Unsaved changes
                        </span>
                      )}
                      <Button
                        onClick={() => savePhaseDetails(phase.id)}
                        disabled={!dirty || savingPhaseId === phase.id}
                        className="gap-2"
                      >
                        {savingPhaseId === phase.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* ─── TEAM ─── */}
      {activeSection === 'team' && (
        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-muted-foreground" />
                Add team member
              </CardTitle>
              <CardDescription>Select a member from the list and assign a role.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={newTeamMember.userId || undefined}
                  onValueChange={value =>
                    setNewTeamMember(prev => ({ ...prev, userId: value ?? '' }))
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select member…" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableUsers.length === 0 ? (
                      <SelectItem value="__none" disabled>
                        No available members
                      </SelectItem>
                    ) : (
                      selectableUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                          {u.email ? ` (${u.email})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Role (e.g. Coordinator, Engineer)"
                  value={newTeamMember.role}
                  onChange={e =>
                    setNewTeamMember(prev => ({ ...prev, role: e.target.value }))
                  }
                  className="flex-1"
                />

                <Button
                  onClick={addTeamMember}
                  disabled={!newTeamMember.userId || !newTeamMember.role.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Current members ({(project.teamMembers ?? []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(project.teamMembers ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No team members assigned yet
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {(project.teamMembers ?? []).map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {getUserLabel(member.user_id!)}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── RESOURCES ─── */}
      {activeSection === 'resources' && (
        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" />
                Add resource
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Input
                  placeholder="Resource name"
                  value={newResource.name}
                  onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                  className="col-span-2 md:col-span-1"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={newResource.quantity}
                  onChange={e =>
                    setNewResource({ ...newResource, quantity: Number(e.target.value) })
                  }
                />
                <Input
                  placeholder="Unit"
                  value={newResource.unit}
                  onChange={e => setNewResource({ ...newResource, unit: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Cost"
                  value={newResource.cost}
                  onChange={e =>
                    setNewResource({ ...newResource, cost: Number(e.target.value) })
                  }
                />
                <Button onClick={addResource} disabled={!newResource.name.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Resources ({(project.resources ?? []).length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(project.resources ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No resources recorded yet
                </p>
              ) : (
                <div className="divide-y rounded-lg border">
                  {(project.resources ?? []).map(res => (
                    <div
                      key={res.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{res.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {res.quantity} {res.unit} · E{res.cost}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeResource(res.id)}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}