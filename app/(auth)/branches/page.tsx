'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, Branch } from '@/lib/types'
import { Plus, MapPin, Users } from 'lucide-react'
import { AddBranchModal } from '@/components/modals/add-branch-modal'
import { User, UserRole as Role } from '@/lib/types'

export default function BranchesPage() {
  const { user } = useAuth()
  const [branches, setBranches] = useState<Branch[]>(() =>
    JSON.parse(localStorage.getItem('branches') || '[]')
  )
  const [showForm, setShowForm] = useState(false)
  const [showAddBranchModal, setShowAddBranchModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', location: '' })

  // Secretary General only
  if (user?.role !== UserRole.SECRETARY_GENERAL) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Only the Secretary General can manage branches.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const memberCounts = useMemo(() => {
    const members = JSON.parse(localStorage.getItem('members') || '[]')
    const counts: Record<string, number> = {}
    members.forEach((m: any) => {
      counts[m.branchId] = (counts[m.branchId] || 0) + 1
    })
    return counts
  }, [])

  const handleAddBranch = () => {
    if (!formData.name || !formData.location) return

    const newBranch: Branch = {
      id: `branch_${Date.now()}`,
      name: formData.name,
      location: formData.location,
      adminId: user!.id,
      createdAt: new Date()
    }

    const updated = [...branches, newBranch]
    setBranches(updated)
    localStorage.setItem('branches', JSON.stringify(updated))
    setFormData({ name: '', location: '' })
    setShowForm(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branches</h1>
          <p className="text-muted-foreground mt-1">Manage union branches across regions</p>
        </div>
        <Button onClick={() => setShowAddBranchModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Branch
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Branch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Branch Name</Label>
              <Input
                id="name"
                placeholder="e.g., Western Region"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Ibadan, Nigeria"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddBranch}>Add Branch</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{branch.name}</h3>
                    <Badge variant="secondary">{branch.id === 'branch_main' ? 'Headquarters' : 'Regional'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {branch.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4" />
                    {memberCounts[branch.id] || 0} Members
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddBranchModal
        open={showAddBranchModal}
        onOpenChange={setShowAddBranchModal}
        onSubmit={(branch, admin) => {
          setIsLoading(true)
          try {
            const allBranches = JSON.parse(localStorage.getItem('branches') || '[]')
            const updated = [...allBranches, branch]
            localStorage.setItem('branches', JSON.stringify(updated))
            setBranches(b => [...b, branch])
            
            // Add branch admin if provided
            if (admin) {
              const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
              const updatedUsers = [...allUsers, admin]
              localStorage.setItem('users', JSON.stringify(updatedUsers))
            }
            
            setShowAddBranchModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
