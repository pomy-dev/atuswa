'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, Member } from '@/lib/types'
import { Plus, Trash2, Download, Upload } from 'lucide-react'
import { BulkImportModal } from '@/components/modals/bulk-import-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'

export default function MembersPage() {
  const { user } = useAuth()
  const [members, setMembers] = useState<Member[]>(() =>
    JSON.parse(localStorage.getItem('members') || '[]').filter((m: Member) =>
      user?.role === UserRole.SECRETARY_GENERAL || m.branchId === user?.branchId
    )
  )
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGender, setFilterGender] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Can only access if Secretary General or Branch Admin
  if (![UserRole.SECRETARY_GENERAL, UserRole.BRANCH_ADMIN].includes(user?.role!)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Only Secretary General and Branch Admins can manage members.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.memberId.includes(searchTerm) ||
        m.phone.includes(searchTerm)
      const matchesGender = !filterGender || m.gender === filterGender
      return matchesSearch && matchesGender
    })
  }, [members, searchTerm, filterGender])

  const handleDelete = (id: string) => {
    const allMembers = JSON.parse(localStorage.getItem('members') || '[]')
    const updated = allMembers.filter((m: Member) => m.id !== id)
    localStorage.setItem('members', JSON.stringify(updated))
    setMembers(members.filter(m => m.id !== id))
  }

  const handleCSVDownload = () => {
    const headers = ['Member ID', 'Name', 'Phone', 'Gender', 'Date Of Birth', 'Workplace', 'Address', 'Next of Kin', 'Join Date']
    const rows = filteredMembers.map(m => [
      m.memberId, m.name, m.phone, m.gender, m.dob, m.workplace, m.address, m.nextOfKin,
      new Date(m.joinDate).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members.csv'
    a.click()
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground mt-1">Total: {filteredMembers.length} members</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCSVDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowBulkImport(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowAddMemberModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
        >
          <option value="">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No members found
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold">{member.name}</span>
                  <Badge variant="secondary">{member.memberId}</Badge>
                  <Badge variant="outline">{member.gender === 'Male' ? 'Male' : member.gender === 'Female' ? 'Female' : 'Other'}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>D.O.B: {member.dob} | Workplace: {member.workplace}</p>
                  <p>{member.phone}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(member.id)}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <AddMemberModal
        open={showAddMemberModal}
        onOpenChange={setShowAddMemberModal}
        onSubmit={(member) => {
          setIsLoading(true)
          try {
            const allMembers = JSON.parse(localStorage.getItem('members') || '[]')
            const newMember: Member = {
              ...member,
              id: `member_${Date.now()}`,
              joinDate: new Date()
            }
            const updated = [...allMembers, newMember]
            localStorage.setItem('members', JSON.stringify(updated))
            setMembers(m => [...m, newMember])
            setShowAddMemberModal(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
        branchId={user?.branchId || 'branch_main'}
      />

      <BulkImportModal
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
        onSubmit={(newMembers) => {
          setIsLoading(true)
          try {
            const allMembers = JSON.parse(localStorage.getItem('members') || '[]')
            const importedMembers = newMembers.map((m, idx) => ({
              ...m,
              id: `member_${Date.now()}_${idx}`,
              branchId: user!.branchId
            } as Member))

            const updated = [...allMembers, ...importedMembers]
            localStorage.setItem('members', JSON.stringify(updated))
            setMembers(m => [...m, ...importedMembers])
            setShowBulkImport(false)
          } finally {
            setIsLoading(false)
          }
        }}
        isLoading={isLoading}
      />
    </div>
  )
}
