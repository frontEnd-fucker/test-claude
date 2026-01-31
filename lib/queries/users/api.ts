import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

/**
 * Search users by email or name
 */
export async function searchUsers(query: string): Promise<User[]> {
  const supabase = createClient()

  // Search in auth.users metadata (name) and email
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('User not authenticated')
  }

  // Note: Supabase Auth doesn't have a direct search API for users
  // In a real app, you might need to create a public.users table
  // or use a different approach. For now, we'll return an empty array.

  // TODO: Implement proper user search
  // This could involve:
  // 1. Creating a public.users table that syncs with auth.users
  // 2. Using a function to search users by email/name
  // 3. Implementing an admin-only search endpoint

  console.warn('User search not fully implemented. Returning empty array.')
  return []
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createClient()

  try {
    // Try to get user from auth.users (admin only)
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error) {
      console.warn('Could not fetch user from auth:', error.message)
      return null
    }

    if (!data || !data.user) {
      return null
    }

    const user = data.user
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at || user.created_at),
    }
  } catch (error) {
    console.warn('Error fetching user:', error)
    return null
  }
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const supabase = createClient()
  const users: User[] = []

  // Fetch users one by one (batch fetching not available in client)
  for (const userId of userIds) {
    const user = await getUserById(userId)
    if (user) {
      users.push(user)
    }
  }

  return users
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || undefined,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at || user.created_at),
  }
}