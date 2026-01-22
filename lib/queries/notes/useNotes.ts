import { useQuery } from '@tanstack/react-query'
import { noteKeys } from './query-keys'
import { fetchNotes } from './api'

interface UseNotesOptions {
  projectId?: string
  isArchived?: boolean
  enabled?: boolean
}

export function useNotes({
  projectId,
  isArchived = false,
  enabled = true,
}: UseNotesOptions = {}) {
  return useQuery({
    queryKey: noteKeys.list({ projectId, isArchived }),
    queryFn: () => fetchNotes({ projectId, isArchived }),
    enabled,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  })
}