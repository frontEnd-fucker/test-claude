'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useNotesStore } from '@/lib/store'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useNoteSubscriptions } from '@/lib/queries/notes'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Save, Trash2, Plus, FileText, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MinimalSkeleton } from '@/components/ui/skeleton/index'

function NotesEditorContent() {
  const params = useParams()
  const { activeNoteId, setActiveNote } = useNotesStore()
  const [isEditing, setIsEditing] = useState(true)
  const [content, setContent] = useState('')

  // Set up real-time subscriptions
  useNoteSubscriptions()

  // Fetch notes using TanStack Query
  const { data: notes = [], isLoading, error, refetch } = useNotes()
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()


  const activeNote = activeNoteId
    ? notes.find((note) => note.id === activeNoteId)
    : undefined

  // 当 activeNote 变化时，使用 lazy 初始化更新 content
  // 注意：这只在组件首次渲染时执行，之后由 setContent 处理
  const contentValue = activeNote ? activeNote.content : content

  const handleSave = () => {
    const contentToSave = activeNote ? content : contentValue
    if (!contentToSave.trim()) return

    if (activeNote) {
      // Update existing note - keep existing title
      updateNoteMutation.mutate({ id: activeNote.id, updates: { content: contentToSave } })
    } else {
      // Create new note - generate title from first line
      const firstLine = contentToSave.split('\n')[0].trim()
      const title = firstLine.length > 0 ? firstLine.substring(0, 50) : 'Untitled Note'
      createNoteMutation.mutate(
        { title, content: contentToSave },
        {
          onSuccess: (newNote) => {
            setActiveNote(newNote.id)
          },
        }
      )
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
    return <MinimalSkeleton className="h-64 w-full" />
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
                value={contentValue}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your note..."
                className="min-h-[200px] font-mono text-sm bg-amber-50/50 border-amber-200 focus-visible:bg-amber-50"
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
            <Card className="p-4 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600/70" />
                  <span className="text-sm font-medium text-amber-900/70">
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
              <pre className="whitespace-pre-wrap font-mono text-sm text-amber-900/80">
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
                  'p-3 cursor-pointer transition-colors',
                  activeNote?.id === note.id
                    ? 'bg-amber-100/60 border-amber-300'
                    : 'bg-amber-50/40 border-amber-100 hover:bg-amber-100/60'
                )}
                onClick={() => {
                  setContent(note.content)
                  setActiveNote(note.id)
                  setIsEditing(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <FileText className="h-3.5 w-3.5 text-amber-600/70" />
                  <span className="text-xs text-amber-700/60">
                    {new Date(note.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs font-mono text-amber-900/70">
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

export function NotesEditorSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="h-6 w-16 bg-muted rounded animate-pulse mb-4" />
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function NotesEditor() {
  const { activeNoteId } = useNotesStore()

  // 使用 key 强制在切换笔记时重新挂载组件
  return <NotesEditorContent key={activeNoteId ?? 'new'} />
}
