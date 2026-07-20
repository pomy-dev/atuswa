'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Member } from '@/lib/types'

interface AddMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (member: Omit<Member, 'id' | 'joinDate'>) => void
  isLoading?: boolean
  branchId?: string
}

export function AddMemberModal({ open, onOpenChange, onSubmit, isLoading, branchId }: AddMemberModalProps) {
  const [formData, setFormData] = useState({
    memberId: '',
    name: '',
    email: '',
    phone: '',
    gender: '',
    dob: new Date().toISOString().split('T')[0],
    workplace: '',
    address: '',
    nextOfKinName: '',
    nextOfKinPhone: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in required fields')
      return
    }

    onSubmit({
      memberId: formData.memberId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      dob: formData.dob,
      workplace: formData.workplace,
      branchId,
      address: formData.address,
      nextOfKin: formData.nextOfKinName,
      nextOfKinPhone: formData.nextOfKinPhone
    })

    setFormData({
      memberId: '',
      name: '',
      email: '',
      phone: '',
      gender: '',
      dob: new Date().toISOString().split('T')[0],
      workplace: '',
      address: '',
      nextOfKinName: '',
      nextOfKinPhone: ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Register As New Member</DialogTitle>
          <DialogDescription>Add a new member profile in the union</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+268-XXX-XXXX"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="age">Date Of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                placeholder="01/01/1999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nextOfKin">Next Of Kin</Label>
              <Input
                id="nextOfKin"
                type="text"
                value={formData.nextOfKinName}
                onChange={(e) => setFormData({ ...formData, nextOfKinName: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label htmlFor="age">Phone</Label>
              <Input
                id="nextOfKinPhone"
                type="tel"
                value={formData.nextOfKinPhone}
                onChange={(e) => setFormData({ ...formData, nextOfKinPhone: e.target.value })}
                placeholder="+268 XXXX-XXXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workplace">Workplace</Label>
              <Input
                id="workplace"
                value={formData.workplace}
                onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                placeholder="Company/Organization"
              />
            </div>

            <div>
              <Label htmlFor="address">Physical Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 street"
              />
            </div>
          </div>

          {/* select branch */}
          <div>
            <Label htmlFor="branch">Branches</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="">Select</option>
              {/* list available branch */}
              {<option value="Male">Male</option>}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Spinner className="w-4 h-4" />}
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
