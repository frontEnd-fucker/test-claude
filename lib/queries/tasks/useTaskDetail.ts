'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchTask } from './api'
import { taskKeys } from './query-keys'

export function useTaskDetail(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchTask(id),
    enabled: !!id,
  })
}