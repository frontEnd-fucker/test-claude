'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { todoKeys } from './query-keys'
import { fetchTodos } from './api'

interface UseTodosOptions {
  projectId?: string
  enabled?: boolean
}

export function useTodos({ projectId: externalProjectId, enabled = true }: UseTodosOptions = {}) {
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  // 优先使用外部传入的projectId，否则使用路由参数
  const projectId = externalProjectId ?? routeProjectId

  return useQuery({
    queryKey: todoKeys.list({ projectId }),
    queryFn: () => fetchTodos(projectId),
    enabled: enabled && !!projectId, // 如果没有projectId则禁用查询
    // Keep data fresh for 1 minute, cache for 5 minutes
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  })
}