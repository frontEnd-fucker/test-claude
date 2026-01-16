import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TodoItem, generateId, now } from '@/types'

interface TodoStore {
  todos: TodoItem[]
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  clearCompleted: () => void
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [
        { id: generateId(), text: 'Review PR #123', completed: false, createdAt: now() },
        { id: generateId(), text: 'Update documentation', completed: true, createdAt: now() },
        { id: generateId(), text: 'Plan next sprint', completed: false, createdAt: now() },
        { id: generateId(), text: 'Fix mobile responsive bug', completed: false, createdAt: now() },
      ],

      addTodo: (text) =>
        set((state) => ({
          todos: [
            ...state.todos,
            { id: generateId(), text, completed: false, createdAt: now() },
          ],
        })),

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          ),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),
    }),
    {
      name: 'todo-storage',
    }
  )
)