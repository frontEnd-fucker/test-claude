import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

/**
 * Search users by email or name
 */
export async function searchUsers(query: string): Promise<User[]> {
  const supabase = createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('User not authenticated')
  }

  // Search in public.profiles table
  if (query.length < 2) {
    return [] // Require at least 2 characters for search
  }

  const searchQuery = `%${query}%`

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.ilike.${searchQuery},name.ilike.${searchQuery}`)
    .limit(10)

  if (error) {
    console.warn('Error searching users:', error.message)
    return []
  }

  if (!data) {
    return []
  }

  return data.map(profile => ({
    id: profile.id,
    email: profile.email,
    name: profile.name || undefined,
    avatarUrl: profile.avatar_url || undefined,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  }))
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createClient()

  try {
    // Get user from public.profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.warn('Error fetching user by ID from profiles:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name || undefined,
      avatarUrl: data.avatar_url || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.warn('Error fetching user:', error)
    return null
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createClient()

  try {
    // Search in public.profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error) {
      console.warn('Error fetching user by email from profiles:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name || undefined,
      avatarUrl: data.avatar_url || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.warn('Error fetching user by email:', error)
    return null
  }
}

/**
 * Get multiple users by IDs
 */
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  const supabase = createClient()

  if (userIds.length === 0) {
    return []
  }

  // Use IN clause for batch fetching
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) {
    console.warn('Error fetching users by IDs:', error.message)
    // Fallback to individual fetching
    const users: User[] = []
    for (const userId of userIds) {
      const user = await getUserById(userId)
      if (user) {
        users.push(user)
      }
    }
    return users
  }

  if (!data) {
    return []
  }

  return data.map(profile => ({
    id: profile.id,
    email: profile.email,
    name: profile.name || undefined,
    avatarUrl: profile.avatar_url || undefined,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  }))
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