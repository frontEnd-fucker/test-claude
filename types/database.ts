// Database types - these match the Supabase database schema
// Once you generate types from Supabase, you can replace this file

export type TaskStatus = 'todo' | 'in-progress' | 'complete'
export type PriorityLevel = 'low' | 'medium' | 'high'

export interface User {
  id: string // Supabase UUID
  email: string
  name?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string // References auth.users.id (owner)
  createdAt: Date
  updatedAt: Date
  members?: ProjectMember[]  // Optional member list
  commentsCount?: number // Comments count
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'inactive'
  invitedBy?: string
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
  user?: User  // Associated user information
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority?: PriorityLevel
  position: number
  dueDate?: Date
  projectId: string // References projects.id
  userId: string // References auth.users.id (owner)
  assigneeId?: string // References auth.users.id
  createdAt: Date
  updatedAt: Date
  commentsCount?: number // Comments count
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  position: number
  dueDate?: Date
  userId: string // References auth.users.id
  projectId?: string // References projects.id
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  isArchived: boolean
  userId: string // References auth.users.id
  projectId?: string // References projects.id
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  content: string

  // Associate with either task or project (mutually exclusive)
  taskId?: string
  projectId?: string

  // Reply functionality
  parentId?: string

  // @mentions
  mentionIds?: string[]

  // User information
  userId: string
  createdAt: Date
  updatedAt: Date

  // Associated data (optional, for UI display)
  user?: User
  replies?: Comment[]
  parent?: Comment
}

// Insert types (for creating new records)
export type InsertTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Task, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertTodoItem = Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Note, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Project, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertProjectMember = Omit<ProjectMember, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<ProjectMember, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertComment = {
  content: string
  taskId?: string
  projectId?: string
  parentId?: string
  mentionIds?: string[]
}

// Update types (for updating records)
export type UpdateTask = Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateTodoItem = Partial<Omit<TodoItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateNote = Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateProject = Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateProjectMember = Partial<Omit<ProjectMember, 'id' | 'projectId' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateComment = {
  content?: string
}

// Type guards
export function isTask(obj: unknown): obj is Task {
  return !!(obj && typeof obj === 'object' && obj !== null && 'id' in obj && typeof obj.id === 'string' && 'title' in obj && typeof obj.title === 'string' && 'status' in obj && typeof obj.status === 'string')
}

export function isTodoItem(obj: unknown): obj is TodoItem {
  return !!(obj && typeof obj === 'object' && obj !== null && 'id' in obj && typeof obj.id === 'string' && 'text' in obj && typeof obj.text === 'string' && 'completed' in obj && typeof obj.completed === 'boolean')
}

export function isNote(obj: unknown): obj is Note {
  return !!(obj && typeof obj === 'object' && obj !== null && 'id' in obj && typeof obj.id === 'string' && 'title' in obj && typeof obj.title === 'string' && 'content' in obj && typeof obj.content === 'string')
}

export function isComment(obj: unknown): obj is Comment {
  return !!(obj && typeof obj === 'object' && obj !== null && 'id' in obj && typeof obj.id === 'string' && 'content' in obj && typeof obj.content === 'string' && 'userId' in obj && typeof obj.userId === 'string')
}