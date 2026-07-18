'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Member } from '@/lib/types'

interface BulkImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (members: Partial<Member>[]) => void
  isLoading?: boolean
}

interface ParsedMember {
  name: string
  memberId: string
  phone: string
  age: number
  workplace: string
  gender: 'M' | 'F' | 'Other'
  physicalAddress: string
  nextOfKin: string
  error?: string
}

export function BulkImportModal({ open, onOpenChange, onSubmit, isLoading }: BulkImportModalProps) {
  const [preview, setPreview] = useState<ParsedMember[]>([])
  const [fileName, setFileName] = useState('')
  const [hasValidationErrors, setHasValidationErrors] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as string
      parseCSV(csv)
    }
    reader.readAsText(file)
  }

  const parseCSV = (csv: string) => {
    const lines = csv.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const members: ParsedMember[] = []
    let errors = false

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(',').map(v => v.trim())
      const member: ParsedMember = {
        name: values[headers.indexOf('name')] || '',
        memberId: values[headers.indexOf('memberid')] || `MEM-${Date.now()}-${i}`,
        phone: values[headers.indexOf('phone')] || '',
        age: parseInt(values[headers.indexOf('age')]) || 0,
        workplace: values[headers.indexOf('workplace')] || '',
        gender: (values[headers.indexOf('gender')] || 'Other') as 'M' | 'F' | 'Other',
        physicalAddress: values[headers.indexOf('physicaladdress')] || '',
        nextOfKin: values[headers.indexOf('nextofkin')] || ''
      }

      if (!member.name || !member.phone) {
        member.error = 'Missing required fields (name, phone)'
        errors = true
      }

      members.push(member)
    }

    setPreview(members)
    setHasValidationErrors(errors)
  }

  const handleSubmit = () => {
    const validMembers = preview
      .filter(m => !m.error)
      .map(m => ({
        ...m,
        joinDate: new Date()
      }))

    onSubmit(validMembers)
    setPreview([])
    setFileName('')
    setHasValidationErrors(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Members</DialogTitle>
        </DialogHeader>

        {preview.length === 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Upload a CSV file with the following columns:</p>
              <code className="block bg-secondary/50 p-2 rounded text-xs mb-3">
                name, memberId, phone, age, workplace, gender, physicalAddress, nextOfKin
              </code>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-sm">
                  <p className="font-medium mb-1">Click to upload CSV or drag and drop</p>
                  <p className="text-muted-foreground text-xs">CSV files only</p>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{fileName}</p>
              <Badge variant={hasValidationErrors ? 'destructive' : 'default'}>
                {preview.length} records
              </Badge>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.map((member, idx) => (
                <div
                  key={idx}
                  className={`text-sm p-2 rounded border ${
                    member.error
                      ? 'border-red-500/50 bg-red-500/10'
                      : 'border-green-500/50 bg-green-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.phone} • {member.workplace}
                      </p>
                    </div>
                    {member.error && (
                      <Badge variant="destructive" className="text-xs">
                        {member.error}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreview([])
                  setFileName('')
                  setHasValidationErrors(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || hasValidationErrors || preview.length === 0}
              >
                {isLoading ? 'Importing...' : `Import ${preview.filter(m => !m.error).length} Members`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
