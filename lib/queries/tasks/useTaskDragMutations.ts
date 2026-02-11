'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { taskKeys } from './query-keys'
import { reorderTasks, moveTaskBetweenColumns } from './api'
import { Task, TaskStatus } from '@/types/database'
import { toast } from 'sonner'

// Optimistic update versioning to prevent race conditions
let optimisticVersion = 0

export function useReorderTasks() {
  const queryClient = useQueryClient()
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  return useMutation({
    mutationFn: (params: {
      status: TaskStatus
      startIndex: number
      endIndex: number
      projectId?: string
    }) => reorderTasks(params.status, params.startIndex, params.endIndex, params.projectId ?? routeProjectId),
    onMutate: async ({ status, startIndex, endIndex, projectId: paramProjectId }) => {
      const projectId = paramProjectId ?? routeProjectId
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list({ projectId }) })

      // Get current optimistic version and increment for this mutation
      const version = ++optimisticVersion

      // Snapshot the previous value
      const queryKey = taskKeys.list({ projectId })
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (!previousTasks) {
        return { previousTasks: null, version, projectId }
      }

      if (startIndex === endIndex) {
        return { previousTasks, version, projectId }
      }

      // Optimistically reorder tasks in the specified column
      const columnTasks = previousTasks.filter(task => task.status === status)
      const otherTasks = previousTasks.filter(task => task.status !== status)

      // Reorder within column
      const reorderedColumnTasks = [...columnTasks]
      const [movedTask] = reorderedColumnTasks.splice(startIndex, 1)
      reorderedColumnTasks.splice(endIndex, 0, movedTask)

      // Update positions
      const updatedColumnTasks = reorderedColumnTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }))

      // Combine back with other tasks
      const updatedTasks = [...otherTasks, ...updatedColumnTasks]
      queryClient.setQueryData(queryKey, updatedTasks)

      return { previousTasks, version, projectId }
    },
    onSuccess: () => {
      // Success toast is shown
    },
    onError: (err, variables, context) => {
      // Only rollback and show error for the latest optimistic update
      if (context?.version === optimisticVersion) {
        // Rollback on error
        if (context.previousTasks && context.projectId !== undefined) {
          const queryKey = taskKeys.list({ projectId: context.projectId })
          queryClient.setQueryData(queryKey, context.previousTasks)
        }
        toast.error('Failed to reorder task', {
          description: err instanceof Error ? err.message : 'An unknown error occurred'
        })
      }
    },
    onSettled: () => {
      // No refetch needed - the optimistic update is already in place
      // and server should have the same data
    },
  })
}

export function useMoveTaskBetweenColumns() {
  const queryClient = useQueryClient()
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  return useMutation({
    mutationFn: (params: {
      sourceStatus: TaskStatus
      destinationStatus: TaskStatus
      sourceIndex: number
      destinationIndex: number
      projectId?: string
    }) => moveTaskBetweenColumns(
      params.sourceStatus,
      params.destinationStatus,
      params.sourceIndex,
      params.destinationIndex,
      params.projectId ?? routeProjectId
    ),
    onMutate: async ({
      sourceStatus,
      destinationStatus,
      sourceIndex,
      destinationIndex,
      projectId: paramProjectId,
    }) => {
      const projectId = paramProjectId ?? routeProjectId
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list({ projectId }) })

      // Get current optimistic version and increment for this mutation
      const version = ++optimisticVersion

      // Snapshot the previous value
      const queryKey = taskKeys.list({ projectId })
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (!previousTasks) {
        return { previousTasks: null, version, projectId }
      }

      // Optimistically move task between columns
      const sourceTasks = previousTasks.filter(task => task.status === sourceStatus)
      const destinationTasks = previousTasks.filter(task => task.status === destinationStatus)
      const otherTasks = previousTasks.filter(
        task => task.status !== sourceStatus && task.status !== destinationStatus
      )

      const [movedTask] = sourceTasks.splice(sourceIndex, 1)
      if (!movedTask) {
        return { previousTasks, version, projectId }
      }

      // Update task status and insert at destination position
      const movedTaskWithNewStatus = { ...movedTask, status: destinationStatus }
      destinationTasks.splice(destinationIndex, 0, movedTaskWithNewStatus)

      // Update positions for source column
      const updatedSourceTasks = sourceTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }))

      // Update positions for destination column
      const updatedDestinationTasks = destinationTasks.map((task, index) => ({
        ...task,
        position: index + 1,
      }))

      // Combine all tasks
      const updatedTasks = [
        ...otherTasks,
        ...updatedSourceTasks,
        ...updatedDestinationTasks,
      ]

      queryClient.setQueryData(queryKey, updatedTasks)

      return { previousTasks, version, projectId }
    },
    onSuccess: () => {
      // Success toast is shown
    },
    onError: (err, variables, context) => {
      // Only rollback and show error for the latest optimistic update
      if (context?.version === optimisticVersion) {
        // Rollback on error
        if (context.previousTasks && context.projectId !== undefined) {
          const queryKey = taskKeys.list({ projectId: context.projectId })
          queryClient.setQueryData(queryKey, context.previousTasks)
        }
        toast.error('Failed to move task', {
          description: err instanceof Error ? err.message : 'An unknown error occurred'
        })
      }
    },
    onSettled: () => {
      // No refetch needed - the optimistic update is already in place
      // and server should have the same data
    },
  })
}
