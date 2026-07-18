'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, BoardMember } from '@/lib/types'
import { Plus, Mail, Trash2 } from 'lucide-react'
import { AddBoardMemberModal } from '@/components/modals/add-board-member-modal'

export default function BoardPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<BoardMember[]>(() =>
    JSON.parse(localStorage.getItem('boardMembers') || '[]')
  )
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Secretary General only
  if (user?.role !== UserRole.SECRETARY_GENERAL) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Only the Secretary General can manage board members.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleAddMember = () => {
    if (!formData.name || !formData.position) return

    const newMember: BoardMember = {
      id: `board_${Date.now()}`,
      ...formData,
      branchId: user!.branchId,
      isAdmin: false,
      createdAt: new Date()
    }

    const updated = [...members, newMember]
    setMembers(updated)
    localStorage.setItem('boardMembers', JSON.stringify(updated))
    setFormData({ name: '', email: '', position: '', responsibilities: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    const updated = members.filter(m => m.id !== id)
    setMembers(updated)
    localStorage.setItem('boardMembers', JSON.stringify(updated))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Board Members</h1>
          <p className="text-muted-foreground mt-1">Manage union board and leadership</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Board Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g., Amara Obi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                placeholder="e.g., Vice Secretary"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsibilities</Label>
              <Input
                id="responsibilities"
                placeholder="Primary duties and responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddMember}>Add Member</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    {member.isAdmin && <Badge>Admin</Badge>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-accent">{member.position}</p>
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {member.email}
                      </div>
                    )}
                    {member.responsibilities && (
                      <p className="text-sm text-muted-foreground">{member.responsibilities}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddBoardMemberModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={(member) => {
          setIsLoading(true)
          try {
            const allMembers = JSON.parse(localStorage.getItem('boardMembers') || '[]')
            const newMember: BoardMember = {
              ...member,
              id: `board_${Date.now()}`,
              createdAt: new Date()
            }
            const updated = [...allMembers, newMember]
            localStorage.setItem('boardMembers', JSON.stringify(updated))
            setMembers(m => [...m, newMember])
            setShowAddModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
