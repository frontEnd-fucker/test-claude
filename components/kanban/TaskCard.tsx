'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task } from '@/types'
import { GripVertical, MoreVertical, Clock, Flag, Trash, Edit, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import TaskForm from './TaskForm'
import { cn } from '@/lib/utils'
import { useDeleteTask } from '@/lib/queries/tasks'

interface TaskCardProps {
  task: Task
  isOverlay?: boolean
}

function isTempId(id: string): boolean {
  return id.startsWith('temp-')
}

export default function TaskCard({ task, isOverlay = false }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteTaskMutation = useDeleteTask()

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

  const handleDelete = () => {
    deleteTaskMutation.mutate(task.id)
    setDeleteOpen(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md pt-10',
        isDragging && 'opacity-50',
        isOverlay && 'shadow-xl scale-105'
      )}
    >
      {/* Drag handle area - horizontal bar on top */}
      <div
        className="absolute left-0 top-0 right-0 h-8 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing z-10 hover:bg-muted/20 transition-colors rounded-t-lg"
        {...attributes}
        {...listeners}
      >
        <div className="w-32 h-2 rounded-full bg-muted-foreground/40" />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isTempId(task.id) ? (
              <div className="flex items-center gap-2">
                <span className="font-medium">{task.title}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Creating...
                </span>
              </div>
            ) : (
              <Link
                href={`/project/${task.projectId}/task/${task.id}`}
                className="font-medium hover:text-primary transition-colors hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {task.title}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>
          {task.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{task.description}</p>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!isTempId(task.id) && (
              <DropdownMenuItem asChild>
                <Link href={`/project/${task.projectId}/task/${task.id}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <TaskForm
        task={task}
        status={task.status}
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger={true}
      />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{task.title}</strong>"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}