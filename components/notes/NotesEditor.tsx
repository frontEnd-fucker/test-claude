'use client'

import { useState, useLayoutEffect } from 'react'
import { useNotesStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Save, Trash2, Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotesEditor() {
  const { notes, activeNoteId, addNote, updateNote, deleteNote, setActiveNote } =
    useNotesStore()
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const activeNote = activeNoteId
    ? notes.find((note) => note.id === activeNoteId)
    : notes[0]

  // eslint-disable-next-line react-compiler/react-compiler
  useLayoutEffect(() => {
    if (activeNote) {
      setContent(activeNote.content)
      setIsEditing(false)
    } else {
      setContent('')
      setIsEditing(true)
    }
  }, [activeNote])

  const handleSave = () => {
    if (!content.trim()) return

    if (activeNote) {
      updateNote(activeNote.id, content)
    } else {
      addNote(content)
    }
    setIsEditing(false)
  }

  const handleNewNote = () => {
    setContent('')
    setActiveNote(null)
    setIsEditing(true)
  }

  const handleDelete = () => {
    if (activeNote) {
      deleteNote(activeNote.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Notes ({notes.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleNewNote}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            New
          </Button>
          {activeNote && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your note..."
                className="min-h-[200px] font-mono text-sm"
                rows={10}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {activeNote
                      ? new Date(activeNote.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'New Note'}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                {activeNote?.content || 'No note selected'}
              </pre>
            </Card>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">All Notes</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((note) => (
              <Card
                key={note.id}
                className={cn(
                  'p-3 cursor-pointer transition-colors hover:bg-muted/50',
                  activeNote?.id === note.id && 'bg-muted border-primary'
                )}
                onClick={() => setActiveNote(note.id)}
              >
                <div className="flex items-center justify-between">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs font-mono">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 && '...'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}