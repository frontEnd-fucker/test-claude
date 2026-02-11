import { createClient } from '@/lib/supabase/client'
import { Task, TaskStatus, PriorityLevel } from '@/types/database'

/**
 * Fetch tasks for the current user
 */
export async function fetchTasks(projectId?: string): Promise<Task[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('tasks')
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
  const tasks = data.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as PriorityLevel | undefined,
    position: task.position,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    projectId: task.project_id,
    userId: task.user_id,
    assigneeId: task.assignee_id || undefined,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
  })) as Task[]

  return tasks
}

/**
 * Fetch a single task by ID
 */
export async function fetchTask(id: string): Promise<Task> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as PriorityLevel | undefined,
    position: task.position,
    dueDate: task.due_date ? new Date(task.due_date) : undefined,
    projectId: task.project_id,
    userId: task.user_id,
    assigneeId: task.assignee_id || undefined,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
  } as Task
}

/**
 * Create a new task
 */
export async function createTask(
  title: string,
  description?: string,
  priority?: PriorityLevel,
  status: TaskStatus = 'todo',
  projectId?: string
): Promise<Task> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get max position for the status column
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = existingTasks && existingTasks.length > 0 ? existingTasks[0].position : 0
  const position = maxPosition + 1

  const { data: newTask, error } = await supabase
    .from('tasks')
    .insert({
      title,
      description,
      priority,
      status,
      position,
      project_id: projectId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: newTask.id,
    title: newTask.title,
    description: newTask.description,
    status: newTask.status as TaskStatus,
    priority: newTask.priority as PriorityLevel | undefined,
    position: newTask.position,
    dueDate: newTask.due_date ? new Date(newTask.due_date) : undefined,
    projectId: newTask.project_id,
    userId: newTask.user_id,
    assigneeId: newTask.assignee_id || undefined,
    createdAt: new Date(newTask.created_at),
    updatedAt: new Date(newTask.updated_at),
  } as Task
}

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<Task> {
  console.log('updateTask API called:', { id, updates })
  const supabase = createClient()

  // Convert camelCase to snake_case for database fields
  const dbUpdates: Record<string, unknown> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.position !== undefined) dbUpdates.position = updates.position
  if ('dueDate' in updates) {
    // Convert undefined to null for Supabase, Date to ISO string
    dbUpdates.due_date = updates.dueDate === undefined ? null : updates.dueDate?.toISOString()
  }
  if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId
  if ('assigneeId' in updates) {
    // Convert undefined to null for Supabase
    dbUpdates.assignee_id = updates.assigneeId === undefined ? null : updates.assigneeId
    console.log('Assignee update:', { assigneeId: updates.assigneeId, db_assignee_id: dbUpdates.assignee_id })
  }

  dbUpdates.updated_at = new Date().toISOString()

  console.log('Database updates to apply:', dbUpdates)

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Supabase update error:', error)
    throw error
  }

  console.log('Task update successful:', { id: updatedTask.id, assignee_id: updatedTask.assignee_id })

  // Convert database snake_case to TypeScript camelCase
  return {
    id: updatedTask.id,
    title: updatedTask.title,
    description: updatedTask.description,
    status: updatedTask.status as TaskStatus,
    priority: updatedTask.priority as PriorityLevel | undefined,
    position: updatedTask.position,
    dueDate: updatedTask.due_date ? new Date(updatedTask.due_date) : undefined,
    projectId: updatedTask.project_id,
    userId: updatedTask.user_id,
    assigneeId: updatedTask.assignee_id || undefined,
    createdAt: new Date(updatedTask.created_at),
    updatedAt: new Date(updatedTask.updated_at),
  } as Task
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Reorder tasks within a column
 */
export async function reorderTasks(
  status: TaskStatus,
  startIndex: number,
  endIndex: number,
  projectId?: string
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Fetch all tasks in the column
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: tasks, error: fetchError } = await query
    .order('position', { ascending: true })

  if (fetchError) throw fetchError

  if (startIndex === endIndex) {
    return
  }

  const reorderedTasks = [...tasks]
  const [movedTask] = reorderedTasks.splice(startIndex, 1)
  reorderedTasks.splice(endIndex, 0, movedTask)

  // Update positions for all tasks in the column
  const updates = reorderedTasks.map((task, index) => ({
    id: task.id,
    position: index + 1,
  }))

  // Batch update positions
  for (const update of updates) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: update.position, updated_at: new Date().toISOString() })
      .eq('id', update.id)

    if (error) throw error
  }
}

/**
 * Move task between columns and reorder
 */
export async function moveTaskBetweenColumns(
  sourceStatus: TaskStatus,
  destinationStatus: TaskStatus,
  sourceIndex: number,
  destinationIndex: number,
  projectId?: string
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  // Fetch all tasks for both columns
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .in('status', [sourceStatus, destinationStatus])

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: allTasks, error: fetchError } = await query
    .order('position', { ascending: true })

  if (fetchError) throw fetchError

  // Separate tasks by status
  const sourceTasks = allTasks.filter(task => task.status === sourceStatus)
  const destinationTasks = allTasks.filter(task => task.status === destinationStatus)

  // Find the task being moved
  const [movedTask] = sourceTasks.splice(sourceIndex, 1)

  if (!movedTask) {
    throw new Error('Task not found')
  }

  // Update moved task status and insert at destination position
  movedTask.status = destinationStatus
  destinationTasks.splice(destinationIndex, 0, movedTask)

  // Update moved task status and position
  const movedTaskNewIndex = destinationIndex
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      status: destinationStatus,
      position: movedTaskNewIndex + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', movedTask.id)

  if (updateError) throw updateError

  // Update positions for source column
  const sourceUpdates = sourceTasks.map((task, index) => ({
    id: task.id,
    position: index + 1,
  }))

  for (const update of sourceUpdates) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: update.position, updated_at: new Date().toISOString() })
      .eq('id', update.id)

    if (error) throw error
  }

  // Update positions for destination column
  const destinationUpdates = destinationTasks.map((task, index) => ({
    id: task.id,
    position: index + 1,
  }))

  for (const update of destinationUpdates) {
    const { error } = await supabase
      .from('tasks')
      .update({ position: update.position, updated_at: new Date().toISOString() })
      .eq('id', update.id)

    if (error) throw error
  }
}