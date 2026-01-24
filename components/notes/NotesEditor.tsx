'use client'

import { useState, useLayoutEffect } from 'react'
import { useParams } from 'next/navigation'
import { useNotesStore } from '@/lib/store'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useNoteSubscriptions } from '@/lib/queries/notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Save, Trash2, Plus, FileText, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotesEditor() {
  const { activeNoteId, setActiveNote } = useNotesStore()
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const { id: projectId } = useParams<{ id: string }>()

  // Set up real-time subscriptions
  useNoteSubscriptions()

  // Fetch notes using TanStack Query
  const { data: notes = [], isLoading, error, refetch } = useNotes({ projectId })
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()

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
      // Update existing note - keep existing title
      updateNoteMutation.mutate({ id: activeNote.id, updates: { content } })
    } else {
      // Create new note - generate title from first line
      const firstLine = content.split('\n')[0].trim()
      const title = firstLine.length > 0 ? firstLine.substring(0, 50) : 'Untitled Note'
      createNoteMutation.mutate({ title, content, projectId })
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
      deleteNoteMutation.mutate(activeNote.id)
    }
  }

  if (isLoading && notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Error loading notes</h3>
        </div>
        <p className="mt-1 text-xs">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetch()}
        >
          Retry
        </Button>
      </div>
    )
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