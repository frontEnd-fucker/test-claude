import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ProjectMember, InsertProjectMember, UpdateProjectMember } from '@/types/database'
import {
  fetchProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  getProjectMemberByUserId,
  isUserProjectMember,
} from '@/lib/queries/members/api'

/**
 * Hook for fetching project members
 */
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => fetchProjectMembers(projectId),
    enabled: !!projectId,
  })
}

/**
 * Hook for adding a project member
 */
export function useAddProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role = 'member',
    }: {
      projectId: string
      userId: string
      role?: ProjectMember['role']
    }) => addProjectMember(projectId, userId, role),
    onSuccess: (data, variables) => {
      // Invalidate project members query
      queryClient.invalidateQueries({
        queryKey: ['project-members', variables.projectId],
      })
    },
  })
}

/**
 * Hook for updating a project member
 */
export function useUpdateProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      updates,
    }: {
      memberId: string
      updates: UpdateProjectMember
    }) => updateProjectMember(memberId, updates),
    onSuccess: (data) => {
      // Invalidate project members query for the project
      queryClient.invalidateQueries({
        queryKey: ['project-members', data.projectId],
      })
    },
  })
}

/**
 * Hook for removing a project member
 */
export function useRemoveProjectMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberId: string) => removeProjectMember(memberId),
    onSuccess: (_, memberId) => {
      // We need to get the project ID to invalidate the correct query
      // This is a limitation - we might need to pass projectId as well
      // For now, we'll invalidate all project members queries
      queryClient.invalidateQueries({
        queryKey: ['project-members'],
      })
    },
  })
}

/**
 * Hook for checking if user is a project member
 */
export function useIsUserProjectMember(projectId: string, userId?: string) {
  return useQuery({
    queryKey: ['project-member-check', projectId, userId],
    queryFn: () => isUserProjectMember(projectId, userId),
    enabled: !!projectId,
  })
}

/**
 * Hook for getting project member by user ID
 */
export function useProjectMemberByUserId(projectId: string, userId: string) {
  return useQuery({
    queryKey: ['project-member', projectId, userId],
    queryFn: () => getProjectMemberByUserId(projectId, userId),
    enabled: !!projectId && !!userId,
  })
}