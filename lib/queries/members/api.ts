import { createClient } from '@/lib/supabase/client'
import { ProjectMember, InsertProjectMember, UpdateProjectMember, User } from '@/types/database'
import { getUsersByIds } from '@/lib/queries/users/api'

/**
 * Fetch project members with user information
 */
export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: members, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })

  if (error) throw error

  // Convert snake_case to camelCase
  const formattedMembers: ProjectMember[] = members.map(member => ({
    id: member.id,
    projectId: member.project_id,
    userId: member.user_id,
    role: member.role as ProjectMember['role'],
    status: member.status as ProjectMember['status'],
    invitedBy: member.invited_by || undefined,
    joinedAt: new Date(member.joined_at),
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  }))

  // Fetch user information for all members
  const userIds = formattedMembers.map(member => member.userId)
  const users = await getUsersByIds(userIds)

  // Merge user information into members
  const userMap = new Map(users.map(user => [user.id, user]))
  return formattedMembers.map(member => ({
    ...member,
    user: userMap.get(member.userId),
  }))
}

/**
 * Fetch projects that a user participates in
 */
export async function fetchUserProjects(userId?: string): Promise<string[]> {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('User not authenticated')
  }

  const targetUserId = userId || currentUser.id

  const { data: members, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', targetUserId)
    .eq('status', 'active')

  if (error) throw error

  return members.map(member => member.project_id)
}

/**
 * Add a member to a project
 */
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: ProjectMember['role'] = 'member'
): Promise<ProjectMember> {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    throw new Error('User not authenticated')
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()

  if (existingMember) {
    // Update existing member to active if inactive
    if (existingMember.status === 'inactive') {
      return updateProjectMember(existingMember.id, { status: 'active', role })
    }
    throw new Error('User is already a member of this project')
  }

  const { data: newMember, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userId,
      role,
      status: 'active',
      invited_by: currentUser.id,
    })
    .select()
    .single()

  if (error) throw error

  // Fetch user information
  const user = await getUsersByIds([userId])

  return {
    id: newMember.id,
    projectId: newMember.project_id,
    userId: newMember.user_id,
    role: newMember.role as ProjectMember['role'],
    status: newMember.status as ProjectMember['status'],
    invitedBy: newMember.invited_by || undefined,
    joinedAt: new Date(newMember.joined_at),
    createdAt: new Date(newMember.created_at),
    updatedAt: new Date(newMember.updated_at),
    user: user[0],
  }
}

/**
 * Update project member
 */
export async function updateProjectMember(
  memberId: string,
  updates: UpdateProjectMember
): Promise<ProjectMember> {
  const supabase = createClient()

  // Convert camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {}
  if (updates.role !== undefined) dbUpdates.role = updates.role
  if (updates.status !== undefined) dbUpdates.status = updates.status
  dbUpdates.updated_at = new Date().toISOString()

  const { data: updatedMember, error } = await supabase
    .from('project_members')
    .update(dbUpdates)
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error

  // Fetch user information
  const user = await getUsersByIds([updatedMember.user_id])

  return {
    id: updatedMember.id,
    projectId: updatedMember.project_id,
    userId: updatedMember.user_id,
    role: updatedMember.role as ProjectMember['role'],
    status: updatedMember.status as ProjectMember['status'],
    invitedBy: updatedMember.invited_by || undefined,
    joinedAt: new Date(updatedMember.joined_at),
    createdAt: new Date(updatedMember.created_at),
    updatedAt: new Date(updatedMember.updated_at),
    user: user[0],
  }
}

/**
 * Remove member from project (soft delete by setting status to inactive)
 */
export async function removeProjectMember(memberId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('project_members')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)

  if (error) throw error
}

/**
 * Get project member by user ID
 */
export async function getProjectMemberByUserId(
  projectId: string,
  userId: string
): Promise<ProjectMember | null> {
  const supabase = createClient()

  const { data: member, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return null
    }
    throw error
  }

  // Fetch user information
  const user = await getUsersByIds([member.user_id])

  return {
    id: member.id,
    projectId: member.project_id,
    userId: member.user_id,
    role: member.role as ProjectMember['role'],
    status: member.status as ProjectMember['status'],
    invitedBy: member.invited_by || undefined,
    joinedAt: new Date(member.joined_at),
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
    user: user[0],
  }
}

/**
 * Check if user is a member of a project
 */
export async function isUserProjectMember(
  projectId: string,
  userId?: string
): Promise<boolean> {
  const supabase = createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return false
  }

  const targetUserId = userId || currentUser.id

  const { data: member, error } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', targetUserId)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') { // No rows returned
      return false
    }
    throw error
  }

  return !!member
}