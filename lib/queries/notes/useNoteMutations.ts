import { useMutation, useQueryClient } from '@tanstack/react-query'
import { noteKeys } from './query-keys'
import { createNote, updateNote, deleteNote } from './api'
import { Note } from '@/types/database'

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      title: string
      content: string
      tags?: string[]
      projectId?: string
    }) => createNote(params.title, params.content, params.tags, params.projectId),
    onMutate: async (params) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: noteKeys.all })

      // Snapshot the previous value
      const previousNotes = queryClient.getQueriesData<Note[]>({
        queryKey: noteKeys.all,
      })

      // Optimistically create a new note
      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        title: params.title,
        content: params.content,
        tags: params.tags || [],
        isArchived: false,
        userId: 'temp-user',
        projectId: params.projectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Update all note lists
      previousNotes.forEach(([queryKey, notes = []]) => {
        queryClient.setQueryData(queryKey, [optimisticNote, ...notes])
      })

      return { previousNotes }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        context.previousNotes.forEach(([queryKey, notes]) => {
          queryClient.setQueryData(queryKey, notes)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; updates: Parameters<typeof updateNote>[1] }) =>
      updateNote(params.id, params.updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: noteKeys.all })

      // Snapshot the previous value
      const previousNotes = queryClient.getQueriesData<Note[]>({
        queryKey: noteKeys.all,
      })

      // Optimistically update the note
      previousNotes.forEach(([queryKey, notes = []]) => {
        const updatedNotes = notes.map(note =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
        queryClient.setQueryData(queryKey, updatedNotes)
      })

      return { previousNotes }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        context.previousNotes.forEach(([queryKey, notes]) => {
          queryClient.setQueryData(queryKey, notes)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate the specific note and all lists
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: noteKeys.all })

      // Snapshot the previous value
      const previousNotes = queryClient.getQueriesData<Note[]>({
        queryKey: noteKeys.all,
      })

      // Optimistically remove the note
      previousNotes.forEach(([queryKey, notes = []]) => {
        const updatedNotes = notes.filter(note => note.id !== id)
        queryClient.setQueryData(queryKey, updatedNotes)
      })

      return { previousNotes }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        context.previousNotes.forEach(([queryKey, notes]) => {
          queryClient.setQueryData(queryKey, notes)
        })
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
    },
  })
}