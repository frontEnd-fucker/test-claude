import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from './query-keys'
import { createProject, updateProject, deleteProject } from './api'
import { Project } from '@/types/database'
import { toast } from 'sonner'

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      name: string
      description?: string
    }) => createProject(
      params.name,
      params.description
    ),
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.all })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData<Project[]>({
        queryKey: projectKeys.all,
      })

      // Optimistically create a new project
      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        name: params.name,
        description: params.description,
        userId: 'temp-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update all project lists (prepend for the list)
      previousProjects.forEach(([queryKey, data]) => {
        // Only update if data is an array (list queries)
        const projects = Array.isArray(data) ? data : []
        // Insert at beginning of the list (most recent first)
        const updatedProjects = [optimisticProject, ...projects]
        queryClient.setQueryData(queryKey, updatedProjects)
      })

      return { previousProjects, optimisticProjectId: optimisticProject.id }
    },
    onSuccess: (data, variables, context) => {
      toast.success('Project created successfully')

      // Replace the optimistic project with the real one and remove any duplicates
      if (context?.optimisticProjectId) {
        const allQueries = queryClient.getQueriesData<Project | Project[]>({
          queryKey: projectKeys.all,
        })

        allQueries.forEach(([queryKey, queryData]) => {
          if (Array.isArray(queryData)) {
            // List query - replace the temporary project with the real one
            let updatedProjects = queryData.map(project =>
              project.id === context.optimisticProjectId ? data : project
            )

            // Remove any duplicate projects with the same ID as the new project
            // Keep only the first occurrence (which should be the replacement we just made)
            const seenIds = new Set<string>()
            updatedProjects = updatedProjects.filter(project => {
              if (seenIds.has(project.id)) {
                return false
              }
              seenIds.add(project.id)
              return true
            })

            queryClient.setQueryData(queryKey, updatedProjects)
          }
        })
      }
    },
    onError: (err, variables, context) => {
      console.error('Failed to create project:', err)
      toast.error('Failed to create project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })

      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; updates: Parameters<typeof updateProject>[1] }) =>
      updateProject(params.id, params.updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.all })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData<Project[]>({
        queryKey: projectKeys.all,
      })

      // Optimistically update the project
      previousProjects.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          // List query - update the project in the array
          const updatedProjects = data.map(project =>
            project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
          )
          queryClient.setQueryData(queryKey, updatedProjects)
        } else if (data && typeof data === 'object' && (data as Project).id === id) {
          // Detail query for this specific project - update the object
          queryClient.setQueryData(queryKey, { ...(data as Project), ...updates, updatedAt: new Date() })
        }
        // If data is not an array or the matching project object, skip
      })

      return { previousProjects }
    },
    onSuccess: () => {
      toast.success('Project updated successfully')
    },
    onError: (err, variables, context) => {
      console.error('Failed to update project:', err)
      toast.error('Failed to update project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })

      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate the specific project and all lists
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.all })

      // Snapshot the previous value
      const previousProjects = queryClient.getQueriesData<Project[]>({
        queryKey: projectKeys.all,
      })

      // Optimistically remove the project
      previousProjects.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          // List query - remove the project from the array
          const updatedProjects = data.filter(project => project.id !== id)
          queryClient.setQueryData(queryKey, updatedProjects)
        } else if (data && typeof data === 'object' && (data as Project).id === id) {
          // Detail query for this specific project - remove the data (set to undefined)
          queryClient.setQueryData(queryKey, undefined)
        }
        // If data is not an array or the matching project object, skip
      })

      return { previousProjects }
    },
    onSuccess: () => {
      toast.success('Project deleted successfully')
    },
    onError: (err, id, context) => {
      console.error('Failed to delete project:', err)
      toast.error('Failed to delete project', {
        description: err instanceof Error ? err.message : 'Unknown error occurred',
      })

      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}