'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Upload, X, FileText, Image as ImageIcon, Building2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScopeOption, AddFinancialModalProps, categories } from '@/lib/types'

export function AddFinancialModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  isHQ = false,
  branches = [],
  affiliates = [],
  members = [],
  userId,
  defaultBranchId,
}: AddFinancialModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    branchId: defaultBranchId || '',
    affiliateId: '',
    memberId: '',
  })

  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false)

  // Reset form when modal opens / closes
  useEffect(() => {
    if (open) {
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        branchId: defaultBranchId || '',
        affiliateId: '',
        memberId: '',
      })
      setEvidenceFile(null)
      setEvidencePreview(null)
      setErrors({})
    }
  }, [open, defaultBranchId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic validation
    const maxSize = 5 * 1024 * 1024 // 5 MB
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, evidence: 'File size must be under 5 MB' }))
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'image/jpg',
    ]
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        evidence: 'Only images (JPG, PNG, WEBP) or PDF are allowed',
      }))
      return
    }

    setEvidenceFile(file)
    setErrors((prev) => {
      const { evidence, ...rest } = prev
      return rest
    })

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setEvidencePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setEvidencePreview(null)
    }
  }

  const clearEvidence = () => {
    setEvidenceFile(null)
    setEvidencePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0'
    }
    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.date) {
      newErrors.date = 'Date is required'
    }
    if (isHQ && !formData.branchId) {
      newErrors.branchId = 'Please select a branch'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    await onSubmit({
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description.trim(),
      date: new Date(formData.date),
      branch_id: formData.branchId || undefined,
      affiliate_id: formData.affiliateId || undefined,
      member_id: formData.memberId || undefined,
      evidence_file: evidenceFile,
      evidence_name: evidenceFile?.name,
      created_by: userId
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Financial Record</DialogTitle>
          <DialogDescription>
            Record a new income or expense. Attach supporting evidence when available.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <select
                id='type'
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as "income" | "expense", category: '' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="" disabled>Select type</option>
                <option value="income">
                  <span className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      Income
                    </Badge>
                  </span>
                </option>
                <option value="expense">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Expense
                    </Badge>
                  </span>
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Amount (E) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={`${cn(errors.amount && 'border-destructive')} h-10`}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id='category'
              required
              value={formData.category}
              onChange={(value) => {
                if (value) {
                  setFormData({ ...formData, category: value.target.value })
                  setIsCategorySelectOpen(false) // Close the select after a value is chosen
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <option value="" disabled>Select category</option>
              {categories[formData.type].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category}</p>
            )}
          </div>

          {/* Scope – Branch / Affiliate / Member */}
          <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Scope & Ownership
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Branch */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Branch {isHQ && <span className="text-destructive">*</span>}
                </Label>
                <select
                  id='branch'
                  value={formData.branchId}
                  onChange={(e) =>
                    setFormData({ ...formData, branchId: e.target.value, affiliateId: '', memberId: '' })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="" disabled>Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.branchId && (
                  <p className="text-xs text-destructive">{errors.branchId}</p>
                )}
              </div>

              {/* Affiliate */}
              <div className="space-y-1.5">
                <Label className="text-xs">Affiliate (optional)</Label>
                <select
                  id='affiliate'
                  value={formData.affiliateId}
                  onChange={(e) =>
                    setFormData({ ...formData, affiliateId: e.target.value === 'none' ? '' : e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="none">None</option>
                  {affiliates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member */}
              <div className="space-y-1.5">
                <Label className="text-xs">Member (optional)</Label>
                <select
                  id='member'
                  value={formData.memberId}
                  onChange={(e) =>
                    setFormData({ ...formData, memberId: e.target.value === 'none' ? '' : e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="none">None</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this transaction..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={`${cn(errors.date && 'border-destructive')} h-10`}
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Supporting Evidence
              <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>

            {!evidenceFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer',
                  'hover:border-primary/50 hover:bg-muted/40 transition-colors',
                  errors.evidence && 'border-destructive'
                )}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload evidence</p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WEBP or PDF • Max 5 MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
                {evidencePreview ? (
                  <img
                    src={evidencePreview}
                    alt="Evidence preview"
                    className="h-14 w-14 object-cover rounded-md border"
                  />
                ) : (
                  <div className="h-14 w-14 flex items-center justify-center rounded-md border bg-background">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{evidenceFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(evidenceFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearEvidence}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {errors.evidence && (
              <p className="text-xs text-destructive">{errors.evidence}</p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2 min-w-[160px]">
              {isLoading && <Spinner className="w-4 h-4" />}
              {isLoading ? 'Recording...' : 'Record Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}