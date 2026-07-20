'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { HelpDeskCase, HelpDeskStatus, UserRole } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { Upload, X } from 'lucide-react'

interface FileCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (caseData: Partial<HelpDeskCase>) => void
  isLoading?: boolean
}

export function FileCaseModal({ open, onOpenChange, onSubmit, isLoading }: FileCaseModalProps) {
  const { user } = useAuth()
  const [branches] = useState([
    { id: 'lagos', name: 'Lagos Branch' },
    { id: 'abuja', name: 'Abuja Branch' },
    { id: 'port-harcourt', name: 'Port Harcourt Branch' }
  ])
  
  const [formData, setFormData] = useState({
    title: '',
    memberName: '',
    memberPhone: '',
    memberEmail: '',
    description: '',
    branchId: '',
    documents: [] as { name: string; size: number; type: string }[]
  })

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    Array.from(files).forEach(file => {
      if (validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024) {
        setUploadedFiles(prev => [...prev, file])
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, { name: file.name, size: file.size, type: file.type }]
        }))
      }
    })
    
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user && !formData.branchId) {
      alert('Please select a branch')
      return
    }

    const newCase: Partial<HelpDeskCase> = {
      title: formData.title,
      memberName: formData.memberName,
      memberPhone: formData.memberPhone,
      memberEmail: formData.memberEmail,
      description: formData.description,
      status: HelpDeskStatus.PENDING,
      handlers: [
        {
          userId: user?.id || 'guest',
          userName: user?.name || 'Guest',
          handledAt: new Date(),
          action: 'Filed case'
        }
      ],
      notes: [],
      documents: formData.documents,
      createdBy: user?.id || 'guest',
      createdByName: user?.name || 'Guest'
    }

    onSubmit(newCase)
    setFormData({ title: '', memberName: '', memberPhone: '', memberEmail: '', description: '', branchId: '', documents: [] })
    setUploadedFiles([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>File New Support Case</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              placeholder="e.g., Salary Dispute"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="memberName">Member Name</Label>
            <Input
              id="memberName"
              placeholder="Full name"
              value={formData.memberName}
              onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="memberPhone">Phone</Label>
            <Input
              id="memberPhone"
              placeholder="+234-..."
              value={formData.memberPhone}
              onChange={(e) => setFormData({ ...formData, memberPhone: e.target.value })}
              required
            />
          </div>

          {!user && (
            <div>
              <Label htmlFor="branch">Branch *</Label>
              <Select value={formData.branchId} onValueChange={(value) => setFormData({ ...formData, branchId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="memberEmail">Email</Label>
            <Input
              id="memberEmail"
              type="email"
              placeholder="member@example.com"
              value={formData.memberEmail}
              onChange={(e) => setFormData({ ...formData, memberEmail: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the case details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="min-h-24"
            />
          </div>

          {/* upload supporting files or images */}
          <div>
            <Label htmlFor="files">Supporting Documents & Images</Label>
            <div className="flex gap-2">
              <label className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* Display uploaded files as badges */}
            {uploadedFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-2 pr-1">
                    <span className="text-xs truncate max-w-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Filing...' : 'File Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
