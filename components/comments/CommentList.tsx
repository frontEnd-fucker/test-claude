'use client'

import { Comment } from '@/types/database'
import CommentItem from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  onReply: (commentId: string) => void
  canCreate: boolean
  depth?: number
}

export default function CommentList({
  comments,
  onReply,
  canCreate,
  depth = 0,
}: CommentListProps) {
  const maxDepth = 3 // Limit nesting depth for better UX

  if (depth >= maxDepth) {
    return (
      <div className="pl-6 border-l-2 border-muted">
        <p className="text-sm text-muted-foreground italic p-3">
          Replies are nested too deep to display
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className={depth > 0 ? 'pl-6 border-l-2 border-muted' : ''}>
          <CommentItem
            comment={comment}
            onReply={onReply}
            canCreate={canCreate}
            depth={depth}
          />
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <CommentList
                comments={comment.replies}
                onReply={onReply}
                canCreate={canCreate}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}