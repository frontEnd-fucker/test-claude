'use client'

import { useCallback } from 'react'
import { useUpdateTask } from '@/lib/queries/tasks'
import { Task } from '@/types'

export function useTaskDetailMutations(taskId: string) {
  const updateTaskMutation = useUpdateTask()

  const updateField = useCallback((
    field: keyof Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    value: any
  ) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { [field]: value },
    })
  }, [taskId, updateTaskMutation])

  const updateTitle = useCallback((title: string) => {
    updateField('title', title)
  }, [updateField])

  const updateDescription = useCallback((description: string) => {
    updateField('description', description || undefined)
  }, [updateField])

  const updateStatus = useCallback((status: Task['status']) => {
    updateField('status', status)
  }, [updateField])

  const updatePriority = useCallback((priority: Task['priority']) => {
    updateField('priority', priority)
  }, [updateField])

  const updateDueDate = useCallback((dueDate: Date | undefined) => {
    updateField('dueDate', dueDate)
  }, [updateField])

  const updateAssignee = useCallback((assigneeId: string | undefined) => {
    updateField('assigneeId', assigneeId)
  }, [updateField])

  return {
    updateTitle,
    updateDescription,
    updateStatus,
    updatePriority,
    updateDueDate,
    updateAssignee,
    isLoading: updateTaskMutation.isPending,
    error: updateTaskMutation.error,
  }
}