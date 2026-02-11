'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { commentKeys } from './query-keys'
import { fetchComments } from './api'

interface UseCommentsOptions {
  taskId?: string
  projectId?: string
  enabled?: boolean
}

export function useComments({
  taskId: externalTaskId,
  projectId: externalProjectId,
  enabled = true,
}: UseCommentsOptions = {}) {
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  // Priority: external taskId > external projectId > route projectId
  const taskId = externalTaskId
  const projectId = externalProjectId ?? routeProjectId

  return useQuery({
    queryKey: commentKeys.list({ taskId, projectId }),
    queryFn: () => fetchComments({ taskId, projectId }),
    enabled: enabled && (!!taskId || !!projectId), // Disable if no target
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}