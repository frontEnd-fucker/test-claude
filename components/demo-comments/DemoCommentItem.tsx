'use client'

import { DemoComment, MockUser, getUserById, formatTimeAgo } from '@/lib/demo-mock'
import { MessageSquare } from 'lucide-react'

interface DemoCommentItemProps {
  comment: DemoComment
  user: MockUser
  isReply?: boolean
  onReply?: (comment: DemoComment, user: MockUser) => void
}

export function DemoCommentItem({
  comment,
  user,
  isReply = false,
  onReply,
}: DemoCommentItemProps) {
  return (
    <div className={`demo-comment-item ${isReply ? 'is-reply' : ''}`}>
      <div className="demo-comment-avatar">
        <img src={user.avatar} alt={user.name} />
      </div>
      <div
        className="demo-comment-content"
        onClick={() => onReply?.(comment, user)}
        style={{ cursor: 'pointer' }}
      >
        <div className="demo-comment-header">
          <span className="demo-comment-author">{user.name}</span>
          <span className="demo-comment-time">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <div className="demo-comment-text">{comment.content}</div>
        {!isReply && (
          <span className="demo-comment-reply-btn">
            回复 ({comment.replies?.length || 0})
          </span>
        )}
        {isReply && (
          <span className="demo-comment-reply-btn" title="回复">
            <MessageSquare size={14} />
          </span>
        )}
      </div>
    </div>
  )
}
