import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Task, TaskStatus, generateId, now } from '@/types'

interface KanbanStore {
  tasks: Task[]
  addTask: (title: string, description?: string, priority?: Task['priority'], status?: TaskStatus) => void
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

      addTask: (title, description, priority, status = 'todo') =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: generateId(),
              title,
              description,
              status,
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
          // 1. 分离源列和目标列任务
          const sourceTasks = state.tasks.filter((task) => task.status === sourceStatus)
          const destinationTasks = state.tasks.filter((task) => task.status === destinationStatus)

          // 2. 从源列移除任务
          const [movedTask] = sourceTasks.splice(sourceIndex, 1)

          // 3. 更新任务状态和时间戳
          movedTask.status = destinationStatus
          movedTask.updatedAt = now()

          // 4. 插入到目标列
          destinationTasks.splice(destinationIndex, 0, movedTask)

          // 5. 收集其他列的任务（状态既不是源列也不是目标列）
          const otherTasks = state.tasks.filter(
            (task) => task.status !== sourceStatus && task.status !== destinationStatus
          )

          // 6. 重新构建完整任务数组（保持列内顺序）
          const updatedTasks = [...otherTasks, ...sourceTasks, ...destinationTasks]

          return { tasks: updatedTasks }
        }),
    }),
    {
      name: 'kanban-storage',
    }
  )
)