import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskStatus, PriorityLevel } from '@/types/database'

interface TaskInput {
  title: string
  description?: string
  priority?: PriorityLevel
  status?: TaskStatus
  projectId?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tasks } = body as { tasks: TaskInput[] }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json(
        { error: 'tasks must be a non-empty array' },
        { status: 400 }
      )
    }

    const status = tasks[0]?.status || 'todo'

    // Get max position for the status column
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('position')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('position', { ascending: false })
      .limit(1)

    const startPosition = existingTasks && existingTasks.length > 0
      ? existingTasks[0].position
      : 0

    // Prepare batch insert data
    const insertData = tasks.map((task, index) => ({
      title: task.title,
      description: task.description || null,
      priority: task.priority || null,
      status: status,
      position: startPosition + index + 1,
      project_id: task.projectId || null,
      user_id: user.id,
    }))

    // Batch insert
    const { data: newTasks, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Batch insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Convert to Task format
    const result: Task[] = newTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status as TaskStatus,
      priority: task.priority as PriorityLevel | undefined,
      position: task.position,
      dueDate: task.due_date ? new Date(task.due_date) : undefined,
      projectId: task.project_id,
      userId: task.user_id,
      assigneeId: task.assignee_id || undefined,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
    }))

    return NextResponse.json({ tasks: result })
  } catch (error) {
    console.error('Batch create tasks error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
