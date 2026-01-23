import { createClient } from '@/lib/supabase/client'
import { Project, InsertProject, UpdateProject } from '@/types/database'

/**
 * Fetch projects for the current user
 */
export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Convert database timestamps to Date objects
  const projects = data.map(project => ({
    ...project,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at),
  })) as Project[]

  return projects
}

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: newProject, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  // Convert database timestamps to Date objects
  return {
    ...newProject,
    createdAt: new Date(newProject.created_at),
    updatedAt: new Date(newProject.updated_at),
  } as Project
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  updates: UpdateProject
): Promise<Project> {
  const supabase = createClient()

  // Convert camelCase to snake_case for database fields
  const dbUpdates: Record<string, unknown> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.description !== undefined) dbUpdates.description = updates.description

  dbUpdates.updated_at = new Date().toISOString()

  const { data: updatedProject, error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Convert database timestamps to Date objects
  return {
    ...updatedProject,
    createdAt: new Date(updatedProject.created_at),
    updatedAt: new Date(updatedProject.updated_at),
  } as Project
}

/**
 * Delete a project with cascade deletion of related tasks, todos, and notes
 */
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()

  // Start a transaction-like sequence (Supabase doesn't have explicit transactions in JS)
  // First delete related tasks
  const { error: tasksError } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', id)

  if (tasksError) throw tasksError

  // Delete related todos
  const { error: todosError } = await supabase
    .from('todos')
    .delete()
    .eq('project_id', id)

  if (todosError) throw todosError

  // Delete related notes
  const { error: notesError } = await supabase
    .from('notes')
    .delete()
    .eq('project_id', id)

  if (notesError) throw notesError

  // Finally delete the project itself
  const { error: projectError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (projectError) throw projectError
}

/**
 * Fetch a single project by ID
 */
export async function fetchProject(id: string): Promise<Project> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user can only access their own projects
    .single()

  if (error) throw error

  // Convert database timestamps to Date objects
  return {
    ...project,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at),
  } as Project
}

/**
 * Get project statistics (task counts, todo counts, etc.)
 */
export async function getProjectStats(id: string): Promise<{
  taskCount: number
  todoCount: number
  noteCount: number
}> {
  const supabase = createClient()

  // Count tasks in this project
  const { count: taskCount, error: taskError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  if (taskError) throw taskError

  // Count todos in this project
  const { count: todoCount, error: todoError } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  if (todoError) throw todoError

  // Count notes in this project
  const { count: noteCount, error: noteError } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id)

  if (noteError) throw noteError

  return {
    taskCount: taskCount || 0,
    todoCount: todoCount || 0,
    noteCount: noteCount || 0,
  }
}