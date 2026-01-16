import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskStatus, generateId, now } from '@/types'

interface KanbanStore {
  tasks: Task[]
  addTask: (title: string, description?: string, priority?: Task['priority']) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  reorderTasks: (status: TaskStatus, startIndex: number, endIndex: number) => void
  moveTaskBetweenColumns: (
    sourceStatus: TaskStatus,
    destinationStatus: TaskStatus,
    sourceIndex: number,
    destinationIndex: number
  ) => void
}

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      tasks: [
        {
          id: generateId(),
          title: 'Design database schema',
          description: 'Create ER diagram for user projects',
          status: 'todo',
          priority: 'high',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          title: 'Implement authentication',
          description: 'Set up NextAuth with GitHub and Google',
          status: 'in-progress',
          priority: 'high',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          title: 'Write component tests',
          description: 'Add unit tests for Button and Card components',
          status: 'complete',
          priority: 'medium',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          title: 'Deploy to Vercel',
          description: 'Configure environment variables and deploy',
          status: 'todo',
          priority: 'low',
          createdAt: now(),
          updatedAt: now(),
        },
      ],

      addTask: (title, description, priority) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: generateId(),
              title,
              description,
              status: 'todo',
              priority,
              createdAt: now(),
              updatedAt: now(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: now() }
              : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      moveTask: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, status, updatedAt: now() }
              : task
          ),
        })),

      reorderTasks: (status, startIndex, endIndex) =>
        set((state) => {
          const filteredTasks = state.tasks.filter((task) => task.status === status)
          const [removed] = filteredTasks.splice(startIndex, 1)
          filteredTasks.splice(endIndex, 0, removed)

          return {
            tasks: state.tasks.map((task) =>
              task.status === status
                ? filteredTasks.shift()!
                : task
            ),
          }
        }),

      moveTaskBetweenColumns: (
        sourceStatus,
        destinationStatus,
        sourceIndex,
        destinationIndex
      ) =>
        set((state) => {
          const sourceTasks = state.tasks.filter((task) => task.status === sourceStatus)
          const destinationTasks = state.tasks.filter((task) => task.status === destinationStatus)
          const [movedTask] = sourceTasks.splice(sourceIndex, 1)

          movedTask.status = destinationStatus
          movedTask.updatedAt = now()

          destinationTasks.splice(destinationIndex, 0, movedTask)

          return {
            tasks: state.tasks.map((task) => {
              if (task.status === sourceStatus) {
                return sourceTasks.shift()!
              }
              if (task.status === destinationStatus) {
                return destinationTasks.shift()!
              }
              return task
            }),
          }
        }),
    }),
    {
      name: 'kanban-storage',
    }
  )
)