'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Project, ProjectStatus } from '@/lib/types'

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (project: Omit<Project, 'id' | 'createdAt'>) => void
  isLoading?: boolean
  branchId: string
}

export function AddProjectModal({ open, onOpenChange, onSubmit, isLoading, branchId }: AddProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coordinator: '',
    budget: '',
    timeline: '',
    status: 'planning' as ProjectStatus
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.budget) {
      alert('Please fill in required fields')
      return
    }

    onSubmit({
      title: formData.title,
      description: formData.description,
      coordinator: formData.coordinator,
      budget: parseFloat(formData.budget),
      timeline: formData.timeline,
      status: formData.status,
      branchId
    })

    setFormData({
      title: '',
      description: '',
      coordinator: '',
      budget: '',
      timeline: '',
      status: 'planning'
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new union project</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Community Training Program"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project details"
              className="w-full px-3 py-2 border border-border rounded-md text-sm min-h-20"
            />
          </div>

          <div>
            <Label htmlFor="coordinator">Project Coordinator</Label>
            <Input
              id="coordinator"
              value={formData.coordinator}
              onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
              placeholder="Name of coordinator"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget (E) *</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                placeholder="e.g., 3 months"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="planning">Planning</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Spinner className="w-4 h-4" />}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
