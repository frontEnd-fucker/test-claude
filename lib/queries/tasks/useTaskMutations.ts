'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { taskKeys } from './query-keys'
import { createTask, updateTask, deleteTask } from './api'
import { Task, TaskStatus, PriorityLevel } from '@/types/database'
import { toast } from 'sonner'

export function useCreateTask() {
  const queryClient = useQueryClient()
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  return useMutation({
    mutationFn: (params: {
      title: string
      description?: string
      priority?: PriorityLevel
      status?: TaskStatus
      projectId?: string
    }) => createTask(
      params.title,
      params.description,
      params.priority,
      params.status,
      params.projectId ?? routeProjectId
    ),
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({
        queryKey: taskKeys.all,
      })

      // Optimistically create a new task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: params.title,
        description: params.description,
        status: (params.status || 'todo') as TaskStatus,
        priority: params.priority as PriorityLevel,
        position: 1, // Will be adjusted by server
        userId: 'temp-user',
        projectId: params.projectId ?? routeProjectId ?? '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update all task lists (only for array queries)
      previousTasks.forEach(([queryKey, data]) => {
        if (!data) return

        // Only update array queries (list queries), not detail queries
        if (Array.isArray(data)) {
          const updatedTasks = [...data, optimisticTask]
          queryClient.setQueryData(queryKey, updatedTasks)
        }
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, tasks]) => {
          queryClient.setQueryData(queryKey, tasks)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; updates: Parameters<typeof updateTask>[1] }) =>
      updateTask(params.id, params.updates),
    onMutate: async ({ id, updates }) => {
      console.log('Optimistically updating task:', { id, updates })
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({
        queryKey: taskKeys.all,
      })

      // Optimistically update the task
      previousTasks.forEach(([queryKey, data]) => {
        if (!data) return

        // Handle array of tasks (list queries)
        if (Array.isArray(data)) {
          const updatedTasks = data.map(task =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          )
          queryClient.setQueryData(queryKey, updatedTasks)
        }
        // Handle single task (detail queries)
        else if (data && typeof data === 'object' && data.id === id) {
          const updatedTask = { ...data, ...updates, updatedAt: new Date() }
          queryClient.setQueryData(queryKey, updatedTask)
        }
      })

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      console.error('Task update failed:', err)
      toast.error('Failed to update task', {
        description: err instanceof Error ? err.message : 'Unknown error occurred'
      })

      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, tasks]) => {
          queryClient.setQueryData(queryKey, tasks)
        })
      }
    },
    onSuccess: (data, variables) => {
      console.log('Task update successful:', { id: data.id, updates: variables.updates })
      // Only show success toast for assignee changes to avoid too many notifications
      if ('assigneeId' in variables.updates) {
        toast.success('Task assigned successfully')
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate the specific task and all lists
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData({
        queryKey: taskKeys.all,
      })

      // Optimistically remove the task
      previousTasks.forEach(([queryKey, data]) => {
        if (!data) return

        // Handle array of tasks (list queries)
        if (Array.isArray(data)) {
          const updatedTasks = data.filter(task => task.id !== id)
          queryClient.setQueryData(queryKey, updatedTasks)
        }
        // Handle single task (detail queries) - if deleting this specific task
        else if (data && typeof data === 'object' && data.id === id) {
          // Set to null or undefined for detail query of the deleted task
          queryClient.setQueryData(queryKey, null)
        }
      })

      return { previousTasks }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, tasks]) => {
          queryClient.setQueryData(queryKey, tasks)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}