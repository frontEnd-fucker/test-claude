import { ProjectMember } from '@/types/database'

export type Permission =
  | 'view_project'
  | 'edit_project'
  | 'delete_project'
  | 'manage_members'
  | 'create_task'
  | 'edit_task'
  | 'delete_task'
  | 'assign_task'
  | 'view_todos'
  | 'edit_todos'
  | 'view_notes'
  | 'edit_notes'
  | 'view_comments'
  | 'edit_comments'

export const ROLE_PERMISSIONS: Record<ProjectMember['role'], Permission[]> = {
  owner: [
    'view_project',
    'edit_project',
    'delete_project',
    'manage_members',
    'create_task',
    'edit_task',
    'delete_task',
    'assign_task',
    'view_todos',
    'edit_todos',
    'view_notes',
    'edit_notes',
    'view_comments',
    'edit_comments',
  ],
  admin: [
    'view_project',
    'edit_project',
    'manage_members',
    'create_task',
    'edit_task',
    'delete_task',
    'assign_task',
    'view_todos',
    'edit_todos',
    'view_notes',
    'edit_notes',
    'view_comments',
    'edit_comments',
  ],
  member: [
    'view_project',
    'create_task',
    'edit_task',
    'assign_task',
    'view_todos',
    'edit_todos',
    'view_notes',
    'edit_notes',
    'view_comments',
    'edit_comments',
  ],
  viewer: [
    'view_project',
    'view_todos',
    'view_notes',
    'view_comments',
  ],
}

/**
 * Check if a member has a specific permission
 */
export function hasPermission(member: ProjectMember | null, permission: Permission): boolean {
  if (!member) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[member.role] || []
  return permissions.includes(permission)
}

/**
 * Check if member can manage project members
 */
export function canManageMembers(member: ProjectMember | null): boolean {
  return hasPermission(member, 'manage_members')
}

/**
 * Check if member can assign tasks
 */
export function canAssignTasks(member: ProjectMember | null): boolean {
  return hasPermission(member, 'assign_task')
}

/**
 * Check if member can edit project details
 */
export function canEditProject(member: ProjectMember | null): boolean {
  return hasPermission(member, 'edit_project')
}

/**
 * Check if member can delete project
 */
export function canDeleteProject(member: ProjectMember | null): boolean {
  return hasPermission(member, 'delete_project')
}

/**
 * Check if member can create tasks
 */
export function canCreateTasks(member: ProjectMember | null): boolean {
  return hasPermission(member, 'create_task')
}

/**
 * Check if member can edit tasks
 */
export function canEditTasks(member: ProjectMember | null): boolean {
  return hasPermission(member, 'edit_task')
}

/**
 * Check if member can delete tasks
 */
export function canDeleteTasks(member: ProjectMember | null): boolean {
  return hasPermission(member, 'delete_task')
}

/**
 * Check if member can view comments
 */
export function canViewComments(member: ProjectMember | null): boolean {
  return hasPermission(member, 'view_comments')
}

/**
 * Check if member can create comments
 */
export function canCreateComments(member: ProjectMember | null): boolean {
  return hasPermission(member, 'edit_comments')
}

/**
 * Check if member can edit comments
 */
export function canEditComments(member: ProjectMember | null): boolean {
  return hasPermission(member, 'edit_comments')
}

/**
 * Check if member can delete comments
 */
export function canDeleteComments(
  isAuthor: boolean,
  member: ProjectMember | null
): boolean {
  // Author can delete their own comments
  if (isAuthor) return true

  // Admin and owner can delete any comments
  return member?.role === 'owner' || member?.role === 'admin'
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: ProjectMember['role']): string {
  const displayNames: Record<ProjectMember['role'], string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  }
  return displayNames[role]
}

/**
 * Get role color
 */
export function getRoleColor(role: ProjectMember['role']): string {
  const colors: Record<ProjectMember['role'], string> = {
    owner: 'bg-purple-500 text-white',
    admin: 'bg-blue-500 text-white',
    member: 'bg-green-500 text-white',
    viewer: 'bg-gray-500 text-white',
  }
  return colors[role]
}