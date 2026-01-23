import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToTable } from '@/lib/utils/supabase-helpers'
import { projectKeys } from './query-keys'
import { Project } from '@/types/database'

/**
 * Hook to set up real-time subscriptions for projects
 */
export function useProjectSubscriptions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = subscribeToTable('projects', (payload) => {
      const { eventType, old: oldRecord, new: newRecord } = payload as {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE'
        old: Record<string, unknown>
        new: Record<string, unknown>
      }

      // Convert database record to Project format
      const convertToProject = (record: Record<string, unknown>): Project => ({
        ...record,
        id: record.id as string,
        name: record.name as string,
        description: record.description as string,
        userId: record.user_id as string,
        createdAt: new Date(record.created_at as string),
        updatedAt: new Date(record.updated_at as string),
      })

      switch (eventType) {
        case 'INSERT': {
          const newProject = convertToProject(newRecord)

          // Update all project lists
          queryClient.setQueriesData<Project[]>(
            { queryKey: projectKeys.all },
            (old = []) => [newProject, ...old]
          )
          break
        }

        case 'UPDATE': {
          const updatedProject = convertToProject(newRecord)

          // Update all project lists
          queryClient.setQueriesData<Project[]>(
            { queryKey: projectKeys.all },
            (old = []) => old.map(project =>
              project.id === updatedProject.id ? updatedProject : project
            )
          )
          break
        }

        case 'DELETE': {
          const deletedId = oldRecord.id as string

          // Update all project lists
          queryClient.setQueriesData<Project[]>(
            { queryKey: projectKeys.all },
            (old = []) => old.filter(project => project.id !== deletedId)
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