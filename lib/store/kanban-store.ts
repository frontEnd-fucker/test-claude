import { create } from 'zustand'

// UI state for kanban board (filtering, sorting, etc.)
interface KanbanStore {
  // Project filtering
  selectedProjectId: string | null

  // Actions
  setSelectedProjectId: (projectId: string | null) => void
  clearSelectedProject: () => void
}

export const useKanbanStore = create<KanbanStore>((set) => ({
  selectedProjectId: null,

  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  clearSelectedProject: () => set({ selectedProjectId: null }),
}))

// Note: Real-time subscriptions are now handled by TanStack Query
// via useTaskSubscriptions hook