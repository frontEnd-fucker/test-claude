'use client'

import { useState } from 'react'
import { Comment } from '@/types/database'
import { useUpdateComment, useDeleteComment } from '@/lib/queries/comments'
import { useProjectMember } from '@/lib/queries/members'
import { canDeleteComments } from '@/lib/permissions/project'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  Check,
  X,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommentItemProps {
  comment: Comment
  onReply: (commentId: string) => void
  canCreate: boolean
  depth: number
}

export default function CommentItem({
  comment,
  onReply,
  canCreate,
  depth,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  // Fetch user's project member info for permissions
  const { data: member } = useProjectMember(comment.projectId)

  const updateCommentMutation = useUpdateComment()
  const deleteCommentMutation = useDeleteComment()

  const isAuthor = comment.userId === member?.userId
  const canDelete = canDeleteComments(isAuthor, member || null)
  const canEdit = isAuthor

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
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(comment.id)
    }
  }

  const handleCancelEdit = () => {
    setEditContent(comment.content)
    setIsEditing(false)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <Card className={cn('p-4', depth > 0 && 'bg-muted/30')}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user?.avatarUrl} />
          <AvatarFallback className="text-xs">
            {getUserInitials(comment.user?.name, comment.user?.email)}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {comment.user?.name || comment.user?.email || 'Unknown User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                  {comment.updatedAt.getTime() !== comment.createdAt.getTime() && ' (edited)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={updateCommentMutation.isPending}
                >
                  <X className="mr-2 h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || updateCommentMutation.isPending}
                >
                  {updateCommentMutation.isPending && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  <Check className="mr-2 h-3 w-3" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

              {/* Reply button */}
              {canCreate && depth < 2 && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply(comment.id)}
                  >
                    <Reply className="mr-2 h-3 w-3" />
                    Reply
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}