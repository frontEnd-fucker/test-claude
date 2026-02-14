'use client'

import { useState, useRef } from 'react'
import { Comment, InsertComment } from '@/types/database'
import { useComments, useCreateComment } from '@/lib/queries/comments'
import { useProjectMember } from '@/lib/queries/members'
import { canCreateComments, canDeleteComments } from '@/lib/permissions/project'
import { CommentInput } from './CommentInput'
import { CommentList } from './CommentList'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface CommentsSectionProps {
  taskId?: string
  projectId?: string
}

export function CommentsSection({ taskId, projectId }: CommentsSectionProps) {
  // 使用真实 API 获取评论
  const { data: comments = [], isLoading, error } = useComments({ taskId, projectId })
  const createComment = useCreateComment()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [replyingTo, setReplyingTo] = useState<{
    comment: Comment
    user: NonNullable<Comment['user']>
  } | null>(null)
  const [inputValue, setInputValue] = useState('')

  // 统一获取用户 member 信息，避免每个 CommentItem 重复查询
  const { data: member, isLoading: memberLoading } = useProjectMember(projectId)
  const canCreate = canCreateComments(member || null)

  const handleReply = (comment: Comment, user: NonNullable<Comment['user']>) => {
    setReplyingTo({ comment, user })
    setInputValue('')
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setInputValue('')
  }

  const handleSubmit = async () => {
    if (!inputValue.trim()) return

    // 获取被回复者的名称
    const replyUserName = replyingTo?.user.name || replyingTo?.user.email?.split('@')[0] || '用户'

    let content = inputValue.trim()

    // 判断是否是回复二级评论（二级评论有 parentId）
    const isReplyToSecondLevel = !!replyingTo?.comment.parentId

    // 回复二级评论时，自动在内容前加上 "回复@{name}: " 前缀
    if (isReplyToSecondLevel) {
      content = `回复@${replyUserName}: ${content}`
    }

    const commentData: InsertComment = {
      content,
      projectId,
      taskId,
    }

    if (replyingTo) {
      // 如果是回复二级评论，parentId 应该为主评论的 id
      // 如果是回复主评论，parentId 为被回复评论的 id
      commentData.parentId = isReplyToSecondLevel
        ? replyingTo.comment.parentId!
        : replyingTo.comment.id

      // 回复二级评论时添加 mention
      if (isReplyToSecondLevel) {
        commentData.mentionIds = [replyingTo.comment.userId]
      }
    }

    try {
      await createComment.mutateAsync(commentData)
      setInputValue('')
      setReplyingTo(null)
      toast.success('评论已发布')
    } catch (error) {
      toast.error('发布评论失败，请重试')
    }
  }

  if (isLoading || memberLoading) {
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

  if (error) {
    return (
      <div className="bg-card text-destructive rounded-xl p-6 shadow-sm border">
        <p className="text-sm">加载评论失败</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border dark:border-border">
      <h2 className="text-lg font-semibold mb-4 text-card-foreground">评论 ({comments.length})</h2>

      {canCreate && (
        <CommentInput
          placeholder={replyingTo ? `回复 @${replyingTo.user.name || replyingTo.user.email?.split('@')[0] || '用户'}:` : '写下你的评论...'}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onCancel={handleCancelReply}
          replyPrefix={replyingTo ? `回复@${replyingTo.user.name || replyingTo.user.email?.split('@')[0] || '用户'}:` : null}
          submitting={createComment.isPending}
          inputRef={inputRef}
        />
      )}

      <CommentList
        comments={comments}
        onReply={handleReply}
        canCreate={canCreate}
        member={member}
      />
    </div>
  )
}

export default CommentsSection
