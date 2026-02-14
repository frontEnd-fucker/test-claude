'use client'

import { Comment, User } from '@/types/database'
import { formatTimeAgo } from '@/lib/utils'
import { MessageSquare } from 'lucide-react'

interface DemoCommentItemProps {
  comment: Comment
  user: User
  isReply?: boolean
  onReply?: (comment: Comment, user: User) => void
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
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name || '用户'} />
        ) : (
          <div className="demo-comment-avatar-placeholder">
            {user.name?.charAt(0) || 'U'}
          </div>
        )}
      </div>
      <div
        className="demo-comment-content"
        onClick={() => onReply?.(comment, user)}
        style={{ cursor: 'pointer' }}
      >
        <div className="demo-comment-header">
          <span className="demo-comment-author">{user.name || user.email || '未知用户'}</span>
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
