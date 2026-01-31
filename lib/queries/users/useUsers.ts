import { useQuery } from '@tanstack/react-query'
import { User } from '@/types/database'
import { searchUsers, getCurrentUser, getUserById, getUsersByIds } from '@/lib/queries/users/api'

/**
 * Hook for searching users
 */
export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['users-search', query],
    queryFn: () => searchUsers(query),
    enabled: query.length >= 2, // Only search when query has at least 2 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting user by ID
 */
export function useUserById(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting multiple users by IDs
 */
export function useUsersByIds(userIds: string[]) {
  return useQuery({
    queryKey: ['users', userIds.sort().join(',')], // Sort to ensure consistent cache key
    queryFn: () => getUsersByIds(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}