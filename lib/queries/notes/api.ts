import { createClient } from '@/lib/supabase/client'
import { Note } from '@/types/database'

/**
 * Fetch notes for the current user
 */
export async function fetchNotes(options?: {
  projectId?: string
  isArchived?: boolean
}): Promise<Note[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)

  if (options?.isArchived !== undefined) {
    query = query.eq('is_archived', options.isArchived)
  } else {
    // Default to non-archived notes
    query = query.eq('is_archived', false)
  }

  if (options?.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  query = query.order('updated_at', { ascending: false })

  const { data, error } = await query

  if (error) throw error

  // Convert database timestamps to Date objects
  const notes = data.map(note => ({
    ...note,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  })) as Note[]

  return notes
}

/**
 * Create a new note
 */
export async function createNote(
  title: string,
  content: string,
  tags: string[] = [],
  projectId?: string
): Promise<Note> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: newNote, error } = await supabase
    .from('notes')
    .insert({
      title,
      content,
      tags,
      is_archived: false,
      project_id: projectId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Convert database timestamps to Date objects
  return {
    ...newNote,
    createdAt: new Date(newNote.created_at),
    updatedAt: new Date(newNote.updated_at),
  } as Note
}

/**
 * Update a note
 */
export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<Note> {
  const supabase = createClient()

  // Convert camelCase to snake_case for database fields
  const dbUpdates: Record<string, unknown> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.content !== undefined) dbUpdates.content = updates.content
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags
  if (updates.isArchived !== undefined) dbUpdates.is_archived = updates.isArchived

  dbUpdates.updated_at = new Date().toISOString()

  const { data: updatedNote, error } = await supabase
    .from('notes')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Convert database timestamps to Date objects
  return {
    ...updatedNote,
    createdAt: new Date(updatedNote.created_at),
    updatedAt: new Date(updatedNote.updated_at),
  } as Note
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}