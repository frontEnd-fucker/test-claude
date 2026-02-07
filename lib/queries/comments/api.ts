import { createClient } from '@/lib/supabase/client'
import { Comment, InsertComment, UpdateComment } from '@/types/database'

/**
 * Fetch comments for a task or project
 * Supports nested replies by building a tree structure
 */
export async function fetchComments(options?: {
  taskId?: string
  projectId?: string
}): Promise<Comment[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  if (!options?.taskId && !options?.projectId) {
    throw new Error('Either taskId or projectId must be provided')
  }

  let query = supabase
    .from('comments')
    .select(`
      *,
      user:profiles!comments_user_id_fkey (
        id,
        email,
        name,
        avatar_url
      )
    `)

  if (options?.taskId) {
    query = query.eq('task_id', options.taskId)
  } else if (options?.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  query = query.order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  const comments = data.map(comment => ({
    id: comment.id,
    content: comment.content,
    taskId: comment.task_id,
    projectId: comment.project_id,
    parentId: comment.parent_id,
    userId: comment.user_id,
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at),
    user: comment.user ? {
      id: comment.user.id,
      email: comment.user.email,
      name: comment.user.name,
      avatarUrl: comment.user.avatar_url,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined
  })) as Comment[]

  // Build nested structure for replies
  return buildCommentTree(comments)
}

/**
 * Build a tree structure from flat comments array
 */
function buildCommentTree(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  // First pass: create map and find root comments
  comments.forEach(comment => {
    comment.replies = []
    commentMap.set(comment.id, comment)

    if (!comment.parentId) {
      rootComments.push(comment)
    }
  })

  // Second pass: build tree structure
  comments.forEach(comment => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(comment)
      }
    }
  })

  // Sort root comments by creation date (newest first)
  rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // Sort replies within each comment (oldest first)
  rootComments.forEach(comment => {
    if (comment.replies) {
      comment.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    }
  })

  return rootComments
}

/**
 * Create a new comment
 */
export async function createComment(
  commentData: InsertComment
): Promise<Comment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  if (!commentData.taskId && !commentData.projectId) {
    throw new Error('Either taskId or projectId must be provided')
  }

  // Convert camelCase to snake_case for database fields
  const dbComment: Record<string, unknown> = {
    content: commentData.content,
    user_id: user.id,
  }

  if (commentData.taskId) {
    dbComment.task_id = commentData.taskId
  } else if (commentData.projectId) {
    dbComment.project_id = commentData.projectId
  }

  if (commentData.parentId) {
    dbComment.parent_id = commentData.parentId
  }

  const { data: newComment, error } = await supabase
    .from('comments')
    .insert(dbComment)
    .select(`
      *,
      user:profiles!comments_user_id_fkey (
        id,
        email,
        name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: newComment.id,
    content: newComment.content,
    taskId: newComment.task_id,
    projectId: newComment.project_id,
    parentId: newComment.parent_id,
    userId: newComment.user_id,
    createdAt: new Date(newComment.created_at),
    updatedAt: new Date(newComment.updated_at),
    user: newComment.user ? {
      id: newComment.user.id,
      email: newComment.user.email,
      name: newComment.user.name,
      avatarUrl: newComment.user.avatar_url,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined
  } as Comment
}

/**
 * Update a comment
 */
export async function updateComment(
  id: string,
  updates: UpdateComment
): Promise<Comment> {
  const supabase = createClient()

  // Convert camelCase to snake_case for database fields
  const dbUpdates: Record<string, unknown> = {}
  if (updates.content !== undefined) dbUpdates.content = updates.content

  dbUpdates.updated_at = new Date().toISOString()

  const { data: updatedComment, error } = await supabase
    .from('comments')
    .update(dbUpdates)
    .eq('id', id)
    .select(`
      *,
      user:profiles!comments_user_id_fkey (
        id,
        email,
        name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: updatedComment.id,
    content: updatedComment.content,
    taskId: updatedComment.task_id,
    projectId: updatedComment.project_id,
    parentId: updatedComment.parent_id,
    userId: updatedComment.user_id,
    createdAt: new Date(updatedComment.created_at),
    updatedAt: new Date(updatedComment.updated_at),
    user: updatedComment.user ? {
      id: updatedComment.user.id,
      email: updatedComment.user.email,
      name: updatedComment.user.name,
      avatarUrl: updatedComment.user.avatar_url,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined
  } as Comment
}

/**
 * Delete a comment
 */
export async function deleteComment(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Get a single comment by ID
 */
export async function getComment(id: string): Promise<Comment> {
  const supabase = createClient()

  const { data: comment, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles!comments_user_id_fkey (
        id,
        email,
        name,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  // Convert database snake_case to TypeScript camelCase
  return {
    id: comment.id,
    content: comment.content,
    taskId: comment.task_id,
    projectId: comment.project_id,
    parentId: comment.parent_id,
    userId: comment.user_id,
    createdAt: new Date(comment.created_at),
    updatedAt: new Date(comment.updated_at),
    user: comment.user ? {
      id: comment.user.id,
      email: comment.user.email,
      name: comment.user.name,
      avatarUrl: comment.user.avatar_url,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined
  } as Comment
}