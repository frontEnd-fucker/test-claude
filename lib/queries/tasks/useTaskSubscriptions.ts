import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { taskKeys } from './query-keys'
import { Task } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for tasks
 */
export function useTaskSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('tasks', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Task format
      const convertToTask = (record: Record<string, unknown>): Task => ({
        ...record,
        id: record.id as string,
        title: record.title as string,
        description: record.description as string,
        status: record.status as Task['status'],
        priority: record.priority as Task['priority'],
        position: record.position as number,
        userId: record.user_id as string,
        projectId: record.project_id as string,
        dueDate: record.due_date ? new Date(record.due_date as string) : undefined,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newTask = convertToTask(newRecord)

          // Update all task lists
          queryClient.setQueriesData<Task[]>(
            { queryKey: taskKeys.all },
            (old = []) => [...old, newTask]
          )
          break
        }

        case 'UPDATE': {
          const updatedTask = convertToTask(newRecord)

          // Update all task lists
          queryClient.setQueriesData<Task[]>(
            { queryKey: taskKeys.all },
            (old = []) => old.map(task =>
              task.id === updatedTask.id ? updatedTask : task
            )
          )
          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // Update all task lists
          queryClient.setQueriesData<Task[]>(
            { queryKey: taskKeys.all },
            (old = []) => old.filter(task => task.id !== deletedId)
          )
          break
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])
}