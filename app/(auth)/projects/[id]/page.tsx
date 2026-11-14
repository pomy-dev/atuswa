'use client'

import React, { useState, useEffect } from 'react'
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
  ProjectResource
} from '@/lib/types'
import { recordActivityLog } from '@/lib/constants'
import { useUserIP } from '@/lib/userUserIp'
import { ArrowLeft, Plus, Trash2, Users, Download, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { createProjectPhase, createProjectResource, addProjectTeamMember, createProjectFile, deleteProjectPhase, deleteProjectResource, removeProjectTeamMember, deleteProjectFile, getProjectById, getProjectFiles, getProjectPhases, getProjectResources, getProjectTeamMembers, updateProject, updateProjectPhase } from '@/services/project-service'
import type { ProjectFile } from '@/lib/types'

type Params = Promise<{ id: string }>

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

  const { id } = React.use(params)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    const load = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase is not configured.')
        const [row, phases, team, resources, files] = await Promise.all([
          getProjectById(supabase, id), getProjectPhases(supabase, id), getProjectTeamMembers(supabase, id),
          getProjectResources(supabase, id), getProjectFiles(supabase, id),
        ])
        if (cancelled) return
        setProject({
          ...row,
          phases: phases.map((p: any) => ({
            ...p,
            start_date: new Date(p.start_date),
            end_date: p.end_date ? new Date(p.end_date) : undefined
          })),
          teamMembers: team as unknown as Project['teamMembers'],
          resources: resources.map(r => ({ ...r, usedDate: r.used_date } as unknown as ProjectResource)),
          images: files.filter(f => f.file_kind === 'image').map(f => ({ id: f.id, name: f.name, url: f.url, size: f.size_bytes, uploadedAt: new Date(f.uploaded_at) })),
          documents: files.filter(f => f.file_kind === 'document').map(f => ({ id: f.id, name: f.name, url: f.url, size: f.size_bytes, uploadedAt: new Date(f.uploaded_at) })),
        })
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to load project.') }
      finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [id])

  const runAction = async (action: () => Promise<void>, success: string) => {
    try { await action(); toast.success(success) }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Project action failed.') }
  }

  const handleStatusUpdate = async (newStatus: ProjectStatus) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      const updated = await updateProject(supabase, project.id, { ...project, status: newStatus })
      setProject(current => current ? { ...current, ...updated } : current)
    }, 'Project status updated.')
  }

  // Phases
  const addPhase = async () => {
    if (!project || !newPhaseName.trim()) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      const newPhasePayload: ProjectPhase = {
        project_id: project.id,
        name: newPhaseName.trim(),
        description: '',
        start_date: new Date(),
        status: ProjectStatus.PLANNING,
      } as ProjectPhase;
      const saved = await createProjectPhase(supabase, newPhasePayload);
      setProject(current => current ? {
        ...current,
        phases: [...(current.phases ?? []), {
          ...saved,
          start_date: new Date(saved.start_date),
          end_date: saved.end_date ? new Date(saved.end_date) : undefined
        }]
      } : current);
      setNewPhaseName('')
    }, 'Phase added.')
  }

  const updatePhase = async (phaseId: string, updates: Partial<ProjectPhase>) => {
    if (!project) return
    const phase = project.phases?.find(item => item.id === phaseId); if (!phase) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      const payload: ProjectPhase = { ...phase, ...updates, start_date: updates.start_date ?? phase.start_date, end_date: updates.end_date ?? phase.end_date };
      const saved = await updateProjectPhase(supabase, phaseId, payload)
      setProject(current => current ? { ...current, phases: current.phases?.map(item => item.id === phaseId ? { ...saved, startDate: saved.start_date, endDate: saved.end_date } as unknown as ProjectPhase : item) } : current)
    }, 'Phase updated.')
  }

  const deletePhase = async (phaseId: string) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');
      await deleteProjectPhase(supabase, phaseId);
      setProject(current => current ? {
        ...current,
        phases: current.phases?.filter(p => p.id !== phaseId)
      }
        : current)
    }, 'Phase deleted.')
  }

  // Team Members
  const addTeamMember = async () => {
    if (!project || !newTeamMember.userId || !newTeamMember.role) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      const member = await addProjectTeamMember(supabase, { project_id: project.id, user_id: newTeamMember.userId, role: newTeamMember.role, assigned_date: new Date().toISOString() } as ProjectTeamMember)
      setProject(current => current ? { ...current, teamMembers: [...(current.teamMembers ?? []), member] } : current)
      recordActivityLog('Assign', `Affiliated member - ${member.role} to project ${project.title}`, user?.id, user?.name, ip!)
      setNewTeamMember({ userId: '', role: '' })
    }, 'Team member added.')
  }

  const removeTeamMember = async (memberId: string) => {
    if (!project) return
    const member = project.teamMembers?.find(m => m.id === memberId)?.role
    await runAction(async () => { const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.'); await removeProjectTeamMember(supabase, memberId); setProject(current => current ? { ...current, teamMembers: current.teamMembers?.filter(m => m.id !== memberId) } : current); recordActivityLog('Remove', `Removed member ${member} from project ${project.title}`, user?.id, user?.name, ip!) }, 'Team member removed.')
  }

  // Resources
  const addResource = async () => {
    if (!project || !newResource.name) return

    await runAction(async () => {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      const saved = await createProjectResource(supabase, { id: '', project_id: project.id, ...newResource, unit: newResource.unit || 'unit', used_date: new Date() })
      setProject(current => current ? { ...current, resources: [...(current.resources ?? []), { ...saved, usedDate: saved.used_date } as unknown as ProjectResource] } : current)
      setNewResource({ name: '', quantity: 1, unit: '', cost: 0 })
    }, 'Resource added.')
  }

  const removeResource = async (resId: string) => {
    if (!project) return
    await runAction(async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error('Supabase is not configured.');
      await deleteProjectResource(supabase, resId);
      setProject(current => current ? {
        ...current,
        resources: current.resources?.filter(r => r.id !== resId)
      }
        : current)
    }, 'Resource deleted.')
  }

  // File upload (project level - images & documents)
  const handleFileUpload = (type: 'image' | 'document') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return

    const files = Array.from(e.target.files)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.')
      for (const [index, file] of files.entries()) {
        const path = `${project.id}/${crypto.randomUUID()}-${file.name}`
        const { error } = await supabase.storage.from('project-files').upload(path, file)
        if (error) throw error
        const { data } = supabase.storage.from('project-files').getPublicUrl(path)
        const saved = await createProjectFile(supabase, { project_id: project.id, file_kind: type, name: file.name, url: data.publicUrl, size_bytes: file.size } as ProjectFile)
        const normalized = { id: saved.id, name: saved.name, url: saved.url, size: saved.size_bytes, uploadedAt: saved.uploaded_at }
        setProject(current => current ? { ...current, [type === 'image' ? 'images' : 'documents']: [...(current[type === 'image' ? 'images' : 'documents'] ?? []), normalized] } : current)
        setUploadProgress(Math.round(((index + 1) / files.length) * 100))
      }
      toast.success('Files uploaded.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to upload files.') }
    finally { setIsUploading(false); setUploadProgress(0) }
    e.target.value = ''
  }

  // Delete file
  const handleDeleteFile = async (type: 'image' | 'document', fileId: string) => {
    if (!project) return

    await runAction(async () => { const supabase = getSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase is not configured.'); const file = await supabase.from('project_files').select('url').eq('id', fileId).single(); if (file.error) throw file.error; const path = file.data.url.split('/project-files/')[1]; if (path) await supabase.storage.from('project-files').remove([decodeURIComponent(path)]); await deleteProjectFile(supabase, fileId); setProject(current => current ? { ...current, [type === 'image' ? 'images' : 'documents']: current[type === 'image' ? 'images' : 'documents']?.filter(item => item.id !== fileId) } : current) }, 'File deleted.')
  }

  if (loading) return <div className="container mx-auto py-8">Loading project…</div>
  if (!project) {
    return <div className="container mx-auto py-8">Project not found</div>
  }

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.STARTING]: 'bg-yellow-100 text-yellow-800',
    [ProjectStatus.PLANNING]: 'bg-yellow-100 text-yellow-800',
    [ProjectStatus.ONGOING]: 'bg-blue-100 text-blue-800',
    [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [ProjectStatus.FINISHED]: 'bg-green-100 text-green-800',
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Link href="/projects" className="flex items-center gap-2 text-primary mb-6 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </Link>

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">{project.title}</CardTitle>
            <CardDescription className="mt-2">
              Coordinator: {project.coordinator} • Branch: {project.branch_id}
            </CardDescription>
          </div>
          <Badge className={statusColors[project.status]}>
            {project.status?.replace('_', ' ')}
          </Badge>
        </CardHeader>
      </Card>

      {/* Simple Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b pb-2">
        {(['overview', 'phases', 'team', 'resources'] as const).map((sec) => (
          <Button
            key={sec}
            variant={activeSection === sec ? 'default' : 'outline'}
            onClick={() => setActiveSection(sec)}
            className="capitalize"
          >
            {sec}
          </Button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <Card>
          <CardContent className="pt-6 space-y-8">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-3xl font-bold">E{project?.budget?.toLocaleString()}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="text-xl font-semibold">{project.timeline}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {[ProjectStatus.PLANNING, ProjectStatus.ONGOING, ProjectStatus.COMPLETED].map(s => (
                    <Button key={s} size="sm" variant={project.status === s ? "default" : "outline"} onClick={() => handleStatusUpdate(s)}>
                      {s.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </div>

            {/* Project Files */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Images ({(project.images ?? []).length})</h3>
                  <label>
                    <Button variant="outline" onClick={() => document.getElementById('project-image')?.click()} size="sm" disabled={isUploading}>
                      {isUploading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>Upload Image</span>
                    </Button>
                    <input id='project-image' type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload('image')} disabled={isUploading} />
                  </label>
                </div>

                {isUploading && uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {(project.images ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No images uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(project.images ?? []).map(img => (
                      <div key={img.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition group">
                        <div className="relative">
                          <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition h-6 w-6"
                            onClick={() => handleDeleteFile('image', img.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="p-2">
                          <p className="text-xs truncate font-medium" title={img.name}>{img.name}</p>
                          <p className="text-xs text-muted-foreground">{(img.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Documents ({(project.documents ?? []).length})</h3>
                  <label>
                    <Button onClick={() => document.getElementById('project-doc')?.click()} variant="outline" size="sm" disabled={isUploading}>
                      {isUploading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>Upload Document</span>
                    </Button>
                    <input id='project-doc' type="file" multiple className="hidden" onChange={handleFileUpload('document')} disabled={isUploading} />
                  </label>
                </div>

                {(project.documents ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {(project.documents ?? []).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between border p-4 rounded-lg hover:bg-muted/50 transition group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" title={doc.name}>{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{(doc.size / 1024).toFixed(0)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button variant="outline" size="sm" onClick={() => window.open(doc.url, '_blank')} className="gap-2">
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">Download</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteFile('document', doc.id)}
                            className="opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PHASES */}
      {activeSection === 'phases' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <Input
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder="New phase name"
            />
            <Button onClick={addPhase}>
              <Plus className="mr-2 h-4 w-4" /> Add Phase
            </Button>
          </div>

          {(project.phases ?? []).map(phase => {
            // Safe date conversion
            const startDateStr = phase.start_date instanceof Date
              ? phase.start_date.toISOString().split("T")[0]
              : "";

            const endDateStr = phase.end_date instanceof Date
              ? phase.end_date.toISOString().split("T")[0]
              : "";

            return (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{phase.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deletePhase(phase.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div>
                    <Label>Phase Status</Label>
                    <Select
                      value={phase.status}
                      onValueChange={(value) => {
                        if (value) updatePhase(phase.id, { status: value as ProjectStatus })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ProjectStatus.STARTING}>Starting</SelectItem>
                        <SelectItem value={ProjectStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={ProjectStatus.FINISHED}>Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDateStr}
                        onChange={(e) => updatePhase(phase.id, {
                          start_date: e.target.value ? new Date(e.target.value) : new Date()
                        })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => updatePhase(phase.id, {
                          end_date: e.target.value ? new Date(e.target.value) : undefined
                        })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label>Description / Notes</Label>
                    <Textarea
                      value={phase.description || ''}
                      onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                      placeholder="Phase details, progress notes..."
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* TEAM */}
      {activeSection === 'team' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-6">
              <Input
                placeholder="User ID"
                value={newTeamMember.userId}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, userId: e.target.value })}
              />
              <Input
                placeholder="Role (e.g. Coordinator, Engineer)"
                value={newTeamMember.role}
                onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
              />
              <Button onClick={addTeamMember}>Add Member</Button>
            </div>

            <div className="space-y-3">
              {(project.teamMembers ?? []).map(member => (
                <div key={member.id} className="flex justify-between items-center border p-4 rounded-lg">
                  <div>
                    <p><strong>User ID:</strong> {member.user_id}</p>
                    <p><strong>Role:</strong> {member.role}</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeTeamMember(member.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RESOURCES */}
      {activeSection === 'resources' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Input
                placeholder="Resource name"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Qty"
                value={newResource.quantity}
                onChange={(e) => setNewResource({ ...newResource, quantity: Number(e.target.value) })}
              />
              <Input
                placeholder="Unit"
                value={newResource.unit}
                onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Cost"
                  value={newResource.cost}
                  onChange={(e) => setNewResource({ ...newResource, cost: Number(e.target.value) })}
                />
                <Button onClick={addResource}>Add</Button>
              </div>
            </div>

            <div className="space-y-3">
              {(project.resources ?? []).map(res => (
                <div key={res.id} className="border p-4 rounded-lg flex justify-between">
                  <div>
                    <strong>{res.name}</strong> — {res.quantity} {res.unit} (E{res.cost})
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => removeResource(res.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

