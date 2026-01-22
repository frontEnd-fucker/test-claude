import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { noteKeys } from './query-keys'
import { Note } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for notes
 */
export function useNoteSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('notes', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Note format
      const convertToNote = (record: Record<string, unknown>): Note => ({
        ...record,
        id: record.id as string,
        title: record.title as string,
        content: record.content as string,
        tags: record.tags as string[],
        isArchived: record.is_archived as boolean,
        userId: record.user_id as string,
        projectId: record.project_id as string,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newNote = convertToNote(newRecord)

          // Update all note lists (prepend for chronological order)
          queryClient.setQueriesData<Note[]>(
            { queryKey: noteKeys.all },
            (old = []) => [newNote, ...old]
          )
          break
        }

        case 'UPDATE': {
          const updatedNote = convertToNote(newRecord)

          // Update all note lists
          queryClient.setQueriesData<Note[]>(
            { queryKey: noteKeys.all },
            (old = []) => old.map(note =>
              note.id === updatedNote.id ? updatedNote : note
            )
          )
          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // Update all note lists
          queryClient.setQueriesData<Note[]>(
            { queryKey: noteKeys.all },
            (old = []) => old.filter(note => note.id !== deletedId)
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