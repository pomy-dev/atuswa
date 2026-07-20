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
import { ArrowLeft, Plus, Trash2, Users, Download, Loader } from 'lucide-react'

type Params = Promise<{ id: string }>

export default function ProjectDetailPage({ params }: { params: Params }) {
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'phases' | 'team' | 'resources'>('overview')
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newTeamMember, setNewTeamMember] = useState({ userId: '', role: '' })
  const [newResource, setNewResource] = useState({ name: '', quantity: 1, unit: '', cost: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const { id } = React.use(params)

  useEffect(() => {
    if (!id) return

    const projects: Project[] = JSON.parse(localStorage.getItem("projects") || "[]")
    const found = projects.find((p: Project) => p.id === id)

    if (found) {
      found.phases = found.phases.map((phase) => ({
        ...phase,
        status: phase.status ?? ProjectStatus.STARTING,
      }))

      setProject(found)
    }
  }, [id])

  const saveProject = (updatedProject: Project) => {
    const projects: Project[] = JSON.parse(localStorage.getItem("projects") || "[]")
    const updatedProjects = projects.map((p: Project) =>
      p.id === updatedProject.id ? updatedProject : p
    )
    localStorage.setItem('projects', JSON.stringify(updatedProjects))
    setProject(updatedProject)
  }

  const handleStatusUpdate = (newStatus: ProjectStatus) => {
    if (!project) return
    saveProject({ ...project, status: newStatus })
  }

  // Phases
  const addPhase = () => {
    if (!project || !newPhaseName.trim()) return

    const newPhase: ProjectPhase = {
      id: Date.now().toString(),
      name: newPhaseName.trim(),
      description: '',
      startDate: new Date(),
      status: ProjectStatus.PLANNING
    }

    saveProject({
      ...project,
      phases: [...project.phases, newPhase]
    })
    setNewPhaseName('')
  }

  const updatePhase = (phaseId: string, updates: Partial<ProjectPhase>) => {
    if (!project) return
    const updatedPhases = project.phases.map(phase =>
      phase.id === phaseId ? { ...phase, ...updates } : phase
    )
    saveProject({ ...project, phases: updatedPhases })
  }

  const deletePhase = (phaseId: string) => {
    if (!project) return
    saveProject({
      ...project,
      phases: project.phases.filter(p => p.id !== phaseId)
    })
  }

  // Team Members
  const addTeamMember = () => {
    if (!project || !newTeamMember.userId || !newTeamMember.role) return

    const member: ProjectTeamMember = {
      id: Date.now().toString(),
      userId: newTeamMember.userId,
      role: newTeamMember.role,
      assignedDate: new Date()
    }

    saveProject({
      ...project,
      teamMembers: [...project.teamMembers, member]
    })
    setNewTeamMember({ userId: '', role: '' })
  }

  const removeTeamMember = (memberId: string) => {
    if (!project) return
    saveProject({
      ...project,
      teamMembers: project.teamMembers.filter(m => m.id !== memberId)
    })
  }

  // Resources
  const addResource = () => {
    if (!project || !newResource.name) return

    const resource: ProjectResource = {
      id: Date.now().toString(),
      name: newResource.name,
      quantity: newResource.quantity,
      unit: newResource.unit || 'unit',
      cost: newResource.cost,
      usedDate: new Date()
    }

    saveProject({
      ...project,
      resources: [...project.resources, resource]
    })
    setNewResource({ name: '', quantity: 1, unit: '', cost: 0 })
  }

  const removeResource = (resId: string) => {
    if (!project) return
    saveProject({
      ...project,
      resources: project.resources.filter(r => r.id !== resId)
    })
  }

  // File upload (project level - images & documents)
  const handleFileUpload = (type: 'image' | 'document') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return

    const files = Array.from(e.target.files)
    setIsUploading(true)
    setUploadProgress(0)

    let completed = 0
    const totalFiles = files.length

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const newFile = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          url: ev.target?.result as string,
          uploadedAt: new Date(),
          size: file.size
        }

        if (type === 'image') {
          saveProject({ ...project, images: [...project.images, newFile] })
        } else {
          saveProject({ ...project, documents: [...project.documents, newFile] })
        }

        completed++
        setUploadProgress(Math.round((completed / totalFiles) * 100))

        if (completed === totalFiles) {
          setIsUploading(false)
          setUploadProgress(0)
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ''
  }

  // Delete file
  const handleDeleteFile = (type: 'image' | 'document', fileId: string) => {
    if (!project) return

    if (type === 'image') {
      saveProject({
        ...project,
        images: project.images.filter(img => img.id !== fileId)
      })
    } else {
      saveProject({
        ...project,
        documents: project.documents.filter(doc => doc.id !== fileId)
      })
    }
  }

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
              Coordinator: {project.coordinator} • Branch: {project.branchId}
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
                  <h3 className="font-semibold">Images ({project.images.length})</h3>
                  <label>
                    <Button variant="outline" size="sm" disabled={isUploading}>
                      {isUploading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>Upload Image</span>
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload('image')} disabled={isUploading} />
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

                {project.images.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No images uploaded yet</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {project.images.map(img => (
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
                  <h3 className="font-semibold">Documents ({project.documents.length})</h3>
                  <label>
                    <Button variant="outline" size="sm" disabled={isUploading}>
                      {isUploading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                      <span>Upload Document</span>
                    </Button>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload('document')} disabled={isUploading} />
                  </label>
                </div>

                {project.documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No documents uploaded yet</p>
                ) : (
                  <div className="space-y-2">
                    {project.documents.map(doc => (
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

          {project.phases.map(phase => {
            // Safe date conversion
            const startDateStr = phase.startDate
              ? (phase.startDate instanceof Date
                ? phase.startDate.toISOString().split("T")[0]
                : typeof phase.startDate === "string"
                  ? phase.startDate?.split("T")[0]
                  : "")
              : "";

            const endDateStr = phase.endDate
              ? (phase.endDate instanceof Date
                ? phase.endDate.toISOString().split("T")[0]
                : typeof phase.endDate === "string"
                  ? phase.endDate?.split("T")[0]
                  : undefined)
              : undefined;

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
                          startDate: e.target.value ? new Date(e.target.value) : new Date()
                        })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDateStr}
                        onChange={(e) => updatePhase(phase.id, {
                          endDate: e.target.value ? new Date(e.target.value) : undefined
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
              {project.teamMembers.map(member => (
                <div key={member.id} className="flex justify-between items-center border p-4 rounded-lg">
                  <div>
                    <p><strong>User ID:</strong> {member.userId}</p>
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
              {project.resources.map(res => (
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
