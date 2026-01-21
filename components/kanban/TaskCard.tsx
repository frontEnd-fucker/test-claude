'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/types'
import { GripVertical, MoreVertical, Clock, Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TaskForm from './TaskForm'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
}

export default function TaskCard({ task, isOverlay = false }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      status: task.status,
      priority: task.priority,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'text-red-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-green-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getPriorityBg = () => {
    switch (task.priority) {
      case 'high':
        return 'bg-red-500/10'
      case 'medium':
        return 'bg-yellow-500/10'
      case 'low':
        return 'bg-green-500/10'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-xl scale-105'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <h4 className="font-medium">{task.title}</h4>
          </div>
          {task.description && (
            <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="mt-4 flex items-center gap-3">
            {task.priority && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                  getPriorityBg(),
                  getPriorityColor()
                )}
              >
                <Flag className="h-3 w-3" />
                {task.priority}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(task.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setEditOpen(true)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      <TaskForm
        task={task}
        status={task.status}
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger={true}
      />
    </div>
  )
}