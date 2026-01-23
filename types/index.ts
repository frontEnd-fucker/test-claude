// Re-export database types for backward compatibility
export type { TaskStatus, PriorityLevel } from './database'
export type { Task, TodoItem, Note, Project, InsertProject, UpdateProject } from './database'

// Helper functions
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function now(): Date {
  return new Date()
}