import { createClient } from '@/lib/supabase/client'
import { TodoItem } from '@/types/database'

/**
 * Fetch todos for the current user
 */
export async function fetchTodos(projectId?: string): Promise<TodoItem[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  const todos = data.map(todo => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    position: todo.position,
    dueDate: todo.due_date ? new Date(todo.due_date) : undefined,
    userId: todo.user_id,
    projectId: todo.project_id,
    createdAt: new Date(todo.created_at),
    updatedAt: new Date(todo.updated_at),
  })) as TodoItem[]

  return todos
}

/**
 * Create a new todo
 */
export async function createTodo(
  text: string,
  projectId?: string
): Promise<TodoItem> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get max position
  const { data: existingTodos } = await supabase
    .from('todos')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = existingTodos && existingTodos.length > 0 ? existingTodos[0].position : 0
  const position = maxPosition + 1

  const { data: newTodo, error } = await supabase
    .from('todos')
    .insert({
      text,
      completed: false,
      position,
      project_id: projectId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: newTodo.id,
    text: newTodo.text,
    completed: newTodo.completed,
    position: newTodo.position,
    dueDate: newTodo.due_date ? new Date(newTodo.due_date) : undefined,
    userId: newTodo.user_id,
    projectId: newTodo.project_id,
    createdAt: new Date(newTodo.created_at),
    updatedAt: new Date(newTodo.updated_at),
  } as TodoItem
}

/**
 * Toggle todo completion status
 */
export async function toggleTodo(id: string): Promise<TodoItem> {
  const supabase = createClient()

  // First get current todo
  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('completed')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const { data: updatedTodo, error } = await supabase
    .from('todos')
    .update({
      completed: !todo.completed,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: updatedTodo.id,
    text: updatedTodo.text,
    completed: updatedTodo.completed,
    position: updatedTodo.position,
    dueDate: updatedTodo.due_date ? new Date(updatedTodo.due_date) : undefined,
    userId: updatedTodo.user_id,
    projectId: updatedTodo.project_id,
    createdAt: new Date(updatedTodo.created_at),
    updatedAt: new Date(updatedTodo.updated_at),
  } as TodoItem
}

/**
 * Delete a todo
 */
export async function deleteTodo(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Clear completed todos
 */
export async function clearCompletedTodos(): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', user.id)
    .eq('completed', true)

  if (error) throw error
}