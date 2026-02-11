'use client'

import { useState, useRef, useEffect } from 'react'
import { Task } from '@/types'
import { useUpdateTask } from '@/lib/queries/tasks'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface TaskDescriptionEditorProps {
  task: Task
}

export default function TaskDescriptionEditor({ task }: TaskDescriptionEditorProps) {
  const updateTaskMutation = useUpdateTask()
  const [description, setDescription] = useState(task.description || '')
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update local state when task changes
  useEffect(() => {
    setDescription(task.description || '')
  }, [task.description])

  const handleSave = () => {
    if (description !== task.description) {
      updateTaskMutation.mutate({
        id: task.id,
        updates: { description: description || undefined },
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      setDescription(task.description || '')
      setIsEditing(false)
    }
  }

  const handleFocus = () => {
    setIsEditing(true)
    // Focus and move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        )
      }
    }, 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Description</span>
          {updateTaskMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="Add a description..."
              className="min-h-[200px] resize-none"
              disabled={updateTaskMutation.isPending}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Press Ctrl+Enter to save, Esc to cancel</span>
              <span>{description.length} characters</span>
            </div>
          </div>
        ) : (
          <div
            onClick={handleFocus}
            className="min-h-[200px] cursor-text rounded-lg border border-transparent hover:border-input p-4 transition-colors"
          >
            {description ? (
              <div className="whitespace-pre-wrap">{description}</div>
            ) : (
              <div className="text-muted-foreground italic">
                Click to add a description...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}