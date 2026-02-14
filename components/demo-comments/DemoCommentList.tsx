'use client'

import { Comment } from '@/types/database'
import { DemoCommentItem } from './DemoCommentItem'

interface DemoCommentListProps {
  comments: Comment[]
  onReply?: (comment: Comment, user: NonNullable<Comment['user']>) => void
}

export function DemoCommentList({ comments, onReply }: DemoCommentListProps) {
  // 只渲染一级评论
  const topLevelComments = comments.filter((c) => !c.parentId)

  return (
    <div className="demo-comment-list">
      {topLevelComments.map((comment) => {
        if (!comment.user) return null

        return (
          <div key={comment.id} className="demo-comment-thread">
            <DemoCommentItem
              comment={comment}
              user={comment.user}
              onReply={onReply}
            />
            {/* 渲染二级评论 */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="demo-comment-replies">
                {comment.replies.map((reply) => {
                  if (!reply.user) return null

                  return (
                    <DemoCommentItem
                      key={reply.id}
                      comment={reply}
                      user={reply.user}
                      isReply={true}
                      onReply={onReply}
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
