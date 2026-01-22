import { useQuery } from '@tanstack/react-query'
import { todoKeys } from './query-keys'
import { fetchTodos } from './api'

interface UseTodosOptions {
  projectId?: string
  enabled?: boolean
}

export function useTodos({ projectId, enabled = true }: UseTodosOptions = {}) {
  return useQuery({
    queryKey: todoKeys.list({ projectId }),
    queryFn: () => fetchTodos(projectId),
    enabled,
    // Keep data fresh for 1 minute, cache for 5 minutes
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  })
}