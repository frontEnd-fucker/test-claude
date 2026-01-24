'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { taskKeys } from './query-keys'
import { createTask, updateTask, deleteTask } from './api'
import { Task, TaskStatus, PriorityLevel } from '@/types/database'

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
      const previousTasks = queryClient.getQueriesData<Task[]>({
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

      // Update all task lists (prepend for the column)
      previousTasks.forEach(([queryKey, tasks = []]) => {
        // Insert at beginning of the appropriate column
        const updatedTasks = [...tasks, optimisticTask]
        queryClient.setQueryData(queryKey, updatedTasks)
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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.all })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.all,
      })

      // Optimistically update the task
      previousTasks.forEach(([queryKey, tasks = []]) => {
        const updatedTasks = tasks.map(task =>
          task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
        )
        queryClient.setQueryData(queryKey, updatedTasks)
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
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.all,
      })

      // Optimistically remove the task
      previousTasks.forEach(([queryKey, tasks = []]) => {
        const updatedTasks = tasks.filter(task => task.id !== id)
        queryClient.setQueryData(queryKey, updatedTasks)
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