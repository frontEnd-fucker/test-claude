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

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<TodoItem | TodoItem[]>({
            queryKey: todoKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 添加新待办事项到末尾（保持现有顺序）
              queryClient.setQueryData(queryKey, [...data, newTodo])
            }
            // 详情查询不需要处理INSERT事件
          })

          break
        }

        case 'UPDATE': {
          const updatedTodo = convertToTodoItem(newRecord)

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<TodoItem | TodoItem[]>({
            queryKey: todoKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 更新数组中的待办事项
              const updatedTodos = data.map(todo =>
                todo.id === updatedTodo.id ? updatedTodo : todo
              )
              queryClient.setQueryData(queryKey, updatedTodos)
            } else if (data && typeof data === 'object' && (data as TodoItem).id === updatedTodo.id) {
              // 详情查询 - 更新单个待办事项
              queryClient.setQueryData(queryKey, updatedTodo)
            }
            // 其他情况不处理
          })

          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // 获取所有匹配的查询
          const allQueries = queryClient.getQueriesData<TodoItem | TodoItem[]>({
            queryKey: todoKeys.all,
          })

          // 对每个查询单独处理
          allQueries.forEach(([queryKey, data]) => {
            if (Array.isArray(data)) {
              // 列表查询 - 从数组中移除待办事项
              const updatedTodos = data.filter(todo => todo.id !== deletedId)
              queryClient.setQueryData(queryKey, updatedTodos)
            } else if (data && typeof data === 'object' && (data as TodoItem).id === deletedId) {
              // 详情查询 - 设置为undefined
              queryClient.setQueryData(queryKey, undefined)
            }
          })

          break
        }
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [queryClient])
}