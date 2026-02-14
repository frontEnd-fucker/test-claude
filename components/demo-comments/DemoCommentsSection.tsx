'use client'

import { useState, useRef } from 'react'
import { Comment, InsertComment } from '@/types/database'
import { useComments, useCreateComment } from '@/lib/queries/comments'
import { DemoCommentList } from './DemoCommentList'
import { DemoCommentInput } from './DemoCommentInput'

// 固定的项目 ID
const PROJECT_ID = '3c482fc0-756f-486b-bf4f-3c99bcbb1d0d'

export function DemoCommentsSection() {
  // 使用真实 API 获取评论
  const { data: comments = [], isLoading, error } = useComments({ projectId: PROJECT_ID })
  const createComment = useCreateComment()

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [replyingTo, setReplyingTo] = useState<{
    comment: Comment
    user: NonNullable<Comment['user']>
  } | null>(null)
  const [inputValue, setInputValue] = useState('')

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
      projectId: PROJECT_ID,
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
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  if (isLoading) {
    return <div className="demo-comments-section">加载中...</div>
  }

  if (error) {
    return <div className="demo-comments-section">加载评论失败</div>
  }

  return (
    <div className="demo-comments-section">
      <h2 className="demo-comments-title">评论 ({comments.length})</h2>

      <DemoCommentInput
        placeholder={replyingTo ? `回复 @${replyingTo.user.name || replyingTo.user.email?.split('@')[0] || '用户'}:` : '写下你的评论...'}
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onCancel={handleCancelReply}
        replyPrefix={replyingTo ? `回复@${replyingTo.user.name || replyingTo.user.email?.split('@')[0] || '用户'}:` : null}
        submitting={createComment.isPending}
        inputRef={inputRef}
      />

      <DemoCommentList
        comments={comments}
        onReply={handleReply}
      />
    </div>
  )
}
