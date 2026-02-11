'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { commentKeys } from './query-keys'
import { createComment, updateComment, deleteComment } from './api'
import { Comment, InsertComment, UpdateComment } from '@/types/database'

export function useCreateComment() {
  const queryClient = useQueryClient()
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  return useMutation({
    mutationFn: (commentData: InsertComment) => {
      // Use route projectId if not provided
      const data = { ...commentData }
      if (!data.taskId && !data.projectId && routeProjectId) {
        data.projectId = routeProjectId
      }
      return createComment(data)
    },
    onMutate: async (commentData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentKeys.all })

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData<Comment | Comment[]>({
        queryKey: commentKeys.all,
      })

      // Optimistically create a new comment
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        content: commentData.content,
        taskId: commentData.taskId,
        projectId: commentData.projectId,
        parentId: commentData.parentId,
        userId: 'temp-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: undefined, // Will be populated on success
      }

      // Update all comment lists
      previousQueries.forEach(([queryKey, data]) => {
        if (Array.isArray(data)) {
          // List query - add new comment
          const newData = [...data, optimisticComment]
          queryClient.setQueryData(queryKey, newData)
        }
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      const filters = variables.taskId
        ? { taskId: variables.taskId }
        : variables.projectId
          ? { projectId: variables.projectId }
          : {}
      queryClient.invalidateQueries({ queryKey: commentKeys.list(filters) })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; updates: UpdateComment }) =>
      updateComment(params.id, params.updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentKeys.all })

      // Snapshot the previous value
      const previousComments = queryClient.getQueriesData<Comment[]>({
        queryKey: commentKeys.all,
      })

      // Optimistically update the comment
      previousComments.forEach(([queryKey, comments = []]) => {
        const updateCommentInTree = (commentList: Comment[]): Comment[] => {
          return commentList.map(comment => {
            if (comment.id === id) {
              return { ...comment, ...updates, updatedAt: new Date() }
            }
            if (comment.replies && comment.replies.length > 0) {
              return { ...comment, replies: updateCommentInTree(comment.replies) }
            }
            return comment
          })
        }

        const updatedComments = updateCommentInTree(comments)
        queryClient.setQueryData(queryKey, updatedComments)
      })

      return { previousComments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        context.previousComments.forEach(([queryKey, comments]) => {
          queryClient.setQueryData(queryKey, comments)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Invalidate the specific comment and all lists
      queryClient.invalidateQueries({ queryKey: commentKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()
  const params = useParams()
  const routeProjectId = params.id as string | undefined

  return useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentKeys.all })

      // Snapshot the previous value
      const previousComments = queryClient.getQueriesData<Comment[]>({
        queryKey: commentKeys.all,
      })

      // Optimistically remove the comment
      previousComments.forEach(([queryKey, comments = []]) => {
        const removeCommentFromTree = (commentList: Comment[]): Comment[] => {
          return commentList.filter(comment => {
            if (comment.id === id) return false
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = removeCommentFromTree(comment.replies)
            }
            return true
          })
        }

        const updatedComments = removeCommentFromTree(comments)
        queryClient.setQueryData(queryKey, updatedComments)
      })

      return { previousComments }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousComments) {
        context.previousComments.forEach(([queryKey, comments]) => {
          queryClient.setQueryData(queryKey, comments)
        })
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}