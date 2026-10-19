'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { UserRole, Member } from '@/lib/types'
import { Plus, Trash2, Download, Upload, Printer } from 'lucide-react'
import { BulkImportModal } from '@/components/modals/bulk-import-modal'
import { AddMemberModal } from '@/components/modals/add-member-modal'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'

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
  const [currentPage, setCurrentPage] = useState(1)
  const membersPerPage = 10

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

  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember);
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);

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

  const handlePrintList = () => {
    let tableHtml = `
      <html>
      <head>
        <title>Member List</title>
        <style>
          body { font-family: sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Union Members List</h1>
        <table>
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Gender</th>
              <th>D.O.B</th>
              <th>Workplace</th>
              <th>Address</th>
              <th>Next of Kin</th>
              <th>Join Date</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Use filteredMembers for printing the entire list, not just the current page
    filteredMembers.forEach(member => {
      tableHtml += `
        <tr>
          <td>${member.memberId}</td>
          <td>${member.name}</td>
          <td>${member.phone}</td>
          <td>${member.gender}</td>
          <td>${member.dob}</td>
          <td>${member.workplace}</td>
          <td>${member.address}</td>
          <td>${member.nextOfKin}</td>
          <td>${new Date(member.joinDate).toLocaleDateString()}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(tableHtml);
      printWindow.document.close();
      printWindow.print();
    } else {
      alert('Please allow pop-ups for printing.');
    }
  };


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
          <Button variant="outline" onClick={handlePrintList} className="gap-2">
            <Printer className="w-4 h-4" />
            Print List
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

      <div className="overflow-x-auto"> {/* Make table scrollable */}
        {filteredMembers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No members found
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Gender</TableHead>
                {/* <TableHead>D.O.B</TableHead> */}
                <TableHead>Workplace</TableHead>
                {/* <TableHead>Address</TableHead> */}
                {/* <TableHead>Next of Kin</TableHead> */}
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.memberId}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>{member.gender}</TableCell>
                  {/* <TableCell>{member.dob}</TableCell> */}
                  <TableCell>{member.workplace}</TableCell>
                  {/* <TableCell>{member.address}</TableCell> */}
                  {/* <TableCell>{member.nextOfKin}</TableCell> */}
                  <TableCell>{new Date(member.joinDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

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