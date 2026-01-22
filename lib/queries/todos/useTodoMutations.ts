import { useMutation, useQueryClient } from '@tanstack/react-query'
import { todoKeys } from './query-keys'
import { createTodo, toggleTodo, deleteTodo, clearCompletedTodos } from './api'
import { TodoItem } from '@/types/database'

export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ text, projectId }: { text: string; projectId?: string }) =>
      createTodo(text, projectId),
    onMutate: async ({ text, projectId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.list({ projectId }) })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<TodoItem[]>(
        todoKeys.list({ projectId })
      )

      // Optimistically update the cache
      const optimisticTodo: TodoItem = {
        id: `temp-${Date.now()}`,
        text,
        completed: false,
        position: (previousTodos?.length || 0) + 1,
        userId: 'temp-user', // Will be replaced by real user ID from server
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      queryClient.setQueryData<TodoItem[]>(
        todoKeys.list({ projectId }),
        old => [...(old || []), optimisticTodo]
      )

      return { previousTodos, projectId }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(
          todoKeys.list({ projectId: context.projectId }),
          context.previousTodos
        )
      }
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: todoKeys.list({ projectId: context?.projectId }),
      })
    },
  })
}

export function useToggleTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => toggleTodo(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueriesData<TodoItem[]>({
        queryKey: todoKeys.all,
      })

      // Optimistically update the cache
      previousTodos.forEach(([queryKey, todos]) => {
        if (todos) {
          const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          )
          queryClient.setQueryData(queryKey, updatedTodos)
        }
      })

      return { previousTodos }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, todos]) => {
          queryClient.setQueryData(queryKey, todos)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueriesData<TodoItem[]>({
        queryKey: todoKeys.all,
      })

      // Optimistically update the cache
      previousTodos.forEach(([queryKey, todos]) => {
        if (todos) {
          const updatedTodos = todos.filter(todo => todo.id !== id)
          queryClient.setQueryData(queryKey, updatedTodos)
        }
      })

      return { previousTodos }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, todos]) => {
          queryClient.setQueryData(queryKey, todos)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}

export function useClearCompletedTodos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearCompletedTodos(),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all })

      // Snapshot the previous value
      const previousTodos = queryClient.getQueriesData<TodoItem[]>({
        queryKey: todoKeys.all,
      })

      // Optimistically update the cache
      previousTodos.forEach(([queryKey, todos]) => {
        if (todos) {
          const updatedTodos = todos.filter(todo => !todo.completed)
          queryClient.setQueryData(queryKey, updatedTodos)
        }
      })

      return { previousTodos }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        context.previousTodos.forEach(([queryKey, todos]) => {
          queryClient.setQueryData(queryKey, todos)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: todoKeys.all })
    },
  })
}