'use client'

import { useState, memo } from 'react'
import { Comment } from '@/types/database'
import { useUpdateComment, useDeleteComment } from '@/lib/queries/comments'
import { canDeleteComments } from '@/lib/permissions/project'
import { formatTimeAgo } from '@/lib/utils'
import { MessageSquare, Edit, Trash2, Check, X, Loader2 } from 'lucide-react'

// 简化类型定义
type CommentUser = NonNullable<Comment['user']>

interface CommentItemProps {
  comment: Comment
  user: CommentUser
  isReply?: boolean
  onReply?: (comment: Comment, user: CommentUser) => void
  canCreate?: boolean
  member?: CommentUser
}

function CommentItemInner({
  comment,
  user,
  isReply = false,
  onReply,
  canCreate = false,
  member,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const updateCommentMutation = useUpdateComment()
  const deleteCommentMutation = useDeleteComment()

  // 使用传入的 member 信息，避免重复查询
  // member.id 是当前登录用户的 ID，comment.userId 是评论作者的 ID
  const isAuthor = comment.userId === member?.id
  const canDelete = canDeleteComments(isAuthor, member)

  const handleSaveEdit = () => {
    if (!editContent.trim()) return

    updateCommentMutation.mutate(
      { id: comment.id, updates: { content: editContent.trim() } },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      }
    )
  }

  const handleDelete = () => {
    if (window.confirm('确定要删除这条评论吗？')) {
      deleteCommentMutation.mutate(comment.id)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  const handleContentClick = () => {
    if (!isEditing && canCreate) {
      onReply?.(comment, user)
    }
  }

  return (
    <div className={`flex gap-3 ${isReply ? 'pl-6' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name || '用户'}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted dark:bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-card-foreground">
            {user.name || user.email || '未知用户'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.createdAt)}
          </span>

          {/* Actions */}
          {(canEdit || canDelete) && !isReply && (
            <div className="ml-auto flex gap-1" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <button
                  type="button"
                  className="p-1 bg-none border-none cursor-pointer text-muted-foreground rounded hover:text-foreground dark:hover:text-foreground transition-colors"
                  onClick={() => setIsEditing(true)}
                  title="编辑"
                >
                  <Edit size={14} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  className="p-1 bg-none border-none cursor-pointer text-muted-foreground rounded hover:text-destructive transition-colors"
                  onClick={handleDelete}
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment content */}
        {isEditing ? (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-input bg-background dark:bg-input/30 rounded-md text-sm font-inherit resize-vertical focus:outline-none focus:ring-2 focus:ring-ring/10"
              rows={2}
              disabled={updateCommentMutation.isPending}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1 bg-none border-none cursor-pointer text-sm text-muted-foreground rounded hover:text-foreground transition-colors disabled:opacity-50"
                onClick={handleCancelEdit}
                disabled={updateCommentMutation.isPending}
              >
                <X size={14} className="inline mr-1" /> 取消
              </button>
              <button
                type="button"
                className="px-3 py-1 bg-primary text-primary-foreground border-none rounded-md text-sm cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || updateCommentMutation.isPending}
              >
                {updateCommentMutation.isPending && <Loader2 size={14} className="inline mr-1 animate-spin" />}
                <Check size={14} className="inline mr-1" /> 保存
              </button>
            </div>
          </div>
        ) : (
          <div
            className="cursor-pointer"
            onClick={handleContentClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleContentClick()
              }
            }}
          >
            <p className="text-sm text-card-foreground leading-relaxed break-words hover:text-primary/80 dark:hover:text-primary transition-colors">
              {comment.content}
            </p>
            {!isReply && (
              <span className="mt-1 block text-xs text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors">
                回复 ({comment.replies?.length || 0})
              </span>
            )}
            {isReply && (
              <span className="mt-1 inline-flex items-center text-xs text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors">
                <MessageSquare size={14} className="mr-1" />
                回复
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 使用 React.memo 避免父组件状态变化时重新渲染所有评论项
export const CommentItem = memo(CommentItemInner)

export default CommentItem
