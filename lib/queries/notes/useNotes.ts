'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { noteKeys } from './query-keys'
import { fetchNotes } from './api'

interface UseNotesOptions {
  projectId?: string
  isArchived?: boolean
  enabled?: boolean
}

export function useNotes({
  projectId: externalProjectId,
  isArchived = false,
  enabled = true,
}: UseNotesOptions = {}) {
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  // 优先使用外部传入的projectId，否则使用路由参数
  const projectId = externalProjectId ?? routeProjectId

  return useQuery({
    queryKey: noteKeys.list({ projectId, isArchived }),
    queryFn: () => fetchNotes({ projectId, isArchived }),
    enabled: enabled && !!projectId, // 如果没有projectId则禁用查询
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  })
}