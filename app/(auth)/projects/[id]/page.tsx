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
import { ArrowLeft, Plus, Upload, Trash2, Users, Calendar } from 'lucide-react'

type Params = Promise<{ id: string }>

export default function ProjectDetailPage({ params }: { params: Params }) {
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'phases' | 'team' | 'resources'>('overview')
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newTeamMember, setNewTeamMember] = useState({ userId: '', role: '' })
  const [newResource, setNewResource] = useState({ name: '', quantity: 1, unit: '', cost: 0 })

  const { id } = React.use(params)

  useEffect(() => {
    if (!id) return

    const projects: Project[] = JSON.parse(localStorage.getItem("projects") || "[]")
    const found = projects.find((p: Project) => p.id === id)

    if (found) {
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
    // In a real app you would upload to a server and get URLs.
    // Here we simulate with object URLs + base64 for localStorage.

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const newFile = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          name: file.name,
          url: ev.target?.result as string,
          uploadedAt: new Date()
        }

        if (type === 'image') {
          saveProject({ ...project, images: [...project.images, newFile] })
        } else {
          saveProject({ ...project, documents: [...project.documents, newFile] })
        }
      }
      reader.readAsDataURL(file)
    })
  }

  if (!project) {
    return <div className="container mx-auto py-8">Project not found</div>
  }

  const statusColors: Record<ProjectStatus, string> = {
    [ProjectStatus.PLANNING]: 'bg-yellow-100 text-yellow-800',
    [ProjectStatus.ONGOING]: 'bg-blue-100 text-blue-800',
    [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800'
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
            {project.status.replace('_', ' ')}
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
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">Images</h3>
                  <label>
                    <Button variant="outline" size="sm">
                      <span>Upload Image</span>
                    </Button>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload('image')} />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.images.map(img => (
                    <div key={img.id} className="border rounded-lg overflow-hidden">
                      <img src={img.url} alt={img.name} className="w-full h-32 object-cover" />
                      <div className="p-2 text-xs truncate">{img.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">Documents</h3>
                  <label>
                    <Button variant="outline" size="sm">
                      <span>Upload Document</span>
                    </Button>
                    <input type="file" multiple className="hidden" onChange={handleFileUpload('document')} />
                  </label>
                </div>
                <div className="space-y-2">
                  {project.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between border p-3 rounded-lg">
                      <span>{doc.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                        View
                      </Button>
                    </div>
                  ))}
                </div>
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
                        <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                        <SelectItem value={ProjectStatus.ONGOING}>Ongoing</SelectItem>
                        <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
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
