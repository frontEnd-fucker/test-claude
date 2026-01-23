// Database types - these match the Supabase database schema
// Once you generate types from Supabase, you can replace this file

export type TaskStatus = 'todo' | 'in-progress' | 'complete'
export type PriorityLevel = 'low' | 'medium' | 'high'

export interface User {
  id: string // Supabase UUID
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  description?: string
  userId: string // References auth.users.id
  createdAt: Date
  updatedAt: Date
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

// Insert types (for creating new records)
export type InsertTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Task, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertTodoItem = Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<TodoItem, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Note, 'id' | 'createdAt' | 'updatedAt'>>
export type InsertProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Project, 'id' | 'createdAt' | 'updatedAt'>>

// Update types (for updating records)
export type UpdateTask = Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateTodoItem = Partial<Omit<TodoItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateNote = Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
export type UpdateProject = Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>

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