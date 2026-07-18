'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, Project, ProjectStatus } from '@/lib/types'
import { Plus, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { AddProjectModal } from '@/components/modals/add-project-modal'

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>(() =>
    JSON.parse(localStorage.getItem('projects') || '[]').filter((p: Project) =>
      user?.role === UserRole.SECRETARY_GENERAL || p.branchId === user?.branchId
    )
  )
  const [showForm, setShowForm] = useState(false)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: ProjectStatus.PLANNING
  })

  // Can only access if authorized
  if (![UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN, UserRole.PROJECT_COORDINATOR].includes(user?.role!)) {
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
    [ProjectStatus.ONGOING]: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
    [ProjectStatus.COMPLETED]: 'bg-green-500/20 text-green-700 dark:text-green-400'
  }

  const handleAddProject = () => {
    if (!formData.title || !formData.description) return

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      branchId: user!.branchId,
      title: formData.title,
      description: formData.description,
      status: formData.status as ProjectStatus,
      phases: [],
      coordinator: "",
      budget: 0.00,
      timeline: "",
      teamMembers: [],
      resources: [],
      images: [],
      documents: [],
      startDate: new Date(),
      createdBy: user!.id,
      createdAt: new Date()
    }

    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    const updated = [...allProjects, newProject]
    localStorage.setItem('projects', JSON.stringify(updated))
    setProjects([...projects, newProject])
    setFormData({ title: '', description: '', status: ProjectStatus.PLANNING })
    setShowForm(false)
  }

  const handleUpdateStatus = (id: string, newStatus: ProjectStatus) => {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    const updated = allProjects.map((p: Project) =>
      p.id === id ? { ...p, status: newStatus } : p
    )
    localStorage.setItem('projects', JSON.stringify(updated))
    setProjects(projects.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }

  const handleDelete = (id: string) => {
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]')
    const updated = allProjects.filter((p: Project) => p.id !== id)
    localStorage.setItem('projects', JSON.stringify(updated))
    setProjects(projects.filter(p => p.id !== id))
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
                        {project.status.replace(/_/g, ' ')}
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
                  <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
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
          try {
            const allProjects = JSON.parse(localStorage.getItem('projects') || '[]')
            const newProject: Project = {
              ...project,
              id: `project_${Date.now()}`,
              startDate: new Date(),
              createdAt: new Date()
            }
            const updated = [...allProjects, newProject]
            localStorage.setItem('projects', JSON.stringify(updated))
            setProjects(p => [...p, newProject])
            setShowAddProjectModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
        branchId={user?.branchId || 'branch_main'}
      />
    </div>
  )
}
