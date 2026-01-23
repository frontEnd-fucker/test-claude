import { create } from 'zustand'

// UI state for todos (filtering, sorting, etc.)
interface TodoStore {
  // Project filtering
  selectedProjectId: string | null

  // Actions
  setSelectedProjectId: (projectId: string | null) => void
  clearSelectedProject: () => void
}

export const useTodoStore = create<TodoStore>((set) => ({
  selectedProjectId: null,

  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  clearSelectedProject: () => set({ selectedProjectId: null }),
}))

// Note: Real-time subscriptions are now handled by TanStack Query
// via useTodoSubscriptions hook