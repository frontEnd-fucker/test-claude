export type TaskStatus = 'todo' | 'in-progress' | 'complete'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  priority?: 'low' | 'medium' | 'high'
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: Date
}

export interface Note {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function now(): Date {
  return new Date()
}