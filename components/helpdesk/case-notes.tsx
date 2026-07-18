'use client'

import { useState } from 'react'
import { CaseNote } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

interface CaseNotesProps {
  notes: CaseNote[]
  onAddNote: (content: string) => void
  isLoading?: boolean
}

export function CaseNotes({ notes, onAddNote, isLoading }: CaseNotesProps) {
  const { user } = useAuth()
  const [newNote, setNewNote] = useState('')

  const handleSubmit = () => {
    if (newNote.trim()) {
      onAddNote(newNote)
      setNewNote('')
    }
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Case Notes</h3>
      
      {/* Add Note Form */}
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        <Textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-20"
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newNote.trim() || isLoading}
          size="sm"
        >
          {isLoading ? 'Adding...' : 'Add Note'}
        </Button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet</p>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="border-l-2 border-accent pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{note.createdByName}</span>
                {note.createdBy === user?.id && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </div>
              <p className="text-sm text-foreground mb-2">{note.content}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
