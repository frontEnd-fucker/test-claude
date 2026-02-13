'use client'

import { DemoComment, MockUser, getUserById } from '@/lib/demo-mock'
import { DemoCommentItem } from './DemoCommentItem'

interface DemoCommentListProps {
  comments: DemoComment[]
  users: MockUser[]
  onReply?: (comment: DemoComment, user: MockUser) => void
}

export function DemoCommentList({ comments, users, onReply }: DemoCommentListProps) {
  // 只渲染一级评论
  const topLevelComments = comments.filter((c) => c.parentId === null)

  return (
    <div className="demo-comment-list">
      {topLevelComments.map((comment) => {
        const commentUser = getUserById(comment.userId)
        if (!commentUser) return null

        return (
          <div key={comment.id} className="demo-comment-thread">
            <DemoCommentItem
              comment={comment}
              user={commentUser}
              onReply={onReply}
            />
            {/* 渲染二级评论 */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="demo-comment-replies">
                {comment.replies.map((reply) => {
                  const replyUser = getUserById(reply.userId)
                  if (!replyUser) return null

                  return (
                    <DemoCommentItem
                      key={reply.id}
                      comment={reply}
                      user={replyUser}
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
