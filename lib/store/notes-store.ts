import { create } from 'zustand'
import { Note } from '@/types/database'

interface NotesStore {
  activeNoteId: string | null
  setActiveNote: (id: string | null) => void

  // Project filtering
  selectedProjectId: string | null
  setSelectedProjectId: (projectId: string | null) => void
  clearSelectedProject: () => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  activeNoteId: null,
  setActiveNote: (id) => {
    set({ activeNoteId: id })
  },

  selectedProjectId: null,
  setSelectedProjectId: (projectId) => set({ selectedProjectId: projectId }),
  clearSelectedProject: () => set({ selectedProjectId: null }),
}))

// Note: Real-time subscriptions are now handled by TanStack Query
// via useNoteSubscriptions hook