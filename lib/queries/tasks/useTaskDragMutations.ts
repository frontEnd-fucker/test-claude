import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskKeys } from './query-keys'
import { reorderTasks, moveTaskBetweenColumns } from './api'
import { Task, TaskStatus } from '@/types/database'
import { toast } from 'sonner'

// Optimistic update versioning to prevent race conditions
let optimisticVersion = 0

export function useReorderTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      status: TaskStatus
      startIndex: number
      endIndex: number
      projectId?: string
    }) => reorderTasks(params.status, params.startIndex, params.endIndex, params.projectId),
    onMutate: async ({ status, startIndex, endIndex, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list({ projectId }) })

      // Get current optimistic version and increment for this mutation
      const version = ++optimisticVersion

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.list({ projectId }),
      })

      // Optimistically reorder tasks in the specified column
      previousTasks.forEach(([queryKey, tasks = []]) => {
        const columnTasks = tasks.filter(task => task.status === status)
        const otherTasks = tasks.filter(task => task.status !== status)

        if (startIndex === endIndex) {
          return
        }

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
      })

      return { previousTasks, version }
    },
    onSuccess: (data, variables, context) => {
      // Only show success toast for the latest optimistic update
      if (context?.version === optimisticVersion) {
        toast.success('Task reordered successfully')
      }
    },
    onError: (err, variables, context) => {
      // Only rollback and show error for the latest optimistic update
      if (context?.version === optimisticVersion) {
        // Rollback on error
        if (context.previousTasks) {
          context.previousTasks.forEach(([queryKey, tasks]) => {
            queryClient.setQueryData(queryKey, tasks)
          })
        }
        toast.error('Failed to reorder task', {
          description: err instanceof Error ? err.message : 'An unknown error occurred'
        })
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only refetch for the latest optimistic update
      if (context?.version === optimisticVersion) {
        queryClient.invalidateQueries({ queryKey: taskKeys.list({ projectId: variables.projectId }) })
      }
    },
  })
}

export function useMoveTaskBetweenColumns() {
  const queryClient = useQueryClient()

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
      params.projectId
    ),
    onMutate: async ({
      sourceStatus,
      destinationStatus,
      sourceIndex,
      destinationIndex,
      projectId,
    }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.list({ projectId }) })

      // Get current optimistic version and increment for this mutation
      const version = ++optimisticVersion

      // Snapshot the previous value
      const previousTasks = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.list({ projectId }),
      })

      // Optimistically move task between columns
      previousTasks.forEach(([queryKey, tasks = []]) => {
        // Find the task being moved
        const sourceTasks = tasks.filter(task => task.status === sourceStatus)
        const destinationTasks = tasks.filter(task => task.status === destinationStatus)
        const otherTasks = tasks.filter(
          task => task.status !== sourceStatus && task.status !== destinationStatus
        )

        const [movedTask] = sourceTasks.splice(sourceIndex, 1)
        if (!movedTask) return

        // Update task status and insert at destination position
        movedTask.status = destinationStatus
        destinationTasks.splice(destinationIndex, 0, movedTask)

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
      })

      return { previousTasks, version }
    },
    onSuccess: (data, variables, context) => {
      // Only show success toast for the latest optimistic update
      if (context?.version === optimisticVersion) {
        toast.success('Task moved successfully')
      }
    },
    onError: (err, variables, context) => {
      // Only rollback and show error for the latest optimistic update
      if (context?.version === optimisticVersion) {
        // Rollback on error
        if (context.previousTasks) {
          context.previousTasks.forEach(([queryKey, tasks]) => {
            queryClient.setQueryData(queryKey, tasks)
          })
        }
        toast.error('Failed to move task', {
          description: err instanceof Error ? err.message : 'An unknown error occurred'
        })
      }
    },
    onSettled: (data, error, variables, context) => {
      // Only refetch for the latest optimistic update
      if (context?.version === optimisticVersion) {
        queryClient.invalidateQueries({ queryKey: taskKeys.list({ projectId: variables.projectId }) })
      }
    },
  })
}