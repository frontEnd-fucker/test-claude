'use client'

import { useState } from 'react'
import { useComments, useCreateComment } from '@/lib/queries/comments'
import { useProjectMember } from '@/lib/queries/members'
import { canCreateComments } from '@/lib/permissions/project'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react'
import CommentList from './CommentList'
import { Skeleton } from '@/components/ui/skeleton'

interface CommentsSectionProps {
  taskId?: string
  projectId?: string
}

export default function CommentsSection({ taskId, projectId }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useComments({ taskId, projectId })

  // Fetch user's project member info for permissions
  const { data: member, isLoading: memberLoading } = useProjectMember(projectId)

  const createCommentMutation = useCreateComment()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    createCommentMutation.mutate(
      {
        content: newComment.trim(),
        taskId,
        projectId,
        parentId: replyingTo || undefined,
      },
      {
        onSuccess: () => {
          setNewComment('')
          setReplyingTo(null)
        },
      }
    )
  }

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId)
    // Scroll to comment form
    setTimeout(() => {
      const form = document.getElementById('comment-form')
      form?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
  }

  const canCreate = canCreateComments(member || null)

  if (commentsLoading || memberLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (commentsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Error loading comments</h3>
        </div>
        <p className="mt-1 text-sm">{commentsError.message}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => refetchComments()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
        </div>
      </div>

      {/* Comment form */}
      {canCreate && (
        <Card className="p-4" id="comment-form">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  replyingTo
                    ? 'Write your reply...'
                    : 'Add a comment...'
                }
                className="min-h-[100px]"
                rows={3}
              />
              {replyingTo && (
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Replying to comment</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelReply}
                  >
                    Cancel reply
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={!newComment.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {replyingTo ? 'Reply' : 'Post Comment'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Comments list */}
      {comments.length > 0 ? (
        <CommentList
          comments={comments}
          onReply={handleReply}
          canCreate={canCreate}
        />
      ) : (
        <Card className="p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h4 className="mt-4 text-lg font-medium">No comments yet</h4>
          <p className="mt-2 text-sm text-muted-foreground">
            {canCreate
              ? 'Be the first to add a comment!'
              : 'No comments have been added yet.'}
          </p>
        </Card>
      )}
    </div>
  )
}