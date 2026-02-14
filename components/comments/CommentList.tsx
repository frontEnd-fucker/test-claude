'use client'

import { Comment, ProjectMember } from '@/types/database'
import { CommentItem } from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  onReply?: (comment: Comment, user: NonNullable<Comment['user']>) => void
  canCreate?: boolean
  member?: ProjectMember | null
}

export function CommentList({
  comments,
  onReply,
  canCreate = false,
  member,
}: CommentListProps) {
  // 只渲染一级评论
  const topLevelComments = comments.filter((c) => !c.parentId)

  return (
    <div className="flex flex-col gap-4">
      {topLevelComments.map((comment) => {
        if (!comment.user) return null

        return (
          <div key={comment.id} className="flex flex-col gap-3">
            <CommentItem
              comment={comment}
              user={comment.user}
              onReply={onReply}
              canCreate={canCreate}
              member={member}
            />
            {/* 渲染二级评论 */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="flex flex-col gap-3 pl-6 border-l-2 border-border">
                {comment.replies.map((reply) => {
                  if (!reply.user) return null

                  return (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      user={reply.user}
                      isReply={true}
                      onReply={onReply}
                      canCreate={canCreate}
                      member={member}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CommentList
