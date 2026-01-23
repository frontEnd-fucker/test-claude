import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectKeys } from './query-keys'
import { createProject, updateProject, deleteProject } from './api'
import { Project } from '@/types/database'

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
      previousProjects.forEach(([queryKey, projects = []]) => {
        // Insert at beginning of the list (most recent first)
        const updatedProjects = [optimisticProject, ...projects]
        queryClient.setQueryData(queryKey, updatedProjects)
      })

      return { previousProjects }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, projects]) => {
          queryClient.setQueryData(queryKey, projects)
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
      previousProjects.forEach(([queryKey, projects = []]) => {
        const updatedProjects = projects.map(project =>
          project.id === id ? { ...project, ...updates, updatedAt: new Date() } : project
        )
        queryClient.setQueryData(queryKey, updatedProjects)
      })

      return { previousProjects }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, projects]) => {
          queryClient.setQueryData(queryKey, projects)
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
      previousProjects.forEach(([queryKey, projects = []]) => {
        const updatedProjects = projects.filter(project => project.id !== id)
        queryClient.setQueryData(queryKey, updatedProjects)
      })

      return { previousProjects }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, projects]) => {
          queryClient.setQueryData(queryKey, projects)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}