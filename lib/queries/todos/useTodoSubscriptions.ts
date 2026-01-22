import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { todoKeys } from './query-keys'
import { TodoItem } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for todos
 */
export function useTodoSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('todos', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to TodoItem format
      const convertToTodoItem = (record: Record<string, unknown>): TodoItem => ({
        ...record,
        id: record.id as string,
        text: record.text as string,
        completed: record.completed as boolean,
        position: record.position as number,
        userId: record.user_id as string,
        projectId: record.project_id as string,
        dueDate: record.due_date ? new Date(record.due_date as string) : undefined,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newTodo = convertToTodoItem(newRecord)

          // Update all todo lists
          queryClient.setQueriesData<TodoItem[]>(
            { queryKey: todoKeys.all },
            (old = []) => [...old, newTodo]
          )
          break
        }

        case 'UPDATE': {
          const updatedTodo = convertToTodoItem(newRecord)

          // Update all todo lists
          queryClient.setQueriesData<TodoItem[]>(
            { queryKey: todoKeys.all },
            (old = []) => old.map(todo =>
              todo.id === updatedTodo.id ? updatedTodo : todo
            )
          )
          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // Update all todo lists
          queryClient.setQueriesData<TodoItem[]>(
            { queryKey: todoKeys.all },
            (old = []) => old.filter(todo => todo.id !== deletedId)
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