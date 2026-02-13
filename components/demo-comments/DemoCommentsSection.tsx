'use client'

import { useState, useRef } from 'react'
import {
  DemoComment,
  MockUser,
  mockComments,
  mockUsers,
  getUserById,
} from '@/lib/demo-mock'
import { DemoCommentList } from './DemoCommentList'
import { DemoCommentInput } from './DemoCommentInput'

export function DemoCommentsSection() {
  const [comments, setComments] = useState<DemoComment[]>(mockComments)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [replyingTo, setReplyingTo] = useState<{
    comment: DemoComment
    user: MockUser
  } | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 当前登录用户（模拟）
  const currentUser = mockUsers[0]

  const handleReply = (comment: DemoComment, user: MockUser) => {
    setReplyingTo({ comment, user })
    setInputValue('')
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setInputValue('')
  }

  const handleSubmit = async () => {
    if (!inputValue.trim()) return

    setSubmitting(true)

    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    let newComment: DemoComment

    if (replyingTo) {
      // 回复评论
      const newId = `c${Date.now()}`
      // 回复主评论不需要 @name，回复二级评论需要
      const content = replyingTo.comment.parentId
        ? `@${replyingTo.user.name} ${inputValue.trim()}`
        : inputValue.trim()

      newComment = {
        id: newId,
        userId: currentUser.id,
        content,
        createdAt: new Date(),
        parentId: replyingTo.comment.id,
      }

      // 更新评论列表
      setComments((prev) =>
        prev.map((c) => {
          // 如果被回复的是一级评论，直接添加到其 replies
          if (c.id === replyingTo.comment.id) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            }
          }
          // 如果被回复的是二级评论，找到其父评论并添加
          if (c.id === replyingTo.comment.parentId) {
            return {
              ...c,
              replies: [...(c.replies || []), newComment],
            }
          }
          return c
        })
      )
    } else {
      // 新建一级评论
      const newId = `c${Date.now()}`
      newComment = {
        id: newId,
        userId: currentUser.id,
        content: inputValue,
        createdAt: new Date(),
        parentId: null,
        replies: [],
      }

      setComments((prev) => [newComment, ...prev])
    }

    setInputValue('')
    setReplyingTo(null)
    setSubmitting(false)
  }

  return (
    <div className="demo-comments-section">
      <h2 className="demo-comments-title">评论 ({comments.length})</h2>

      <DemoCommentInput
        placeholder={replyingTo ? `回复 @${replyingTo.user.name}` : '写下你的评论...'}
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onCancel={handleCancelReply}
        replyPrefix={replyingTo ? `@${replyingTo.user.name}` : null}
        submitting={submitting}
        inputRef={inputRef}
      />

      <DemoCommentList
        comments={comments}
        users={mockUsers}
        onReply={handleReply}
      />
    </div>
  )
}
