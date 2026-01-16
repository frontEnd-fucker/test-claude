import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Note, generateId, now } from '@/types'

interface NotesStore {
  notes: Note[]
  activeNoteId: string | null
  addNote: (content: string) => void
  updateNote: (id: string, content: string) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
}

export const useNotesStore = create<NotesStore>()(
  persist(
    (set) => ({
      notes: [
        {
          id: generateId(),
          content: '# Project Ideas\n- Implement dark mode toggle\n- Add keyboard shortcuts\n- Create export functionality',
          createdAt: now(),
          updatedAt: now(),
        },
        {
          id: generateId(),
          content: 'Meeting notes:\n- Discussed new feature priorities\n- Need to update dependencies\n- Next review on Friday',
          createdAt: now(),
          updatedAt: now(),
        },
      ],
      activeNoteId: null,

      addNote: (content) =>
        set((state) => {
          const newNote = {
            id: generateId(),
            content,
            createdAt: now(),
            updatedAt: now(),
          }
          return {
            notes: [newNote, ...state.notes],
            activeNoteId: newNote.id,
          }
        }),

      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, content, updatedAt: now() }
              : note
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        })),

      setActiveNote: (id) =>
        set(() => ({
          activeNoteId: id,
        })),
    }),
    {
      name: 'notes-storage',
    }
  )
)