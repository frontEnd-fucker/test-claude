'use client'

import { useState } from 'react'
import { Task } from '@/types'
import { Project } from '@/types/database'
import { useUpdateTask } from '@/lib/queries/tasks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TaskDetailHeaderProps {
  task: Task
  project: Project
}

export default function TaskDetailHeader({ task, project }: TaskDetailHeaderProps) {
  const updateTaskMutation = useUpdateTask()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(task.title)

  const handleStatusChange = (value: string) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { status: value as Task['status'] },
    })
  }

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      updateTaskMutation.mutate({
        id: task.id,
        updates: { title: title.trim() },
      })
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setTitle(task.title)
      setIsEditingTitle(false)
    }
  }

  const getStatusDisplay = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'Todo'
      case 'in-progress': return 'Doing'
      case 'complete': return 'Done'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Status and project info */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={task.status}
            onValueChange={handleStatusChange}
            disabled={updateTaskMutation.isPending}
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                <span className={cn(
                  'inline-flex items-center gap-2',
                  task.status === 'todo' && 'text-blue-500',
                  task.status === 'in-progress' && 'text-yellow-500',
                  task.status === 'complete' && 'text-green-500'
                )}>
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {getStatusDisplay(task.status)}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Todo
                </span>
              </SelectItem>
              <SelectItem value="in-progress">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  Doing
                </span>
              </SelectItem>
              <SelectItem value="complete">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Done
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Project: <span className="font-medium text-foreground">{project.name}</span>
        </div>
      </div>

      {/* Title */}
      <div>
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-3xl font-bold h-14 px-4"
            disabled={updateTaskMutation.isPending}
          />
        ) : (
          <h1
            className="text-3xl font-bold cursor-text hover:bg-muted/50 rounded-lg px-4 py-3 transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {task.title}
          </h1>
        )}
      </div>
    </div>
  )
}