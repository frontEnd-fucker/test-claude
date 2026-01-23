import { create } from 'zustand'

interface ProjectStore {
  // Currently selected project ID for global filtering
  selectedProjectId: string | null

  // Actions
  setSelectedProjectId: (projectId: string | null) => void
  clearSelectedProject: () => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  selectedProjectId: null,

  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  clearSelectedProject: () => set({ selectedProjectId: null }),
}))