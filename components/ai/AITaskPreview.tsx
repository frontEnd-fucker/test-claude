'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { useCreateTask } from '@/lib/queries/tasks/useTaskMutations'
import { TaskSuggestion } from '@/lib/ai/miniMax'
import { cn } from '@/lib/utils'

interface AITaskPreviewProps {
  tasks: TaskSuggestion[]
  projectId: string
  onClose: () => void
  onTasksAdded: () => void
}

export function AITaskPreview({
  tasks,
  projectId,
  onClose,
  onTasksAdded,
}: AITaskPreviewProps) {
  const [editedTasks, setEditedTasks] = useState(
    tasks.map((task, index) => ({
      ...task,
      id: `temp-${index}`,
    }))
  )
  const [isAdding, setIsAdding] = useState(false)
  const createTask = useCreateTask()

  const updateTask = (id: string, field: keyof TaskSuggestion, value: string) => {
    setEditedTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, [field]: value } : task
      )
    )
  }

  const removeTask = (id: string) => {
    setEditedTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const handleAddAll = async () => {
    if (editedTasks.length === 0) return

    setIsAdding(true)
    try {
      for (const task of editedTasks) {
        await createTask.mutateAsync({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          projectId,
        })
      }
      onTasksAdded()
    } catch (error) {
      console.error('Failed to add tasks:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">AI 生成的任务预览</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {editedTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            已删除所有任务
          </p>
        ) : (
          editedTasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-start gap-2 rounded-md border p-3 bg-background"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="h-4 w-4 mt-2 cursor-grab" />
                <span className="text-xs font-medium w-6">{index + 1}.</span>
              </div>

              <div className="flex-1 space-y-2">
                <Input
                  value={task.title}
                  onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                  placeholder="任务标题"
                  className="font-medium"
                />
                <Input
                  value={task.description || ''}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  placeholder="任务描述（可选）"
                  className="text-sm"
                />
              </div>

              <div className="flex flex-col items-end gap-2">
                <select
                  value={task.priority}
                  onChange={(e) =>
                    updateTask(task.id, 'priority', e.target.value as any)
                  }
                  className={cn(
                    'text-xs rounded-md border px-2 py-1 cursor-pointer',
                    priorityColors[task.priority]
                  )}
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTask(task.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-sm text-muted-foreground">
          {editedTasks.length} 个任务
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleAddAll}
            disabled={isAdding || editedTasks.length === 0}
          >
            {isAdding ? (
              <>
                添加中...
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                一键添加
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
