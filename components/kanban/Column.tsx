'use client'

import { useDroppable } from '@dnd-kit/core'
import { TaskStatus } from '@/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ColumnProps {
  id: TaskStatus
  title: string
  taskCount: number
  children: React.ReactNode
}

export default function Column({ id, title, taskCount, children }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const getColumnColor = () => {
    switch (id) {
      case 'todo':
        return 'border-red-500/20 bg-red-500/5'
      case 'in-progress':
        return 'border-blue-500/20 bg-blue-500/5'
      case 'complete':
        return 'border-green-500/20 bg-green-500/5'
    }
  }

  const getTitleColor = () => {
    switch (id) {
      case 'todo':
        return 'text-red-400'
      case 'in-progress':
        return 'text-blue-400'
      case 'complete':
        return 'text-green-400'
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 ${getColumnColor()} p-4 transition-colors ${
        isOver ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${getTitleColor()}`}>{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {taskCount}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
      {taskCount === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground/70">Drop tasks here</p>
        </div>
      )}
    </div>
  )
}